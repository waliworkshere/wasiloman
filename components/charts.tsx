"use client";
import { useState } from "react";

export type Series = { key: string; label: string; color: string; kind: "area" | "line" | "bar" };
export type Point = { label: string; [k: string]: number | string };

const W = 720;
const H = 240;
const PAD = { l: 40, r: 40, t: 12, b: 26 };

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Lightweight SVG time chart: areas/lines on the main scale, bars for a secondary measure */
export function TimeChart({ data, series, height = H }: { data: Point[]; series: Series[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const h = height;
  const innerW = W - PAD.l - PAD.r;
  const innerH = h - PAD.t - PAD.b;
  const main = series.filter((s) => s.kind !== "bar");
  const bars = series.filter((s) => s.kind === "bar");
  const max = niceMax(Math.max(1, ...data.flatMap((d) => main.map((s) => Number(d[s.key]) || 0))));
  // bars (e.g. replies) are much smaller, so they get their own scale on the right axis
  const barMax = niceMax(Math.max(1, ...data.flatMap((d) => bars.map((s) => Number(d[s.key]) || 0))));
  const yb = (v: number) => PAD.t + innerH - (v / barMax) * innerH;
  const x = (i: number) => PAD.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const barW = Math.max(4, (innerW / data.length) * 0.32);

  const path = (key: string) => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(Number(d[key]) || 0).toFixed(1)}`).join(" ");

  return (
    <div className="relative" dir="ltr">
      <svg viewBox={`0 0 ${W} ${h}`} className="h-auto w-full" role="img" aria-label={series.map((s) => s.label).join(", ")} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.filter((s) => s.kind === "area").map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#E3E8E6" strokeDasharray={t === 0 ? "" : "3 4"} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#7C8A88" className="num">{t >= 1000 ? `${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : t}</text>
          </g>
        ))}
        {bars.length > 0 && [0, 0.5, 1].map((t) => (
          <text key={`b${t}`} x={W - PAD.r + 8} y={yb(barMax * t) + 4} textAnchor="start" fontSize="11" fill={bars[0].color} className="num">{Math.round(barMax * t)}</text>
        ))}
        {data.map((d, i) => {
          const step = Math.ceil(data.length / 7);
          return (i % step === 0 && i < data.length - step / 2) || i === data.length - 1;
        }).map((show, i) => show && (
          <text key={i} x={x(i)} y={h - 6} textAnchor={i === data.length - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize="11" fill="#7C8A88">{data[i].label}</text>
        ))}
        {series.filter((s) => s.kind === "bar").map((s, si) =>
          data.map((d, i) => {
            const v = Number(d[s.key]) || 0;
            return <rect key={`${s.key}${i}`} x={x(i) - barW / 2 + si * 2} y={yb(v)} width={barW} height={Math.max(0, PAD.t + innerH - yb(v))} rx="2" fill={s.color} opacity={hover === null || hover === i ? 0.75 : 0.35} />;
          })
        )}
        {series.filter((s) => s.kind === "area").map((s) => (
          <g key={s.key}>
            <path d={`${path(s.key)} L${x(data.length - 1)},${PAD.t + innerH} L${x(0)},${PAD.t + innerH} Z`} fill={`url(#g-${s.key})`} />
            <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" />
          </g>
        ))}
        {series.filter((s) => s.kind === "line").map((s) => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + innerH} stroke="#0E1B22" strokeOpacity="0.15" />
            {series.filter((s) => s.kind !== "bar").map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(Number(data[hover][s.key]) || 0)} r="4" fill="white" stroke={s.color} strokeWidth="2" />
            ))}
          </g>
        )}
        {data.map((_, i) => (
          <rect key={i} x={x(i) - innerW / data.length / 2} y={PAD.t} width={innerW / data.length} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs shadow-pop"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? "-105%" : "8px"})` }}
        >
          <div className="mb-1 font-semibold text-ink-900">{data[hover].label}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.label}</span>
              <span className="num font-semibold text-ink-900">{Number(data[hover][s.key]).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, color = "#0B7A5C" }: { values: number[]; color?: string }) {
  const w = 72, h = 26;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ direction: "ltr" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
