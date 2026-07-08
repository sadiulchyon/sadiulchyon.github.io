# CMS OAuth helper

This is a small, standalone Firebase Cloud Function that lets the content
manager at `/admin/` on the main site log in with GitHub. It is **not** part
of the Jekyll site build — it's deployed separately, once, and then left
alone.

It exists because Decap CMS (the admin UI) needs to exchange a GitHub login
for an access token, and that exchange requires a client secret that can't
live in the browser. This function holds that secret and does the exchange
on the CMS's behalf.

## One-time setup

1. **Install the Firebase CLI** (if you don't have it): `npm install -g firebase-tools`, then `firebase login`.

2. **Create a Firebase project**: either at [console.firebase.google.com](https://console.firebase.google.com) or `firebase projects:create`. Note the project ID you choose (e.g. `sadiulchyon-cms`) — the Blaze (pay-as-you-go) plan is required for Cloud Functions, but this function is far below any billing threshold for personal use.

3. **Create a GitHub OAuth App**: go to [github.com/settings/developers](https://github.com/settings/developers) → "New OAuth App", and fill in:
   - **Homepage URL**: `https://sadiulchyon.github.io`
   - **Authorization callback URL**: `https://us-central1-<your-project-id>.cloudfunctions.net/oauth/callback`

   After creating it, copy the **Client ID**, then generate and copy a **Client Secret**.

4. **Set the two values as environment variables for the function**: in this folder, copy `functions/.env.example` to `functions/.env` and fill in `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` with the values from step 3.

5. **Connect this folder to your Firebase project**: from inside `cms-oauth/`, run `firebase use --add` and select the project from step 2.

6. **Deploy**: from inside `cms-oauth/`, run `firebase deploy --only functions`. The output will print a URL like:
   ```
   https://us-central1-<your-project-id>.cloudfunctions.net/oauth
   ```

7. **Point the CMS at it**: open `/admin/config.yml` in the main site repo and replace the placeholder `base_url` with the URL from step 6 (without a trailing slash, and without `/auth` or `/callback` on the end — those are added automatically). Commit and push that one-line change.

8. **Log in**: visit `https://sadiulchyon.github.io/admin/`, click "Login with GitHub", and authorize the app. You should land in the CMS with Memories, Projects, and News collections ready to edit.

## After setup

You won't need to touch this folder again unless you want to add another
GitHub OAuth App or move to a new Firebase project. Editing photo captions,
dates, projects, or news going forward all happens through `/admin/` —
no redeploys needed.
