const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const yaml = require("js-yaml");

const app = express();
app.use(express.json({ limit: "15mb" })); // room for base64-encoded photo uploads

const OWNER = "sadiulchyon";
const REPO = "sadiulchyon.github.io";
const BRANCH = "master";
const MEMORIES_PATH = "_data/memories.yml";

const MEMORIES_FILE_HEADER = `# Memories data file, edited via the admin panel at /admin/.
# Each memory can have: title, description, date, image, video (YouTube embed URL), tags, type (photo/video)
# Images should be placed in /assets/img/memories/

`;

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function requireGithubToken(res) {
  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ error: "GITHUB_TOKEN is not configured on the function." });
    return false;
  }
  return true;
}

function checkPassword(req, res) {
  const password = req.body && req.body.password;
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "ADMIN_PASSWORD is not configured on the function." });
    return false;
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Incorrect password." });
    return false;
  }
  return true;
}

function slugify(title) {
  return (title || "untitled")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";
}

// Splits a Jekyll file into its front matter (as an object) and body text.
function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  return { data: yaml.load(match[1]) || {}, body: match[2] || "" };
}

function buildMarkdown(data, body) {
  const cleanData = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== "") cleanData[key] = data[key];
  });
  const frontMatter = yaml.dump(cleanData, { lineWidth: -1 });
  return `---\n${frontMatter}---\n\n${(body || "").trim()}\n`;
}

// List every file in a folder collection (_projects, _news) with parsed front matter.
async function listCollection(folder) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${folder}?ref=${BRANCH}`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    if (response.status === 404) return []; // empty/missing folder is fine
    throw new Error(`GitHub error listing ${folder}: ${response.status}`);
  }
  const entries = await response.json();
  const files = entries.filter(e => e.type === "file" && e.name.endsWith(".md"));
  const items = await Promise.all(
    files.map(async entry => {
      const fileRes = await fetch(entry.url, { headers: githubHeaders() });
      const file = await fileRes.json();
      const raw = Buffer.from(file.content, "base64").toString("utf-8");
      const { data, body } = parseFrontMatter(raw);
      return { path: entry.path, sha: entry.sha, ...data, body };
    })
  );
  return items;
}

// Create or update a single file in a folder collection.
async function saveCollectionItem(folder, { path, sha, ...fields }, defaults) {
  const { body, ...data } = fields;
  const finalPath = path || `${folder}/${slugify(fields.title)}.md`;
  const content = buildMarkdown({ ...defaults, ...data }, body);

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${finalPath}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: path ? `Update ${finalPath} via admin panel` : `Add ${finalPath} via admin panel`,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "GitHub error");
  return { path: finalPath, sha: result.content.sha };
}

async function deleteCollectionItem(path, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message: `Delete ${path} via admin panel`, sha, branch: BRANCH }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "GitHub error");
}

// Wires up GET/POST/DELETE for a folder-based collection (projects, news).
function registerCollectionRoutes(route, folder, defaults) {
  app.get(`/${route}`, async (req, res) => {
    if (!requireGithubToken(res)) return;
    try {
      res.json({ items: await listCollection(folder) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(`/${route}`, async (req, res) => {
    if (!requireGithubToken(res)) return;
    if (!checkPassword(req, res)) return;
    try {
      const { password, ...fields } = req.body;
      res.json(await saveCollectionItem(folder, fields, defaults));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(`/${route}`, async (req, res) => {
    if (!requireGithubToken(res)) return;
    if (!checkPassword(req, res)) return;
    try {
      const { path, sha } = req.body;
      if (!path || !sha) return res.status(400).json({ error: "path and sha are required." });
      await deleteCollectionItem(path, sha);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

registerCollectionRoutes("projects", "_projects", { layout: "page" });
registerCollectionRoutes("news", "_news", { layout: "post" });

// Fetch the current memories list plus the file's sha (required to save changes back).
app.get("/memories", async (req, res) => {
  if (!requireGithubToken(res)) return;
  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${MEMORIES_PATH}?ref=${BRANCH}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub error: ${response.status}` });
    }
    const file = await response.json();
    const content = Buffer.from(file.content, "base64").toString("utf-8");
    const data = yaml.load(content) || {};
    res.json({ memories: data.memories || [], sha: file.sha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save the full, edited memories list back to GitHub.
app.post("/memories", async (req, res) => {
  if (!requireGithubToken(res)) return;
  if (!checkPassword(req, res)) return;
  try {
    const { sha, memories } = req.body;
    if (!Array.isArray(memories)) {
      return res.status(400).json({ error: "memories must be an array." });
    }
    const newContent = MEMORIES_FILE_HEADER + yaml.dump({ memories }, { lineWidth: -1 });

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${MEMORIES_PATH}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update memories via admin panel",
        content: Buffer.from(newContent, "utf-8").toString("base64"),
        sha,
        branch: BRANCH,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.message || "GitHub error" });
    }
    res.json({ sha: result.content.sha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a new photo (or replace an existing one) into assets/img/memories/.
app.post("/upload-image", async (req, res) => {
  if (!requireGithubToken(res)) return;
  if (!checkPassword(req, res)) return;
  try {
    const { filename, contentBase64 } = req.body;
    if (!filename || !contentBase64) {
      return res.status(400).json({ error: "filename and contentBase64 are required." });
    }
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `assets/img/memories/${safeName}`;
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

    // Overwriting an existing file requires its current sha; creating a new one doesn't.
    let sha;
    const existing = await fetch(`${url}?ref=${BRANCH}`, { headers: githubHeaders() });
    if (existing.ok) {
      sha = (await existing.json()).sha;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Add memory photo ${safeName}`,
        content: contentBase64,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.message || "GitHub error" });
    }
    res.json({ path: `/assets/img/memories/${safeName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.memoriesAdmin = onRequest({ cors: true }, app);
