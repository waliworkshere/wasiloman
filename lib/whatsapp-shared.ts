/** Counts {{1}}, {{2}} … placeholders in a template text (safe for browser + server). */
export function countVars(text?: string) {
  if (!text) return 0;
  const m = text.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
  return new Set(m.map((x) => x.replace(/\D/g, ""))).size;
}

/** A variable in a broadcast is filled from a contact field or a fixed text */
export type VarSource = { type: "name" | "phone" | "attribute" | "text"; value?: string; fallback?: string };

export function resolveVar(src: VarSource, contact: { name?: string | null; phone: string; attributes?: Record<string, any> }) {
  let v = "";
  if (src.type === "name") v = contact.name || "";
  else if (src.type === "phone") v = contact.phone;
  else if (src.type === "attribute") v = String(contact.attributes?.[src.value || ""] ?? "");
  else v = src.value || "";
  return v.trim() || src.fallback || "-";
}
