export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="12" fill="#136B5D" />
      <path d="M20 9c-6.1 0-11 4.6-11 10.4 0 2.1.7 4.1 1.9 5.7L9.6 31l6.2-1.9c1.3.5 2.7.8 4.2.8 6.1 0 11-4.6 11-10.4S26.1 9 20 9Z" fill="#fff" />
      <path d="M14.5 18.2 17.6 23l2.4-3.6 2.4 3.6 3.1-4.8" stroke="#B8923A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-tight">
        <div className={`text-[17px] font-bold ${light ? "text-white" : "text-ink-900"}`}>Wasil Oman</div>
        <div className={`text-xs font-medium ${light ? "text-brand-100" : "text-gold-500"}`}>واصل عُمان</div>
      </div>
    </div>
  );
}
