/* eslint-disable @next/next/no-img-element */

/** The square app icon (the ن with the WhatsApp bubble) */
export function LogoMark({ size = 34 }: { size?: number }) {
  return <img src="/icon.png" alt="" width={size} height={size} className="shrink-0 rounded-[22%]" />;
}

/** The واصل عُمان wordmark, with a small Latin name underneath */
export function Logo({ light = false, size = 34 }: { light?: boolean; size?: number }) {
  const h = Math.round(size * 1.05);
  return (
    <div className="flex flex-col items-start gap-0.5">
      <img src="/logo.png" alt="Wasil Oman — واصل عُمان" height={h} width={Math.round(h * (900 / 228))} style={{ height: h, width: "auto" }} />
      <span className={`ps-0.5 text-[10.5px] font-semibold tracking-[0.02em] ${light ? "text-ink-300" : "text-ink-400"}`}>Wasil Oman</span>
    </div>
  );
}
