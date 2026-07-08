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
