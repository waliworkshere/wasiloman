// Server-only helpers for the WhatsApp Cloud API (Meta Graph API)
export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type WaAccount = {
  owner_id: string;
  waba_id: string;
  phone_number_id: string;
  access_token: string;
  display_phone?: string | null;
  verified_name?: string | null;
};

export class GraphError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
  }
}

export async function graph<T = any>(path: string, token: string, init: { method?: string; body?: any } = {}): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${BASE}/${path.replace(/^\//, "")}`, {
    method: init.method || (init.body ? "POST" : "GET"),
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new GraphError(e.error_user_msg || e.message || `Meta API error (${res.status})`, e.code);
  }
  return json as T;
}

// ---------- Onboarding ----------
export async function exchangeCodeForToken(code: string) {
  const url = new URL(`${BASE}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.NEXT_PUBLIC_META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("code", code);
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.error) throw new GraphError(json.error?.message || "Could not exchange Facebook code");
  return json.access_token as string;
}

export async function getPhoneInfo(phoneNumberId: string, token: string) {
  return graph<{ display_phone_number: string; verified_name: string; quality_rating?: string }>(
    `${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
    token
  );
}

export async function findPhoneNumbers(wabaId: string, token: string) {
  return graph<{ data: { id: string; display_phone_number: string; verified_name: string }[] }>(
    `${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`,
    token
  );
}

export async function subscribeApp(wabaId: string, token: string) {
  return graph(`${wabaId}/subscribed_apps`, token, { method: "POST" });
}

export async function registerPhone(phoneNumberId: string, token: string, pin: string) {
  return graph(`${phoneNumberId}/register`, token, { body: { messaging_product: "whatsapp", pin } });
}

// ---------- Templates ----------
export type TemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  buttons?: { type: string; text: string; url?: string; phone_number?: string }[];
  example?: any;
};
export type Template = { id: string; name: string; status: string; category: string; language: string; components: TemplateComponent[] };

export async function listTemplates(acct: WaAccount) {
  const res = await graph<{ data: Template[] }>(
    `${acct.waba_id}/message_templates?limit=250&fields=id,name,status,category,language,components`,
    acct.access_token
  );
  return res.data;
}

export async function createTemplate(acct: WaAccount, payload: any) {
  return graph(`${acct.waba_id}/message_templates`, acct.access_token, { body: payload });
}

export async function deleteTemplate(acct: WaAccount, name: string) {
  return graph(`${acct.waba_id}/message_templates?name=${encodeURIComponent(name)}`, acct.access_token, { method: "DELETE" });
}

/** Uploads a sample image for a template header (Resumable Upload API) and returns its handle. */
export async function uploadTemplateSample(acct: WaAccount, file: Blob, fileName: string) {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID!;
  const start = await graph<{ id: string }>(
    `${appId}/uploads?file_name=${encodeURIComponent(fileName)}&file_length=${file.size}&file_type=${encodeURIComponent(file.type)}`,
    acct.access_token,
    { method: "POST" }
  );
  const res = await fetch(`${BASE}/${start.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${acct.access_token}`, file_offset: "0" },
    body: file,
  });
  const json = await res.json();
  if (!res.ok || !json.h) throw new GraphError(json.error?.message || "Sample upload failed");
  return json.h as string;
}

// ---------- Media ----------
export async function uploadMedia(acct: WaAccount, file: Blob, fileName: string) {
  const fd = new FormData();
  fd.append("messaging_product", "whatsapp");
  fd.append("type", file.type);
  fd.append("file", file, fileName);
  const res = await fetch(`${BASE}/${acct.phone_number_id}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${acct.access_token}` },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok || !json.id) throw new GraphError(json.error?.message || "Media upload failed");
  return json.id as string;
}

// ---------- Sending ----------
type SendResult = { messages: { id: string }[] };

function send(acct: WaAccount, to: string, payload: any) {
  return graph<SendResult>(`${acct.phone_number_id}/messages`, acct.access_token, {
    body: { messaging_product: "whatsapp", recipient_type: "individual", to, ...payload },
  }).then((r) => r.messages[0].id);
}

export const sendText = (acct: WaAccount, to: string, body: string) =>
  send(acct, to, { type: "text", text: { body, preview_url: true } });

export const sendImage = (acct: WaAccount, to: string, link: string, caption?: string) =>
  send(acct, to, { type: "image", image: { link, caption } });

export const sendButtons = (acct: WaAccount, to: string, body: string, buttons: { id: string; title: string }[]) =>
  send(acct, to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });

export const sendList = (acct: WaAccount, to: string, body: string, buttonText: string, rows: { id: string; title: string }[]) =>
  send(acct, to, {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: buttonText.slice(0, 20),
        sections: [{ title: "Options", rows: rows.slice(0, 10).map((r) => ({ id: r.id, title: r.title.slice(0, 24) })) }],
      },
    },
  });

export const sendTemplate = (acct: WaAccount, to: string, name: string, language: string, components: any[]) =>
  send(acct, to, { type: "template", template: { name, language: { code: language }, components } });

export const markRead = (acct: WaAccount, messageId: string) =>
  graph(`${acct.phone_number_id}/messages`, acct.access_token, {
    body: { messaging_product: "whatsapp", status: "read", message_id: messageId },
  }).catch(() => null);

export { countVars } from "./whatsapp-shared";
