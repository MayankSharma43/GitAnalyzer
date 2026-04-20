import { useState } from "react";
import CountUp from "@/components/animations/CountUp";

const stats = [
  { value: 1247, label: "DEVS AUDITED", tip: "// and counting — updated live", separator: "," },
  { value: 12.4, label: "LINES READ (M)", tip: "// 12.4 million lines and growing", separator: "" },
  { value: 67, label: "AVG SCAN TIME (MS)", tip: "// blazing fast static analysis", separator: "" },
  { value: 38, label: "AVG ISSUES FOUND", tip: "// brutal but accurate", separator: "" },
];

export default function StatsBar() {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative grid h-[80px] grid-cols-2 border-y border-[#1a1a1a] bg-[#0d0d0d] md:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          className="relative flex items-center justify-center gap-4 px-4"
          style={{
            borderRight: i < stats.length - 1 ? "1px solid #1a1a1a" : undefined,
          }}
        >
          <span
            className="text-[28px] font-black"
            style={{
              color: hover === i ? "var(--violet-glow)" : "#f0f0f0",
              transition: "color 150ms",
            }}
          >
            <CountUp to={s.value} duration={1.6} separator={s.separator} />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#555]">
            {s.label}
          </span>
          {hover === i && (
            <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap border-l-2 border-violet bg-[#0a0a0a] px-3 py-1.5 font-mono text-[10px] text-[#f0f0f0]">
              {s.tip}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
