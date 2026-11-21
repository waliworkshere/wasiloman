"use client";
/**
 * Demo mode: a fake, in-browser workspace for "Al Noor Sweets" so visitors can try every screen
 * without an account. It mimics the small part of the Supabase client API that the app uses.
 */
import { PRESETS } from "./bot-presets";

export const DEMO_COOKIE = "wasil_demo";

export function isDemo() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((c) => c === `${DEMO_COOKIE}=1`);
}
export function enterDemo() {
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 6}; samesite=lax`;
}
export function exitDemo() {
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0`;
}

const DEMO_USER = { id: "demo-user", email: "demo@wasil.om" };
export const DEMO_ACCOUNT = {
  waba_id: "104857600000001",
  phone_number_id: "109876543210001",
  display_phone: "+968 9123 4567",
  verified_name: "Al Noor Sweets",
  connected_via: "manual",
  created_at: new Date(Date.now() - 40 * 864e5).toISOString(),
};

// ---------- deterministic sample data ----------
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const uid = (() => {
  let n = 0;
  return (p: string) => `${p}-${(++n).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
})();

const NAMES = [
  "Ahmed Al Balushi", "Fatma Al Harthy", "Salim Al Rawahi", "Maryam Al Hinai", "Khalid Al Busaidi", "Aisha Al Lawati", "Saif Al Kindi",
  "Noor Al Zadjali", "Hamed Al Siyabi", "Zainab Al Shukaili", "Yousuf Al Maskari", "Laila Al Habsi", "Majid Al Amri", "Huda Al Farsi",
  "Talal Al Mahrouqi", "Rahma Al Jabri", "Said Al Ghafri", "Muna Al Rashdi", "Badr Al Saadi", "Shamsa Al Mamari", "Hilal Al Toubi",
  "Asma Al Kharusi", "Faisal Al Nabhani", "Reem Al Hashmi", "Omar Al Abri", "Sara Al Riyami", "Juma Al Shidi", "Amal Al Mukhaini",
  "Hussain Al Ajmi", "Bushra Al Hosni", "Ali Al Mandhari", "Khadija Al Hadhrami", "Sultan Al Qasmi", "Muzna Al Raisi", "Waleed Al Salmi",
  "Thuraya Al Ismaili", "Nabil Al Moosawi", "Iman Al Battashi", "Rashid Al Hajri", "Ghaliya Al Bahri", "Adil Al Mughairi", "Samira Al Kalbani",
];
const CITIES = ["Muscat", "Seeb", "Sohar", "Nizwa", "Salalah", "Sur", "Ibri"];

type Store = Record<string, any[]>;
let store: Store | null = null;

function build(): Store {
  const r = rng(968);
  const now = Date.now();
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const contacts = NAMES.map((name, i) => {
    const tags = [pick(CITIES)];
    if (r() < 0.25) tags.push("VIP");
    if (r() < 0.35) tags.push("Ramadan 2026");
    if (r() < 0.15) tags.push("lead");
    return {
      id: `c${i}`,
      owner_id: DEMO_USER.id,
      name,
      phone: `968${pick(["9", "7"])}${String(1000000 + Math.floor(r() * 8999999)).slice(0, 7)}`,
      tags,
      attributes: { city: tags[0], last_order: `${(3 + r() * 40).toFixed(3)} OMR` } as Record<string, string>,
      opted_in: r() > 0.05,
      last_inbound_at: null as string | null,
      last_message_at: null as string | null,
      last_message_preview: null as string | null,
      unread: 0,
      created_at: new Date(now - (60 - i) * 864e5).toISOString(),
    };
  });
  // extra imported contacts so numbers feel real
  for (let i = 0; i < 1206; i++) {
    contacts.push({
      id: `cx${i}`,
      owner_id: DEMO_USER.id,
      name: `${pick(NAMES).split(" ")[0]} ${pick(NAMES).split(" ").slice(1).join(" ")}`,
      phone: `9689${String(1000000 + i * 7919).slice(-7)}`,
      tags: [pick(CITIES), ...(r() < 0.3 ? ["Ramadan 2026"] : [])],
      attributes: { city: pick(CITIES) },
      opted_in: r() > 0.04,
      last_inbound_at: null,
      last_message_at: null,
      last_message_preview: null,
      unread: 0,
      created_at: new Date(now - 90 * 864e5).toISOString(),
    });
  }

  const tplBody = (k: string) => DEMO_TEMPLATES.find((t) => t.name === k)!.components.find((c: any) => c.type === "BODY").text as string;
  const campaigns = [
    { name: "National Day halwa offer", tpl: "national_day_offer", days: 2, size: 1180, d: 0.95, rd: 0.71 },
    { name: "Weekend sale – VIP", tpl: "weekend_sale", days: 6, size: 214, d: 0.97, rd: 0.78 },
    { name: "Order ready reminders", tpl: "order_ready", days: 9, size: 96, d: 0.99, rd: 0.88 },
    { name: "New branch in Sohar", tpl: "weekend_sale", days: 13, size: 640, d: 0.93, rd: 0.62 },
  ];
  const broadcasts: any[] = [];
  const recipients: any[] = [];
  const messages: any[] = [];

  campaigns.forEach((c, bi) => {
    const id = `b${bi}`;
    const created = now - c.days * 864e5 - 3 * 3600e3;
    let sent = 0, delivered = 0, read = 0, failed = 0;
    for (let i = 0; i < c.size; i++) {
      const contact = contacts[i % contacts.length];
      const x = r();
      const status = x < c.rd ? "read" : x < c.d ? "delivered" : x < c.d + 0.03 ? "sent" : "failed";
      if (status !== "failed") sent++;
      if (status === "delivered" || status === "read") delivered++;
      if (status === "read") read++;
      if (status === "failed") failed++;
      const ts = new Date(created + i * 900).toISOString();
      recipients.push({
        id: `${id}-r${i}`, broadcast_id: id, owner_id: DEMO_USER.id, contact_id: contact.id, phone: contact.phone, name: contact.name,
        status, error: status === "failed" ? pick(["Message undeliverable", "Recipient is not on WhatsApp", "Re-engagement window closed"]) : null, updated_at: ts,
      });
      if (status !== "failed") {
        messages.push({ id: uid("m"), owner_id: DEMO_USER.id, contact_id: contact.id, direction: "out", type: "template", body: tplBody(c.tpl).replace("{{1}}", contact.name.split(" ")[0]).replace("{{2}}", "20%"), status, source: "broadcast", created_at: ts });
      }
    }
    broadcasts.push({
      id, owner_id: DEMO_USER.id, name: c.name, template_name: c.tpl, template_language: "ar", template_components: DEMO_TEMPLATES.find((t) => t.name === c.tpl)!.components,
      variable_map: [], audience_tags: [], status: "completed", scheduled_at: null, total: c.size, sent, delivered, read, failed, created_at: new Date(created).toISOString(),
    });
  });
  broadcasts.unshift({
    id: "b-sched", owner_id: DEMO_USER.id, name: "Friday family pack", template_name: "weekend_sale", template_language: "en", template_components: DEMO_TEMPLATES[1].components,
    variable_map: [], audience_tags: ["Muscat"], status: "scheduled", scheduled_at: new Date(now + 2 * 864e5).toISOString(), total: 312, sent: 0, delivered: 0, read: 0, failed: 0, created_at: new Date(now - 3600e3).toISOString(),
  });

  // daily ambient volume (order updates etc.) so the chart has shape
  for (let d = 13; d >= 0; d--) {
    const n = 25 + Math.floor(r() * 45) + (d % 7 === 1 ? 40 : 0);
    for (let i = 0; i < n; i++) {
      const c = pick(contacts.slice(0, 300));
      messages.push({ id: uid("m"), owner_id: DEMO_USER.id, contact_id: c.id, direction: "out", type: "text", body: "Your order is ready for pickup ✅", status: r() < 0.7 ? "read" : "delivered", source: "bot", created_at: new Date(now - d * 864e5 - r() * 8e7).toISOString() });
    }
  }

  // conversations
  const convos: [number, [string, string, number][]][] = [
    [0, [["in", "السلام عليكم، هل العرض متوفر في فرع الخوير؟", 50], ["out", "وعليكم السلام أحمد 🌙 نعم العرض متوفر في جميع الفروع حتى نهاية الأسبوع.", 47], ["in", "ممتاز، كم سعر علبة الحلوى الكبيرة؟", 20]]],
    [1, [["in", "Hi, can I order 3 boxes for Thursday?", 180], ["out", "Of course Fatma! Which flavour — saffron, rose or plain?", 175], ["in", "2 saffron and 1 rose please", 170], ["out", "Done ✅ Your order #2041 will be ready Thursday 5pm.", 160], ["in", "Thank you 🙏", 155]]],
    [2, [["in", "menu", 300], ["out", "Marhaba Salim! 👋 How can we help?\n1. Prices\n2. Location\n3. Talk to us", 299], ["in", "Location / الموقع", 298], ["out", "📍 Al Khuwair, Muscat\n🕘 Sat–Thu 9am–10pm", 297]]],
    [3, [["in", "Do you deliver to Seeb?", 600], ["out", "Yes Maryam, delivery to Seeb is 1.500 OMR, free above 15 OMR.", 590]]],
    [5, [["in", "الطلب وصل، شكراً جزيلاً ❤️", 1500]]],
    [8, [["in", "هل عندكم حلوى بدون سكر؟", 4000], ["out", "نعم يا هامد، عندنا حلوى عمانية بدون سكر مضاف بسعر ٤ ريال.", 3900]]],
    [11, [["in", "STOP", 7000]]],
  ];
  convos.forEach(([ci, msgs]) => {
    const c = contacts[ci];
    msgs.forEach(([dir, body, minsAgo]) => {
      const ts = new Date(now - minsAgo * 60e3).toISOString();
      messages.push({ id: uid("m"), owner_id: DEMO_USER.id, contact_id: c.id, direction: dir, type: "text", body, status: dir === "out" ? "read" : null, source: dir === "in" ? "customer" : minsAgo > 290 && minsAgo < 300 ? "bot" : "inbox", created_at: ts });
      c.last_message_at = ts;
      c.last_message_preview = body.slice(0, 80);
      if (dir === "in") c.last_inbound_at = ts;
    });
    if (msgs[msgs.length - 1][0] === "in" && ci < 3) c.unread = ci === 0 ? 2 : 1;
  });
  contacts[11].opted_in = false;
  // replies spread across days for the chart
  for (let d = 13; d >= 1; d--) {
    const n = 6 + Math.floor(r() * 18);
    for (let i = 0; i < n; i++) {
      const c = contacts[20 + Math.floor(r() * 200)];
      messages.push({ id: uid("m"), owner_id: DEMO_USER.id, contact_id: c.id, direction: "in", type: "text", body: pick(["شكراً", "Thanks!", "كم السعر؟", "Location?", "👍"]), status: null, source: "customer", created_at: new Date(now - d * 864e5 - r() * 8e7).toISOString() });
    }
  }

  const flows = PRESETS.filter((p) => p.key !== "blank").map((p, i) => ({
    id: `f${i}`, owner_id: DEMO_USER.id, name: p.en, keywords: p.keywords, match_type: p.match_type, is_active: i === 0, nodes: p.nodes, edges: p.edges,
    runs: i === 0 ? 384 : 57, created_at: new Date(now - 20 * 864e5).toISOString(), updated_at: new Date(now - 2 * 864e5).toISOString(),
  }));

  return { contacts, broadcasts, broadcast_recipients: recipients, messages, flows, flow_sessions: [], whatsapp_accounts: [{ ...DEMO_ACCOUNT, owner_id: DEMO_USER.id }] };
}

export const DEMO_TEMPLATES: any[] = [
  {
    id: "t1", name: "national_day_offer", status: "APPROVED", category: "MARKETING", language: "ar",
    components: [
      { type: "HEADER", format: "IMAGE", example: { header_handle: [] } },
      { type: "BODY", text: "كل عام وأنتم بخير يا {{1}} 🇴🇲\n\nبمناسبة العيد الوطني: خصم *{{2}}* على جميع أنواع الحلوى العمانية حتى نهاية الأسبوع.", example: { body_text: [["أحمد", "20%"]] } },
      { type: "FOOTER", text: "أرسل «إيقاف» لإلغاء الاشتراك" },
      { type: "BUTTONS", buttons: [{ type: "URL", text: "اطلب الآن", url: "https://example.om" }, { type: "QUICK_REPLY", text: "الموقع" }] },
    ],
  },
  {
    id: "t2", name: "weekend_sale", status: "APPROVED", category: "MARKETING", language: "en",
    components: [
      { type: "HEADER", format: "TEXT", text: "Weekend sale 🍯" },
      { type: "BODY", text: "Hi {{1}}! This Friday and Saturday only: *{{2}} off* family boxes at all Al Noor branches.", example: { body_text: [["Fatma", "15%"]] } },
      { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Reserve a box" }] },
    ],
  },
  { id: "t3", name: "order_ready", status: "APPROVED", category: "UTILITY", language: "en", components: [{ type: "BODY", text: "Hello {{1}}, your order is ready for pickup at our Al Khuwair branch. ✅" }] },
  { id: "t4", name: "appointment_reminder", status: "PENDING", category: "UTILITY", language: "ar", components: [{ type: "BODY", text: "مرحباً {{1}}، نذكرك بموعد استلام طلبك يوم {{2}}." }] },
  { id: "t5", name: "ramadan_greeting_v1", status: "REJECTED", category: "MARKETING", language: "ar", components: [{ type: "BODY", text: "رمضان كريم {{1}} {{2}} {{3}}" }] },
];

function db() {
  if (!store) store = build();
  return store;
}

// ---------- minimal query builder ----------
type Filter = (row: any) => boolean;

class Query implements PromiseLike<any> {
  private filters: Filter[] = [];
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: any = null;
  private returning = false;
  private orderCol: string | null = null;
  private asc = true;
  private from = 0;
  private to = Infinity;
  private mode: "many" | "single" | "maybe" = "many";
  private countOnly = false;
  private wantCount = false;
  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op !== "select") this.returning = true;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.countOnly = true;
    return this;
  }
  insert(rows: any) { this.op = "insert"; this.payload = rows; return this; }
  upsert(rows: any) { this.op = "upsert"; this.payload = rows; return this; }
  update(patch: any) { this.op = "update"; this.payload = patch; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  gte(c: string, v: any) { this.filters.push((r) => r[c] >= v); return this; }
  lte(c: string, v: any) { this.filters.push((r) => r[c] <= v); return this; }
  in(c: string, vs: any[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  not(c: string, op: string, v: any) { if (op === "is" && v === null) this.filters.push((r) => r[c] !== null && r[c] !== undefined); return this; }
  overlaps(c: string, vs: any[]) { this.filters.push((r) => (r[c] || []).some((x: any) => vs.includes(x))); return this; }
  or() { return this; }
  order(c: string, o?: { ascending?: boolean }) { this.orderCol = c; this.asc = o?.ascending !== false; return this; }
  range(a: number, b: number) { this.from = a; this.to = b; return this; }
  limit(n: number) { this.to = this.from + n - 1; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }

  private run() {
    const s = db();
    s[this.table] ||= [];
    const rows = s[this.table];
    const match = (r: any) => this.filters.every((f) => f(r));
    let out: any[] = [];
    if (this.op === "insert" || this.op === "upsert") {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((x: any) => ({ id: uid(this.table[0]), created_at: new Date().toISOString(), ...x }));
      for (const item of list) {
        const existing = this.op === "upsert" && item.phone ? rows.find((r) => r.phone === item.phone) : this.op === "upsert" ? rows.find((r) => r.id === item.id) : null;
        if (existing) Object.assign(existing, { ...item, id: existing.id });
        else rows.unshift(item);
      }
      out = list;
    } else if (this.op === "update") {
      out = rows.filter(match);
      out.forEach((r) => Object.assign(r, this.payload));
    } else if (this.op === "delete") {
      out = rows.filter(match);
      s[this.table] = rows.filter((r) => !match(r));
    } else {
      out = rows.filter(match);
      if (this.orderCol) {
        const c = this.orderCol;
        out = [...out].sort((a, b) => ((a[c] ?? "") < (b[c] ?? "") ? -1 : (a[c] ?? "") > (b[c] ?? "") ? 1 : 0) * (this.asc ? 1 : -1));
      }
    }
    const count = out.length;
    if (this.op === "select") out = out.slice(this.from, this.to === Infinity ? undefined : this.to + 1);
    if (this.countOnly) return { data: null, count, error: null };
    if (this.op !== "select" && !this.returning) return { data: null, error: null };
    if (this.mode !== "many") {
      const row = out[0] ?? null;
      if (!row && this.mode === "single") return { data: null, error: { message: "Not found" } };
      return { data: row ? { ...row } : null, error: null };
    }
    return { data: out.map((r) => ({ ...r })), count: this.wantCount ? count : null, error: null };
  }

  then<A = any, B = never>(ok?: ((v: any) => A | PromiseLike<A>) | null, fail?: ((e: any) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve(this.run()).then(ok, fail);
  }
}

export function demoClient(): any {
  const channel = { on() { return channel; }, subscribe() { return channel; } };
  return {
    from: (t: string) => new Query(t),
    rpc: async () => ({ data: null, error: null }),
    channel: () => channel,
    removeChannel: () => {},
    auth: {
      getUser: async () => ({ data: { user: DEMO_USER } }),
      signOut: async () => { exitDemo(); return { error: null }; },
      signInWithPassword: async () => ({ error: null }),
      signUp: async () => ({ data: { session: {} }, error: null }),
    },
  };
}

// ---------- fake API routes ----------
let templates = [...DEMO_TEMPLATES];

export async function demoApi(url: string, body?: any, method?: string): Promise<any> {
  await new Promise((r) => setTimeout(r, 250));
  const m = method || (body ? "POST" : "GET");
  const path = url.split("?")[0];
  const s = db();

  if (path === "/api/templates") {
    if (m === "GET") return { templates };
    if (m === "DELETE") {
      const name = new URL(url, "http://x").searchParams.get("name");
      templates = templates.filter((t) => t.name !== name);
      return { ok: true };
    }
    templates = [{ id: uid("t"), status: "PENDING", ...body }, ...templates];
    setTimeout(() => { templates = templates.map((t) => (t.name === body.name ? { ...t, status: "APPROVED" } : t)); }, 8000);
    return { id: "demo" };
  }
  if (path === "/api/media") return { id: "demo-media", handle: "demo-handle" };
  if (path === "/api/broadcasts" && m === "POST") {
    const audience = s.contacts.filter((c) => c.opted_in && (!body.audience_tags?.length || c.tags.some((t: string) => body.audience_tags.includes(t))));
    const id = uid("b");
    const scheduled = body.scheduled_at && new Date(body.scheduled_at).getTime() > Date.now();
    s.broadcasts.unshift({ id, owner_id: DEMO_USER.id, ...body, status: scheduled ? "scheduled" : "sending", total: audience.length, sent: 0, delivered: 0, read: 0, failed: 0, created_at: new Date().toISOString() });
    audience.forEach((c, i) => s.broadcast_recipients.push({ id: `${id}-${i}`, broadcast_id: id, owner_id: DEMO_USER.id, contact_id: c.id, phone: c.phone, name: c.name, status: "pending", error: null, updated_at: new Date().toISOString() }));
    if (!scheduled) simulateSend(id);
    return { id };
  }
  if (path.startsWith("/api/broadcasts/")) {
    const id = path.split("/")[3];
    if (m === "DELETE") s.broadcasts = s.broadcasts.filter((b) => b.id !== id);
    return { ok: true };
  }
  if (path === "/api/inbox/send") {
    const msg = { id: uid("m"), owner_id: DEMO_USER.id, contact_id: body.contact_id, direction: "out", type: "text", body: body.text, status: "sent", source: "inbox", created_at: new Date().toISOString() };
    s.messages.push(msg);
    const c = s.contacts.find((x) => x.id === body.contact_id);
    if (c) { c.last_message_at = msg.created_at; c.last_message_preview = body.text; }
    setTimeout(() => (msg.status = "read"), 3000);
    return { message: msg };
  }
  if (path === "/api/whatsapp/connect") {
    if (m === "GET") return { connected: true, info: { quality_rating: "GREEN", messaging_limit_tier: "TIER_1K" }, token_expires_at: 0 };
    throw new Error("This is a demo — create a free account to connect your own number.");
  }
  if (path === "/api/whatsapp/webhook-info") return { callback_url: `${location.origin}/api/webhook`, verify_token: "demo-verify-token" };
  if (path === "/api/whatsapp/lookup") throw new Error("This is a demo — create a free account to connect your own number.");
  return {};
}

function simulateSend(id: string) {
  const s = db();
  const tick = () => {
    const pending = s.broadcast_recipients.filter((r) => r.broadcast_id === id && r.status === "pending").slice(0, 40);
    pending.forEach((r) => {
      const x = Math.random();
      r.status = x < 0.04 ? "failed" : x < 0.5 ? "read" : x < 0.9 ? "delivered" : "sent";
      if (r.status === "failed") r.error = "Recipient is not on WhatsApp";
      r.updated_at = new Date().toISOString();
    });
    const all = s.broadcast_recipients.filter((r) => r.broadcast_id === id);
    const b = s.broadcasts.find((x) => x.id === id);
    if (!b) return;
    b.sent = all.filter((r) => ["sent", "delivered", "read"].includes(r.status)).length;
    b.delivered = all.filter((r) => ["delivered", "read"].includes(r.status)).length;
    b.read = all.filter((r) => r.status === "read").length;
    b.failed = all.filter((r) => r.status === "failed").length;
    if (all.every((r) => r.status !== "pending")) b.status = "completed";
    else setTimeout(tick, 700);
  };
  setTimeout(tick, 600);
}
