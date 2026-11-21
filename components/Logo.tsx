export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0B7A5C" />
      <path d="M20 9c-6.1 0-11 4.6-11 10.4 0 2.1.7 4.1 1.9 5.7L9.6 31l6.2-1.9c1.3.5 2.7.8 4.2.8 6.1 0 11-4.6 11-10.4S26.1 9 20 9Z" fill="#fff" />
      <path d="M14.5 18.2 17.6 23l2.4-3.6 2.4 3.6 3.1-4.8" stroke="#E2A33B" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false, size = 34 }: { light?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-[1.1]">
        <div className={`text-[16px] font-bold tracking-[-0.01em] ${light ? "text-white" : "text-ink-900"}`}>Wasil Oman</div>
        <div className={`text-[12px] font-medium ${light ? "text-ink-300" : "text-ink-400"}`} style={{ fontFamily: "var(--font-arabic)" }}>
          واصل عُمان
        </div>
      </div>
    </div>
  );
}
