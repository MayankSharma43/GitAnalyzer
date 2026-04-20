import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import CountUp from "@/components/animations/CountUp";
import { webVitals, waterfall, a11yViolations } from "@/lib/mockData";

function Device({ label, w, issues }: { label: string; w: string; issues: string[] }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label} · {w}
      </div>
      <div
        className="mt-3 relative overflow-hidden rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-3"
        style={{ width: 220 }}
      >
        <div className="aspect-[9/16] rounded-sm bg-gradient-to-br from-violet/15 via-[#0d0d0d] to-cyan/10">
          {issues.map((iss, i) => (
            <span
              key={i}
              className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-danger font-mono text-[10px] font-bold text-white shadow-violet"
              style={{ top: `${20 + i * 22}%`, left: `${30 + ((i * 13) % 40)}%` }}
              title={iss}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      <ul className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground">
        {issues.map((iss, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-danger">{i + 1}.</span> {iss}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UIUXPage() {
  return (
    <div className="space-y-14">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          /dashboard / uiux
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          What users actually experience.
        </h1>
      </header>

      {/* Devices */}
      <section>
        <SectionLabel kicker="01" title="Across devices" small />
        <div className="mt-8 grid items-start gap-8 md:grid-cols-3">
          <Device label="mobile" w="375px" issues={["Text overflows on iPhone SE", "Tap target < 44px on filter button"]} />
          <Device label="tablet" w="768px" issues={["Sidebar awkwardly half-collapsed", "Hero image swaps mid-fold"]} />
          <Device label="desktop" w="1440px" issues={["CTA buried below the fold", "Unused horizontal space"]} />
        </div>
      </section>

      {/* Web vitals */}
      <section>
        <SectionLabel kicker="02" title="Core Web Vitals" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {webVitals.map((v) => {
            const color = v.status === "PASS" ? "success" : v.status === "FAIL" ? "danger" : "warning";
            return (
              <div key={v.metric} className={`border-l-[3px] bg-[#0d0d0d] p-6 border-l-${color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{v.metric}</span>
                  <span className={`border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] border-${color}/40 text-${color}`}>
                    {v.status}
                  </span>
                </div>
                <div className={`mt-4 text-4xl font-black tabular-nums text-${color}`}>
                  <CountUp to={v.value} duration={1.4} />{v.unit}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  target {v.target}
                </div>
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{v.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Waterfall */}
      <section className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
        <SectionLabel kicker="03" title="Load waterfall" small />
        <div className="mt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfall} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" stroke="#888" tick={{ fontSize: 10, fill: "#888", fontFamily: "JetBrains Mono" }} />
              <YAxis type="category" dataKey="name" stroke="#888" tick={{ fontSize: 11, fill: "#888", fontFamily: "JetBrains Mono" }} width={80} />
              <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono" }} />
              <Bar dataKey="time" radius={[0, 2, 2, 0]}>
                {waterfall.map((w, i) => (
                  <Cell key={i} fill={w.time > 700 ? "#ef4444" : w.time > 400 ? "#f59e0b" : "#a78bfa"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* a11y + interaction + animation */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <SectionLabel kicker="04" title="Accessibility" small />
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-5xl font-black tabular-nums text-warning">
              <CountUp to={61} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">/ 100 wcag aa</span>
          </div>
          <ul className="mt-6 space-y-2">
            {a11yViolations.map((a) => (
              <li key={a.kind} className="flex items-start gap-3 border-l-2 border-danger/50 bg-[#0a0a0a] p-3">
                <span className="border border-danger/40 bg-danger/10 px-2 py-0.5 font-mono text-[10px] font-bold text-danger">
                  ×{a.count}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.kind}</div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">{a.fix}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
            <SectionLabel kicker="05" title="Interaction feedback" small />
            <ul className="mt-4 space-y-2 font-mono text-[12px]">
              <li className="flex gap-3"><span className="text-success">✓</span> hover states present</li>
              <li className="flex gap-3"><span className="text-success">✓</span> form validation</li>
              <li className="flex gap-3"><span className="text-danger">✗</span> missing loading indicators on async actions</li>
              <li className="flex gap-3"><span className="text-danger">✗</span> no error messages on form submit failure</li>
              <li className="flex gap-3"><span className="text-warning">~</span> disabled states unclear</li>
            </ul>
          </div>
          <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
            <SectionLabel kicker="06" title="Animation smoothness" small />
            <div className="mt-3 text-3xl font-black tabular-nums text-warning">
              <CountUp to={48} /> fps
            </div>
            <ul className="mt-4 space-y-2 font-mono text-[11px] text-muted-foreground">
              <li>› scroll jank on hero (large background image repaint)</li>
              <li>› css transition on `top` triggers layout — use `transform: translateY()`</li>
              <li>› 200ms hover delay on nav feels sluggish</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ kicker, title, small = false }: { kicker: string; title: string; small?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">/ {kicker}</div>
      <h2 className={`mt-2 font-black tracking-tight ${small ? "text-2xl" : "text-2xl md:text-3xl"}`}>{title}</h2>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/uiux")({
  head: () => ({
    meta: [
      { title: "UI/UX Audit — CodeAudit" },
      { name: "description", content: "Core Web Vitals, accessibility, interaction, animation smoothness." },
    ],
  }),
  component: UIUXPage,
});
