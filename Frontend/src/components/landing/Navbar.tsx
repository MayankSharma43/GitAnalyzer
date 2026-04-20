import { useState } from "react";

export default function Navbar() {
  const [showTip, setShowTip] = useState(false);

  return (
    <nav className="relative z-30 flex h-[52px] items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div
          className="relative"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          <span className="font-mono text-[11px] font-medium text-violet-glow">+1</span>
          {showTip && (
            <div className="absolute left-0 top-full z-50 mt-2 whitespace-nowrap border-l-2 border-violet bg-[#0d0d0d] px-3 py-1.5 font-mono text-[10px] text-[#f0f0f0]">
              +1,247 devs audited
            </div>
          )}
        </div>
        <span className="text-[13px] font-bold tracking-[0.18em] text-[#f0f0f0]">
          CODEAUDIT
        </span>
      </div>

      {/* Center */}
      <div className="hidden items-center gap-8 md:flex">
        {["PROJECTS", "DOCS", "PRICING", "CHANGELOG"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-[11px] uppercase tracking-[0.12em] text-[#555] hover:text-[#f0f0f0]"
            style={{ transition: "none" }}
          >
            {item}
          </a>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <button className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#555] hover:text-[#f0f0f0]" style={{ transition: "none" }}>
          LIVE AUDIT <span className="text-[8px]">▼</span>
        </button>
        <button className="text-[#555] hover:text-[#f0f0f0]" style={{ transition: "none" }} aria-label="More">
          • • •
        </button>
      </div>
    </nav>
  );
}
