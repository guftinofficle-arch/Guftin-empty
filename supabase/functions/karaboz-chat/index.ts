import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_MODEL = "@cf/zai-org/glm-4.7-flash";
const MODEL = Deno.env.get("CF_MODEL_ID") || DEFAULT_MODEL;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function readDefaultSecret(jsonName: string, legacyName: string): string | undefined {
  const raw = Deno.env.get(jsonName);
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (typeof keys?.default === "string" && keys.default) return keys.default;
    } catch {
      console.error("Invalid Supabase key configuration:", jsonName);
    }
  }
  return Deno.env.get(legacyName) || undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const account = Deno.env.get("CF_ACCOUNT_ID");
  const token = Deno.env.get("CF_API_TOKEN");
  const inferenceConfigured = Boolean(account && token);

  if (req.method === "GET") {
    return json({
      service: "Karaboz AI",
      api: "online",
      provider: "Cloudflare Workers AI",
      model: MODEL,
      inference_configured: inferenceConfigured,
      checkpoint_required: false,
      note: "Uses hosted model inference; no local checkpoint is required.",
    });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!inferenceConfigured) {
    return json({
      error: "Cloudflare inference configuration is missing in the Edge Function runtime.",
      code: "AI_NOT_CONFIGURED",
    }, 503);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = readDefaultSecret("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = readDefaultSecret("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !secretKey) {
    console.error("Karaboz Supabase runtime keys are missing");
    return json({ error: "Supabase server configuration is incomplete", code: "SUPABASE_CONFIG_ERROR" }, 500);
  }

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sign-in required" }, 401);

  // Validate the caller with their own JWT first.
  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  const user = authData?.user;
  if (authError || !user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

  let body: any;
  try { body = await req.json(); }
  catch { return json({ error: "Request body must be valid JSON" }, 400); }
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 4000) {
    return json({ error: "Message must contain between 1 and 4000 characters" }, 400);
  }

  // Admin client is server-only. Every query below is explicitly scoped to the authenticated user.
  // This is needed because the current RLS policy permits client inserts only for role='user';
  // the trusted Edge Function must also persist role='assistant' without exposing its secret key.
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let conversationId: string | null = typeof body?.conversation_id === "string" ? body.conversation_id : null;
  if (conversationId) {
    const { data: ownedConversation, error } = await admin
      .from("karaboz_conversations").select("id")
      .eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (error) return json({ error: "Could not verify conversation ownership" }, 500);
    if (!ownedConversation) return json({ error: "Conversation not found" }, 404);
  } else {
    const { data, error } = await admin.from("karaboz_conversations")
      .insert({ user_id: user.id, title: message.slice(0, 72) })
      .select("id").single();
    if (error || !data) {
      console.error("Karaboz conversation insert failed", error?.message);
      return json({ error: "Could not create conversation" }, 500);
    }
    conversationId = data.id;
  }

  const { data: history, error: historyError } = await admin.from("karaboz_messages")
    .select("role,content").eq("conversation_id", conversationId)
    .eq("user_id", user.id).in("role", ["user", "assistant"])
    .order("created_at", { ascending: false }).limit(8);
  if (historyError) return json({ error: "Could not load chat history" }, 500);

  const messages = [
    {
      role: "system",
      content: "You are Karaboz AI, a helpful, accurate and safe multilingual assistant. Reply in the language used by the user (including Urdu, Roman Urdu, Hindi or English). Be clear, practical and honest. If unsure, say so. Do not claim to have performed actions you have not performed.",
    },
    ...((history ?? []).reverse().map((item: { role: string; content: string }) => ({
      role: item.role, content: item.content,
    }))),
    { role: "user", content: message },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let providerResponse: Response;
  try {
    providerResponse = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(account!) + "/ai/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: 512, temperature: 0.55 }),
        signal: controller.signal,
      },
    );
  } catch (error) {
    clearTimeout(timeout);
    console.error("Karaboz inference transport error", String(error));
    return json({ error: "AI service could not be reached. Please try again shortly.", code: "AI_PROVIDER_TIMEOUT" }, 504);
  }
  clearTimeout(timeout);

  if (!providerResponse.ok) {
    const providerDetails = (await providerResponse.text()).slice(0, 1200);
    console.error("Karaboz provider error", JSON.stringify({
      status: providerResponse.status, details: providerDetails, model: MODEL,
    }));
    return json({
      error: "The AI provider rejected the request. Check the Cloudflare Workers AI token permission, model access and account quota.",
      code: "AI_PROVIDER_ERROR",
      provider_status: providerResponse.status,
    }, 502);
  }

  let result: any;
  try { result = await providerResponse.json(); }
  catch { return json({ error: "AI provider returned an invalid response" }, 502); }
  const reply = result?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    console.error("Karaboz empty model response", JSON.stringify({ model: MODEL }));
    return json({ error: "AI returned an empty response. Please try again." }, 502);
  }

  const { error: userSaveError } = await admin.from("karaboz_messages").insert({
    conversation_id: conversationId, user_id: user.id, role: "user", content: message,
  });
  if (userSaveError) {
    console.error("Karaboz user message save failed", userSaveError.message);
    return json({ error: "Could not save your message" }, 500);
  }

  const { error: assistantSaveError } = await admin.from("karaboz_messages").insert({
    conversation_id: conversationId, user_id: user.id, role: "assistant", content: reply.trim(), model: MODEL,
  });
  if (assistantSaveError) {
    console.error("Karaboz assistant message save failed", assistantSaveError.message);
    return json({ error: "Reply was generated but could not be saved to chat history" }, 500);
  }

  await admin.from("karaboz_conversations").update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId).eq("user_id", user.id);

  return json({ conversation_id: conversationId, reply: reply.trim(), model: MODEL, provider: "Cloudflare Workers AI" });
});