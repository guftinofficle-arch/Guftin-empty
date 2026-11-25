# Karaboz AI cloud backend (preview)

## Deployed resources
- Supabase project: `lttcoxzbjoevuaohpjir`
- Edge Function: `karaboz-chat` (active, JWT verification enabled)
- Function URL: `https://lttcoxzbjoevuaohpjir.supabase.co/functions/v1/karaboz-chat`
- Web client: `web/index.html`
- Database: `karaboz_conversations` and `karaboz_messages`, both protected by Row Level Security.

## AI provider setup (Cloudflare Workers AI)
The API and database are deployed. Actual model replies remain disabled until two Cloudflare secrets are added to Supabase:
1. Open the Cloudflare dashboard and visit Workers AI > Use REST API. Create a Workers AI API token with the minimum Workers AI permissions shown there, and copy your Cloudflare Account ID.
2. In Supabase Dashboard > Edge Functions > Secrets, add:
   - `CF_ACCOUNT_ID` = your Cloudflare Account ID
   - `CF_API_TOKEN` = your Cloudflare Workers AI token
3. Never paste either value into GitHub, this chat, the HTML file, or a mobile app. Keep them only in server-side Edge Function secrets.

The function calls the OpenAI-compatible Cloudflare Workers AI endpoint with model `@cf/meta/llama-3.1-8b-instruct`. Cloudflare currently documents a free Workers AI allocation of 10,000 Neurons per day on Workers Free. When the free daily limit is reached, requests stop until reset; do not upgrade to Workers Paid if the goal is zero cost. Model availability and limits may change.

## Deploy the web UI
Import `guftinofficle-arch/Guftin-empty` in Vercel, select branch `feature/karaboz-ai-backend`, and set Root Directory to `karaboz-ai/web`. It is a static HTML client; no build command is required. Vercel documents repository import and root-directory configuration in its deployment guide.

## API contract
- `GET /functions/v1/karaboz-chat`: authenticated status; reports whether Cloudflare secrets are configured.
- `POST /functions/v1/karaboz-chat`: authenticated JSON body `{"message":"Hello","conversation_id":null}`; returns `conversation_id`, `reply`, and `model`.
- JWT verification is enabled. Conversation and message rows are isolated by `auth.uid()`.

## Current limitations
This is a hosted-model integration, not a Karaboz language model trained from scratch. Cloudflare serves the model; Karaboz owns the UI, API layer, authentication integration, and chat-history database. Free usage is limited and not guaranteed to be always available. The earlier local mini-transformer remains an experimental training baseline and is not used by this endpoint. Do not train on private Guftin chats or personal data without informed permission.
