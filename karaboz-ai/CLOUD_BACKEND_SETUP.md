# Karaboz AI cloud backend

## Live resources
- Supabase project: `lttcoxzbjoevuaohpjir`
- Edge Function: `karaboz-chat` (JWT verification enabled; deployed version 10)
- Function URL: `https://lttcoxzbjoevuaohpjir.supabase.co/functions/v1/karaboz-chat`
- Database: `karaboz_conversations` and `karaboz_messages`, protected by Row Level Security.

## Inference provider
Karaboz uses Cloudflare Workers AI hosted inference with model `@cf/zai-org/glm-4.7-flash`. This is not a locally trained Karaboz checkpoint. The model weights are hosted by Cloudflare, so no `karaboz-mini.pt` file is required for the live chat endpoint.

The model is multilingual and Cloudflare documents it as available on Workers Free, but usage is subject to the current account allocation, model capacity, and provider pricing/limits. Do not promise unlimited free usage.

## Required server-side secrets
Actual model replies remain unavailable until both secrets are present in Supabase:
1. In the Cloudflare dashboard, open Workers AI and create an API token with the minimum Workers AI permission needed for inference. Find the Cloudflare Account ID in the account dashboard.
2. In Supabase Dashboard for project `lttcoxzbjoevuaohpjir`, open **Project Settings → Edge Functions → Secrets** (or the Edge Functions Secrets page) and add:
   - `CF_ACCOUNT_ID` = Cloudflare Account ID
   - `CF_API_TOKEN` = Cloudflare Workers AI API token
3. Optional: `CF_MODEL_ID` = `@cf/zai-org/glm-4.7-flash` (the function already uses this default).
4. Redeploy is not needed after adding function secrets; the runtime reads them at invocation.

Never put these values in GitHub source, the HTML client, an APK, screenshots, or chat messages. Never share the token with anyone.

## API
- Authenticated `GET /functions/v1/karaboz-chat` returns provider/model and `inference_configured`.
- Authenticated `POST /functions/v1/karaboz-chat` accepts JSON: `{"message":"Hello","conversation_id":null}`.
- Successful response includes `conversation_id`, `reply`, `model`, and `provider`.
- The Edge Function verifies the Supabase user, validates conversation ownership, limits message length and history, and writes user/assistant messages to the signed-in user's chat.

## Important distinction: hosted model vs own model
The repository's local character-level mini model is only an educational training baseline and has no trained checkpoint. A real independently owned Karaboz model would require a suitable open-weight base model, a permitted training dataset, compute, training/evaluation, and durable model hosting. Do not create a fake checkpoint or claim that random/synthetic weights make a useful assistant. This release uses hosted inference to make chat functional without pretending Karaboz has already trained its own foundation model.

## Troubleshooting
- If GET reports `inference_configured: false`, one or both Cloudflare secrets are missing or empty.
- If POST returns `AI_PROVIDER_ERROR`, check token permission, account ID, model access, quota/capacity, and Supabase Edge Function logs.
- Never expose private messages or train on them without informed permission.
