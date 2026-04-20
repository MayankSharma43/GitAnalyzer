import { useState } from "react";

const items = [
  "GITHUB AUDIT",
  "CODE QUALITY",
  "SECURITY SCAN",
  "JOB MATCHING",
  "RESUME REWRITE",
  "90-DAY ROADMAP",
  "BRUTAL HONESTY",
];

export default function Marquee() {
  const [slow, setSlow] = useState(false);
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className="relative h-[44px] overflow-hidden bg-violet"
      onMouseEnter={() => setSlow(true)}
      onMouseLeave={() => setSlow(false)}
    >
      <div
        className="flex h-full items-center whitespace-nowrap"
        style={{
          animation: `marquee-scroll ${slow ? "100s" : "30s"} linear infinite`,
        }}
      >
        {repeated.map((it, i) => (
          <span
            key={i}
            className="flex items-center gap-6 px-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#f0f0f0]"
          >
            {it}
            <span className="text-[#5b1fb8]">✦</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
