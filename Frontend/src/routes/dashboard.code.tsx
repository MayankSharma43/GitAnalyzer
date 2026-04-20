import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import CountUp from "@/components/animations/CountUp";
import { repos, languageStack } from "@/lib/mockData";

const langColor: Record<string, string> = {
  TypeScript: "#a78bfa",
  Python: "#06b6d4",
  Go: "#10b981",
  Rust: "#f59e0b",
  JavaScript: "#ef4444",
  "Node.js": "#10b981",
  HCL: "#06b6d4",
};

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 w-20 overflow-hidden bg-[#1a1a1a]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full"
          style={{ background: color }}
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

const heatmap = Array.from({ length: 52 * 7 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const v = (seed / 233280) ** 1.6;
  return Math.floor(v * 5);
});
const heatColors = ["#111", "#3b1f6b", "#6d28d9", "#7c3aed", "#a78bfa"];

function CodePage() {
  const [openRow, setOpenRow] = useState<string | null>("payments-api");

  return (
    <div className="space-y-14">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          /dashboard / code
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          What your code actually says.
        </h1>
      </header>

      {/* Repo list */}
      <section className="overflow-hidden rounded-md border border-[#1a1a1a]">
        <div className="grid grid-cols-[2fr_1fr_repeat(5,_minmax(80px,_1fr))] gap-4 border-b border-[#1a1a1a] bg-[#0a0a0a] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>repo</span>
          <span>lang</span>
          <span>score</span>
          <span>modular</span>
          <span>tests</span>
          <span>docs</span>
          <span>arch</span>
        </div>
        <div>
          {repos.map((r) => {
            const open = openRow === r.name;
            return (
              <div key={r.name} className="border-b border-[#111] last:border-b-0">
                <button
                  onClick={() => setOpenRow(open ? null : r.name)}
                  className={`group relative grid h-16 w-full grid-cols-[2fr_1fr_repeat(5,_minmax(80px,_1fr))] items-center gap-4 bg-[#0a0a0a] px-5 text-left transition hover:bg-[#0f0f0f] ${open ? "bg-[#0f0f0f]" : ""}`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-violet transition-transform duration-300 group-hover:scale-y-100 ${open ? "scale-y-100" : ""}`}
                  />
                  <span className="font-mono text-sm">{r.name}</span>
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: langColor[r.lang] || "#888" }} />
                    {r.lang}
                  </span>
                  <ScoreBar value={r.score} />
                  <ScoreBar value={r.modularity} />
                  <ScoreBar value={r.coverage} />
                  <ScoreBar value={r.docs} />
                  <ScoreBar value={r.architecture} />
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden bg-[#070707]"
                    >
                      <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
                        <div className="overflow-hidden border-l-[4px] border-violet bg-[#070707]">
                          <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                            <span>{r.name}/src/auth/jwt.ts</span>
                            <span className="text-danger">3 issues</span>
                          </div>
                          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7">
                            <span className="mr-3 text-muted-foreground/40">32</span>{`export async function refresh(token: string) {`}{`\n`}
                            <span className="mr-3 text-muted-foreground/40">33</span>{`  `}
                            <span className="border-l-2 border-danger bg-[#1a0a0a] pl-2 pr-1 text-danger">{`const payload = jwt.decode(token); // ❌ no signature verify`}</span>{`\n`}
                            <span className="mr-3 text-muted-foreground/40">34</span>{`  if (!payload) throw new Error("bad token");`}{`\n`}
                            <span className="mr-3 text-muted-foreground/40">35</span>{`  `}
                            <span className="border-l-2 border-danger bg-[#1a0a0a] pl-2 pr-1 text-danger">{`return jwt.sign(payload, SECRET, { expiresIn: "30d" });`}</span>{`\n`}
                            <span className="mr-3 text-muted-foreground/40">36</span>{`}`}
                          </pre>
                        </div>
                        <div className="space-y-3">
                          {[
                            { tag: "WHAT", color: "danger", text: "jwt.decode does not verify the signature — any base64 payload is accepted." },
                            { tag: "WHY", color: "warning", text: "An attacker can forge a refresh and obtain valid access tokens forever." },
                            { tag: "FIX", color: "success", text: "Use jwt.verify(token, SECRET) and reject on JsonWebTokenError." },
                          ].map((c) => (
                            <div key={c.tag} className={`border-l-[3px] bg-[#0d0d0d] p-4 border-l-${c.color}`}>
                              <div className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-${c.color}`}>
                                {c.tag}
                              </div>
                              <p className="mt-1.5 text-sm text-muted-foreground">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Heatmap + stack donut */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
            / consistency
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight">52 weeks of commits</h2>
          <div className="mt-6 grid grid-flow-col grid-rows-7 gap-[2px] overflow-x-auto">
            {heatmap.map((v, i) => (
              <div
                key={i}
                className="h-[10px] w-[10px] rounded-[2px]"
                style={{ background: heatColors[v] }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            less
            {heatColors.map((c, i) => (
              <span key={i} className="ml-1 h-[10px] w-[10px] rounded-[2px]" style={{ background: c }} />
            ))}
            <span className="ml-1">more</span>
          </div>
        </div>

        <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
            / language stack
          </div>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languageStack} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} stroke="#0d0d0d" strokeWidth={2}>
                  {languageStack.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            {languageStack.map((l) => (
              <div key={l.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                <span className="text-muted-foreground">{l.name}</span>
                <span className="ml-auto tabular-nums">{l.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Anti-patterns */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="border-l-[3px] border-warning bg-[#0d0d0d] p-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-warning">
              suspected copied
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">ml-pipeline/utils/debounce.py</span>
          </div>
          <pre className="mt-4 overflow-x-auto bg-[#070707] p-4 font-mono text-[11px] leading-6">{`# verbatim match: stackoverflow.com/a/2823
def debounce(wait):
    def decorator(fn):
        ...`}</pre>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            // author may not understand decorator semantics
          </p>
        </div>
        <div className="border-l-[3px] border-warning bg-[#0d0d0d] p-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-warning">
              over-engineered
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">payments-api/factory.factory.ts</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <pre className="bg-[#070707] p-4 font-mono text-[11px] leading-6 text-danger">{`new FactoryFactory()
  .createFactory("user")
  .build({ name: "X" })`}</pre>
            <pre className="bg-[#070707] p-4 font-mono text-[11px] leading-6 text-success">{`{ name: "X", id: nanoid() }`}</pre>
          </div>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            // 4-line abstraction wraps a 1-line need
          </p>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/code")({
  head: () => ({
    meta: [
      { title: "Code Audit — CodeAudit" },
      { name: "description", content: "Per-repo scores, anti-patterns, copy-paste detection, over-engineering flags." },
    ],
  }),
  component: CodePage,
});
