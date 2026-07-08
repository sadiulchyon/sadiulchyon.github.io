const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");

const app = express();

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

// Firebase strips the "/oauth" function-name segment before Express sees the
// path, so it has to be added back here to build the public callback URL
// that must match the one registered on the GitHub OAuth App.
function callbackUrl(req) {
  return `${req.protocol}://${req.get("host")}/oauth/callback`;
}

// Step 1: send the user to GitHub to approve access.
app.get("/auth", (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send("OAUTH_CLIENT_ID is not configured.");
  }
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "repo,user");
  url.searchParams.set("redirect_uri", callbackUrl(req));
  res.redirect(url.toString());
});

// Step 2: GitHub redirects back here with a ?code=... to exchange for a token.
app.get("/callback", async (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const { code } = req.query;

  if (!clientId || !clientSecret) {
    return res.status(500).send("OAuth app is not configured.");
  }
  if (!code) {
    return res.status(400).send("Missing ?code from GitHub.");
  }

  try {
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const data = await tokenResponse.json();

    if (data.error) {
      return res.send(renderPostMessagePage("error", { message: data.error_description || data.error }));
    }

    return res.send(
      renderPostMessagePage("success", { token: data.access_token, provider: "github" })
    );
  } catch (err) {
    return res.send(renderPostMessagePage("error", { message: err.message }));
  }
});

// Renders the tiny page Decap CMS's popup window expects: it handshakes with
// the window that opened it, then posts the token (or error) back and closes.
function renderPostMessagePage(status, payload) {
  const message =
    status === "success"
      ? `authorization:github:success:${JSON.stringify(payload)}`
      : `authorization:github:error:${JSON.stringify(payload)}`;

  return `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage('authorizing:github', e.origin);
          window.removeEventListener('message', receiveMessage, false);
          window.opener.postMessage(${JSON.stringify(message)}, e.origin);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`;
}

exports.oauth = onRequest({ cors: true }, app);
