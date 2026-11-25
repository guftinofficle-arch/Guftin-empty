# Karaboz AI — Cloud deployment (phone-friendly)

## What this gives you
A cloud-hosted test API. The source code stays in GitHub. Render runs the FastAPI server. The free service sleeps after 15 minutes without traffic and its local disk is temporary, so this is for testing only, not a production service.

## Deploy from a phone
1. Sign in to Render using the GitHub account that can access `guftinofficle-arch/Guftin-empty`.
2. In Render choose **New → Blueprint** and connect that repository.
3. Render should detect the root-level `render.yaml`. Review the service settings; choose the Free instance if offered. Do not select a paid plan.
4. Let the first deployment finish. Open the service's URL and append `/v1/health`.
5. A healthy server without a trained checkpoint will say `status: not_trained`. That means the API server is running, not that the AI model has been trained.
6. In Render's service Environment page, the generated `KARABOZ_API_KEY` is a secret. Keep it private. For direct testing, send it in the `X-API-Key` request header. Do not paste it in public chat, GitHub files, or a mobile APK.

## API endpoints
- `GET https://YOUR-SERVICE.onrender.com/v1/health`
- `POST https://YOUR-SERVICE.onrender.com/v1/chat`
- JSON body: `{"message":"Hello","max_new_tokens":40}`
- Header: `X-API-Key: YOUR_SECRET_KEY`

## Storage and training status
- GitHub stores source code and configuration.
- The free Render filesystem is temporary and is erased on restart/redeploy/sleep. Do not store training data or model checkpoints only on Render.
- Store approved training text and future model checkpoints in a separate private model/dataset repository or durable storage. Never upload passwords, private messages, contact lists, or personal data as training material.
- The current repository does not contain a trained checkpoint. The chat endpoint will return HTTP 503 until training has produced `checkpoints/karaboz-mini.pt` and that checkpoint is made available to the service.
- The current character-level model is only a learning baseline; it is not a capable assistant yet.

## Important limits
Render free web services sleep after 15 minutes idle and can take about a minute to wake. Free services have no persistent disk and are not intended for production. Free Postgres databases on Render expire after 30 days, so do not use one as permanent model storage. See the official Render free-plan docs: https://render.com/docs/free

Do not connect this experimental endpoint to all Guftin users yet. First verify the health endpoint, authentication, rate limits, privacy handling, model output quality, and HTTPS. For an Android app, never embed a permanent server secret in the APK; put user authentication and request authorization on a backend.
