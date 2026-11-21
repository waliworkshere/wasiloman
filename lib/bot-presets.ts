import type { FlowEdge, FlowNode } from "./flow-types";

type Preset = { key: string; en: string; ar: string; descEn: string; descAr: string; keywords: string[]; match_type: string; nodes: FlowNode[]; edges: FlowEdge[] };

const e = (source: string, target: string, sourceHandle = "next"): FlowEdge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle });

export const PRESETS: Preset[] = [
  {
    key: "blank",
    en: "Start from scratch",
    ar: "ابدأ من الصفر",
    descEn: "An empty bot with just a start point.",
    descAr: "رد آلي فارغ بنقطة بداية فقط.",
    keywords: ["hi"],
    match_type: "exact",
    nodes: [{ id: "start", type: "start", position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  },
  {
    key: "menu",
    en: "Welcome menu",
    ar: "قائمة ترحيب",
    descEn: "Greets customers and shows options: prices, location, talk to staff.",
    descAr: "يرحب بالعملاء ويعرض خيارات: الأسعار، الموقع، التحدث مع موظف.",
    keywords: ["hi", "hello", "menu", "مرحبا", "السلام عليكم", "قائمة"],
    match_type: "contains",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
      { id: "welcome", type: "choices", position: { x: 0, y: 120 }, data: { text: "Marhaba {name}! 👋 Welcome to our shop.\nأهلاً وسهلاً! كيف نقدر نساعدك؟", options: ["Prices / الأسعار", "Location / الموقع", "Talk to us / موظف"] } },
      { id: "prices", type: "message", position: { x: -360, y: 360 }, data: { text: "💰 Our prices start from 5 OMR. Full price list: https://example.om/prices" } },
      { id: "loc", type: "message", position: { x: 0, y: 360 }, data: { text: "📍 Al Khuwair, Muscat\n🕘 Sat–Thu 9am–10pm\nhttps://maps.google.com" } },
      { id: "human", type: "handoff", position: { x: 360, y: 360 }, data: { text: "Thank you! A team member will reply to you shortly. 🙏\nشكراً لك! سيرد عليك أحد موظفينا قريباً." } },
    ],
    edges: [e("start", "welcome"), e("welcome", "prices", "opt-0"), e("welcome", "loc", "opt-1"), e("welcome", "human", "opt-2")],
  },
  {
    key: "lead",
    en: "Collect customer details",
    ar: "جمع بيانات العميل",
    descEn: "Asks for name and area, saves them to the contact, and tags them as a lead.",
    descAr: "يسأل عن الاسم والمنطقة، ويحفظها في جهة الاتصال، ويضيف وسم «عميل محتمل».",
    keywords: ["offer", "عرض", "register", "تسجيل"],
    match_type: "contains",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 0 }, data: {} },
      { id: "q1", type: "question", position: { x: 0, y: 120 }, data: { text: "Great! What is your name? / ما اسمك الكريم؟", saveAs: "full_name" } },
      { id: "q2", type: "question", position: { x: 0, y: 260 }, data: { text: "Which area are you in? (e.g. Seeb, Sohar, Salalah) / في أي منطقة أنت؟", saveAs: "area" } },
      { id: "t", type: "tag", position: { x: 0, y: 400 }, data: { tag: "lead" } },
      { id: "done", type: "message", position: { x: 0, y: 520 }, data: { text: "Thank you {full_name}! ✅ We'll send you our best offers in {area}.\nشكراً لك! سنرسل لك أفضل العروض." } },
    ],
    edges: [e("start", "q1"), e("q1", "q2"), e("q2", "t"), e("t", "done")],
  },
];
