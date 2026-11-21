/**
 * Normalises phone numbers to WhatsApp format (digits only, with country code).
 * Omani local numbers (8 digits starting with 7 or 9) get 968 added automatically.
 */
export function normalizePhone(input: string | number | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  let p = String(input).trim().replace(/[\s\-().]/g, "");
  // Convert Arabic-Indic digits
  p = p.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("00")) p = p.slice(2);
  p = p.replace(/\D/g, "");
  if (/^[79]\d{7}$/.test(p)) p = "968" + p;
  if (p.length < 8 || p.length > 15) return null;
  return p;
}

export function formatPhone(p: string) {
  if (p.startsWith("968") && p.length === 11) return `+968 ${p.slice(3, 7)} ${p.slice(7)}`;
  return "+" + p;
}
