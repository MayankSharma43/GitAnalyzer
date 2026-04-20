import { motion } from "framer-motion";
import CountUp from "@/components/animations/CountUp";

const findings = [
  {
    n: "01",
    title: "AUTH VULNERABILITIES",
    desc: "jwt.verify() called without algorithm enforcement",
    sev: "CRITICAL",
    bar: "██",
    label: "HIGH",
    color: "#ef4444",
    width: 90,
  },
  {
    n: "02",
    title: "ZERO TEST COVERAGE",
    desc: "14 of 17 functions have no corresponding test file",
    sev: "MAJOR",
    bar: "█",
    label: "MED",
    color: "#f59e0b",
    width: 60,
  },
  {
    n: "03",
    title: "OVER-ENGINEERED ABSTRACTIONS",
    desc: "Factory pattern used where a plain function would work",
    sev: "MINOR",
    bar: "░",
    label: "LOW",
    color: "#10b981",
    width: 30,
  },
];

const terminalBars = [
  { label: "modularity", pct: 78, fill: 8, total: 10, crit: false },
  { label: "test coverage", pct: 31, fill: 3, total: 10, crit: true },
  { label: "security", pct: 52, fill: 5, total: 10, crit: false },
  { label: "documentation", pct: 24, fill: 2, total: 10, crit: true },
  { label: "architecture", pct: 61, fill: 6, total: 10, crit: false },
];

export default function AuditBreakdown() {
  return (
    <section
      id="audit-breakdown"
      className="relative grid grid-cols-1 gap-0 border-b border-[#1a1a1a] bg-[#0a0a0a] lg:grid-cols-[60fr_40fr]"
    >
      {/* LEFT */}
      <div className="relative overflow-hidden px-6 py-24 md:px-12">
        {/* Ghost text */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-10px] top-[-20px] select-none font-black text-[#f0f0f0]"
          style={{
            fontSize: "clamp(8rem, 20vw, 18rem)",
            opacity: 0.03,
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          CODE
        </div>

        <div className="relative">
          <div className="mb-12 font-mono text-[10px] uppercase tracking-[0.15em] text-violet-glow">
            // WHAT WE ACTUALLY FIND
          </div>

          <div className="space-y-1">
            {findings.map((f, i) => (
              <motion.div
                key={f.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative grid grid-cols-[40px_1fr_auto] items-start gap-6 px-4 py-5 hover:bg-[#0f0f0f]"
                style={{ transition: "background-color 150ms" }}
              >
                {/* Hover left bar */}
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-violet group-hover:scale-y-100"
                  style={{ transition: "transform 200ms ease-out" }}
                />
                <span className="font-mono text-[11px] text-[#555]">{f.n}</span>
                <div>
                  <div className="text-[16px] font-bold text-[#f0f0f0]">{f.title}</div>
                  <div className="mt-1 font-mono text-[12px] text-[#666]">{f.desc}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: f.color }}>
                    {f.sev}
                  </span>
                  <div className="h-[4px] w-[140px] bg-[#1a1a1a]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${f.width}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                      className="h-full"
                      style={{ backgroundColor: f.color }}
                    />
                  </div>
                  <span className="w-10 font-mono text-[10px] text-[#888]">{f.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Terminal */}
      <div className="border-l border-[#1a1a1a] p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="group relative h-full border border-[#1a1a1a] bg-[#0d0d0d] p-6 font-mono text-[12px] leading-[1.7] text-[#a3a3a3] hover:shadow-[inset_0_0_40px_#7c3aed14]"
          style={{ transition: "box-shadow 200ms" }}
        >
          <div className="text-[#f0f0f0]">
            $ codeaudit scan github.com/dev/portfolio
          </div>
          <div className="mt-3">
            <div>Fetching profile...........done</div>
            <div>Repos found: 12</div>
            <div>Languages: JS 67% · Python 21% · CSS 12%</div>
          </div>
          <div className="mt-4 text-[#f0f0f0]">Running analysis</div>
          <div className="mt-1 space-y-0.5">
            {terminalBars.map((b, i) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-[#666]">{i === terminalBars.length - 1 ? "└──" : "├──"}</span>
                <span className="w-32">{b.label}</span>
                <span className="text-[#666]">[</span>
                <span className="text-violet-glow">
                  <BarFill total={b.total} fill={b.fill} delay={i * 50} />
                </span>
                <span className="text-[#666]">]</span>
                <span>
                  <CountUp to={b.pct} duration={1.2} suffix="%" />
                </span>
                {b.crit && <span className="ml-2 text-danger">← critical</span>}
              </div>
            ))}
          </div>
          <div className="mt-4">
            Score: <span className="text-[#f0f0f0]">
              <CountUp to={67} duration={1.4} />
            </span>/100
          </div>
          <div>
            Level: <span className="text-warning">MID-LEVEL</span>{" "}
            <span className="text-[#666]">(claimed: Senior)</span>
          </div>
          <div className="mt-3">
            <span className="inline-block h-[14px] w-[8px] animate-pulse bg-violet-glow align-middle" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BarFill({ total, fill, delay }: { total: number; fill: number; delay: number }) {
  return (
    <span className="inline-flex">
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.05, delay: (delay + i * 50) / 1000 }}
        >
          {i < fill ? "█" : "░"}
        </motion.span>
      ))}
    </span>
  );
}
