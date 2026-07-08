# Admin API

A small Firebase Cloud Function that lets `/admin/` on the main site edit
`_data/memories.yml` and upload photos, without you ever touching YAML or
git directly. It's not part of the Jekyll site build — deployed once, then
left alone.

Unlike a full GitHub-login setup, this uses a single Personal Access Token
(held only by the function, never shown to the browser) plus a password you
choose, to gate who can save changes. No OAuth App, no callback URLs.

## One-time setup

1. **Install the Firebase CLI** (if you don't have it): `npm install -g firebase-tools`, then `firebase login`.

2. **Create a Firebase project**: [console.firebase.google.com](https://console.firebase.google.com) or `firebase projects:create`. The Blaze (pay-as-you-go) plan is required for Cloud Functions, but this function is far below any billing threshold for personal use.

3. **Create a fine-grained GitHub Personal Access Token**: go to [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) and create one scoped to:
   - **Repository access**: only `sadiulchyon.github.io` (not all repos)
   - **Permissions**: Contents → Read and write

   Copy the token — GitHub only shows it once.

4. **Pick a password.** This is what gates who can save changes through `/admin/`. Make it long and random (a password manager's "generate" button is fine) — anyone who has it can edit the site.

5. **Set both as environment variables for the function**: in this folder, copy `functions/.env.example` to `functions/.env` and fill in `GITHUB_TOKEN` (step 3) and `ADMIN_PASSWORD` (step 4).

6. **Connect this folder to your Firebase project**: from inside `admin-api/`, run `firebase use --add` and select the project from step 2.

7. **Deploy**: from inside `admin-api/`, run `firebase deploy --only functions`. The output prints a URL like:
   ```
   https://us-central1-<your-project-id>.cloudfunctions.net/memoriesAdmin
   ```

8. **Point the admin page at it**: open `admin/index.html` in the main site repo, find the line `const FUNCTION_BASE = "..."` near the top of the `<script>`, and replace the placeholder with the URL from step 7 (no trailing slash). Commit and push that one-line change.

9. **Use it**: visit `https://sadiulchyon.github.io/admin/`, enter the password from step 4, and edit captions, dates, tags, or upload new photos. Saving commits directly to the repo — the site rebuilds automatically within a minute or two, same as any other push.

## After setup

You won't need to touch this folder again unless you rotate the token or
password. Day to day, everything happens at `/admin/`.

## If you ever want to revoke access

Delete the Personal Access Token at
[github.com/settings/tokens](https://github.com/settings/tokens?type=beta),
or change `ADMIN_PASSWORD` and redeploy.
