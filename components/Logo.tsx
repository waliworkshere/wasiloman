/* eslint-disable @next/next/no-img-element */

/** The bubble mark on its own (square app icon look when boxed) */
export function LogoMark({ size = 34, light = false }: { size?: number; light?: boolean }) {
  return <img src={light ? "/brand/mark-white.svg" : "/brand/mark.svg"} alt="" width={size} height={size} className="shrink-0" />;
}

/** WasilOman: bubble mark + wordmark. `size` is the mark's height in px. */
export function Logo({ light = false, size = 30 }: { light?: boolean; size?: number }) {
  const word = Math.round(size * 0.66);
  return (
    <span className="inline-flex items-center gap-[0.3em]" style={{ fontSize: size }} dir="ltr">
      <LogoMark size={size} light={light} />
      <img
        src={light ? "/brand/wordmark-white.png" : "/brand/wordmark-black.png"}
        alt="WasilOman"
        height={word}
        width={Math.round(word * (1200 / 195))}
        style={{ height: word, width: "auto" }}
      />
    </span>
  );
}
