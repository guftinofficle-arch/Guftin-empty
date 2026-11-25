# Karaboz AI cloud backend (preview)

## Deployed resources
- Supabase project: `lttcoxzbjoevuaohpjir`
- Edge Function: `karaboz-chat`
- Function URL: `https://lttcoxzbjoevuaohpjir.supabase.co/functions/v1/karaboz-chat`
- Web client: `web/index.html`
- Database: `karaboz_conversations` and `karaboz_messages`, both protected by Row Level Security.

## Important: AI provider still needs a user-owned free-tier token
The backend is deployed and authenticated, but it will return `503 AI_PROVIDER_NOT_CONFIGURED` until an inference provider token is added. It is configured for Hugging Face's OpenAI-compatible chat-completions router and model `Qwen/Qwen2.5-1.5B-Instruct`. Provider availability, free credits and rate limits can change; this is not guaranteed unlimited free compute.

1. Create/sign in to a Hugging Face account and create a fine-grained/read token from Settings > Access Tokens.
2. In Supabase Dashboard > Edge Functions > Secrets, add the secret named `HF_TOKEN` with that token as its value.
3. Never paste the token into GitHub, this chat, the HTML file, or a mobile app. Never use a service-role key in a browser.
4. In Supabase Authentication settings, configure email confirmation and allowed redirect URLs for the deployed web app.

## Deploy the web UI
Import `guftinofficle-arch/Guftin-empty` in Vercel, select branch `feature/karaboz-ai-backend`, and set the project Root Directory to `karaboz-ai/web`. It is a static HTML client; no build command is required. The Supabase URL and publishable key in the page are public client configuration. The Edge Function verifies the Supabase JWT and stores each user's own chat under RLS.

## API contract
- `GET /functions/v1/karaboz-chat`: authenticated status; says whether the provider secret is configured.
- `POST /functions/v1/karaboz-chat`: authenticated JSON body `{"message":"Hello","conversation_id":null}`; returns `conversation_id`, `reply`, and `model`.
- JWT verification is enabled. Conversation and message rows are isolated by `auth.uid()`.

## Current limitations
This is a working backend scaffold with a hosted inference-provider adapter, not a Karaboz model trained from scratch. The selected Qwen model is hosted by Hugging Face; provider quotas, model availability and account eligibility apply. The earlier local mini-transformer remains an experimental training baseline and is not used by this endpoint. Do not train on private Guftin chats or personal data without informed permission.
