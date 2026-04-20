import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import CountUp from "@/components/animations/CountUp";
import ClickSpark from "@/components/animations/ClickSpark";
import { securityFindings, exposedSecrets, fixQueue } from "@/lib/mockData";

const riskCards = [
  { label: "HIGH", value: 4, color: "danger" as const },
  { label: "MEDIUM", value: 7, color: "warning" as const },
  { label: "LOW", value: 12, color: "success" as const },
];

function SecurityPage() {
  const [fixed, setFixed] = useState<number[]>([]);

  return (
    <div className="space-y-14">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          /dashboard / security
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Your attack surface.
        </h1>
      </header>

      {/* Risk summary — enormous numbers */}
      <section className="grid gap-4 md:grid-cols-3">
        {riskCards.map((r) => (
          <div
            key={r.label}
            className={`border-l-[3px] bg-[#0d0d0d] p-6 border-l-${r.color}`}
          >
            <div className={`font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-${r.color}`}>
              {r.label} risk
            </div>
            <div
              className={`mt-3 font-black leading-none tabular-nums text-${r.color}`}
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.04em" }}
            >
              <CountUp to={r.value} duration={1.4} />
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              findings
            </div>
          </div>
        ))}
      </section>

      {/* Exposed secrets */}
      <section className="border-l-[3px] border-l-danger bg-[#1a0a0a]/40 p-5">
        <div className="flex items-start gap-3">
          <span className="font-mono text-lg text-danger">⚠</span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-danger">
              exposed secrets detected
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              // {exposedSecrets.length} hard-coded secrets committed. rotate immediately.
            </p>
            <ul className="mt-4 space-y-1.5 font-mono text-[11px]">
              {exposedSecrets.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-danger">›</span>
                  <span>{s.file}</span>
                  <span className="text-muted-foreground">— {s.type}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Auth flaw cards */}
      <section className="space-y-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
            / 01
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Auth & data flaws</h2>
        </div>
        {securityFindings.map((f, i) => {
          const color = f.severity === "HIGH" ? "danger" : f.severity === "MEDIUM" ? "warning" : "success";
          return (
            <div key={i} className={`border-l-[3px] bg-[#0d0d0d] p-5 md:p-6 border-l-${color}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className={`inline-flex items-center border bg-[#1a0a0a] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] border-${color}/40 text-${color}`}>
                  {f.owasp}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {f.file}:{f.line}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <pre className="mt-4 overflow-x-auto rounded-sm border-l-2 border-danger bg-[#070707] p-4 font-mono text-[12px] leading-6">{f.snippet}</pre>
              <div className="mt-3 flex items-start gap-2 font-mono text-[12px]">
                <span className="text-success">→</span>
                <span className="text-muted-foreground">{f.fix}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Schema review */}
      <section className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">/ 02</div>
        <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Schema review</h2>
        <div className="mt-6 divide-y divide-[#1a1a1a]">
          {[
            { issue: "users.email has no unique index", sev: "HIGH", fix: "CREATE UNIQUE INDEX ON users(email)" },
            { issue: "N+1 query on /api/orders", sev: "MEDIUM", fix: "Add `.include({ items: true })` (Prisma)" },
            { issue: "invoices not normalized — billing_address as JSON", sev: "LOW", fix: "Extract to `addresses` table" },
          ].map((r, i) => {
            const c = r.sev === "HIGH" ? "danger" : r.sev === "MEDIUM" ? "warning" : "success";
            return (
              <div key={i} className="grid items-center gap-3 py-3 md:grid-cols-[2fr_auto_2fr]">
                <div className="text-sm">{r.issue}</div>
                <span className={`inline-flex w-fit border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] border-${c}/40 text-${c}`}>
                  {r.sev}
                </span>
                <div className="font-mono text-[11px] text-muted-foreground">{r.fix}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fix priority queue */}
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">/ 03</div>
        <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Fix priority queue</h2>
        <div className="mt-6 space-y-2">
          {fixQueue.map((f) => {
            const isFixed = fixed.includes(f.rank);
            return (
              <div
                key={f.rank}
                className={`flex items-center gap-5 border-l-[3px] bg-[#0d0d0d] p-4 transition ${
                  isFixed ? "border-l-success opacity-50" : "border-l-violet"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center font-mono text-sm font-black text-violet-glow">
                  {String(f.rank).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${isFixed ? "line-through" : ""}`}>{f.title}</div>
                  <div className="mt-1 flex gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <span>{f.effort}</span>
                    <span>impact: <span className="text-warning">{f.impact}</span></span>
                  </div>
                </div>
                <ClickSpark sparkColor={isFixed ? "#10b981" : "#a78bfa"}>
                  <button
                    onClick={() => {
                      const next = isFixed;
                      setFixed((p) => (next ? p.filter((r) => r !== f.rank) : [...p, f.rank]));
                      if (!next) toast.success("marked as fixed", { description: f.title });
                    }}
                    className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition ${
                      isFixed
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-[#2a2a2a] text-muted-foreground hover:border-violet hover:text-violet-glow"
                    }`}
                  >
                    {isFixed ? "✓ fixed" : "mark fixed"}
                  </button>
                </ClickSpark>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/security")({
  head: () => ({
    meta: [
      { title: "Security Audit — CodeAudit" },
      { name: "description", content: "Auth flaws, exposed secrets, schema review, prioritized fix queue." },
    ],
  }),
  component: SecurityPage,
});
