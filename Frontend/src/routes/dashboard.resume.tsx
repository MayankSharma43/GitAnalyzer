import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CountUp from "@/components/animations/CountUp";
import ClickSpark from "@/components/animations/ClickSpark";
import { repoRecommendations, keywordGap, atsScore } from "@/lib/mockData";
import { useDashboardContext } from "./dashboard";

function CircularProgress({ value, size = 200, color }: { value: number; size?: number; color: string }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1a1a1a" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tabular-nums" style={{ color }}>
          <CountUp to={value} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function ResumePage() {
  const { report } = useDashboardContext();
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const realResumeBullets = report.resume_bullets || [];

  const copyAll = async () => {
    const text = realResumeBullets.map((b: any) => `• ${b.rewritten}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(true);
    toast.success("copied to clipboard", { description: `${realResumeBullets.length} bullets` });
    setTimeout(() => setCopied(false), 2200);
  };

  const atsColor = atsScore < 60 ? "#ef4444" : atsScore < 80 ? "#f59e0b" : "#10b981";

  return (
    <div className="space-y-14">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          /dashboard / resume
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Your resume, rewritten by your code.
        </h1>
      </header>

      {/* Repos to lead / remove */}
      <section>
        <SectionLabel kicker="01" title="Lead with — and remove" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {repoRecommendations.map((r) => {
            const lead = r.verdict === "lead";
            return (
              <div
                key={r.name}
                className={`flex items-center gap-5 border-l-[3px] bg-[#0a0a0a] p-5 ${
                  lead ? "border-l-success" : "border-l-danger"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm">{r.name}</div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">{r.reason}</div>
                </div>
                <span
                  className={`shrink-0 border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
                    lead ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"
                  }`}
                  style={{ borderRadius: 4 }}
                >
                  {lead ? "lead with" : "remove"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Before / After */}
      <section>
        <SectionLabel kicker="02" title="Before / After" />
        <div className="mt-6 space-y-3">
          {realResumeBullets.map((b: any, i: number) => (
            <div key={i} className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
              {b.mismatch && (
                <div className="mb-3 inline-flex items-center gap-2 border border-warning/40 bg-warning/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-warning">
                  ⚠ mismatch detected
                </div>
              )}
              <div className="grid items-center gap-0 md:grid-cols-[1fr_auto_1fr]">
                <div className="relative p-4">
                  <div className="pointer-events-none absolute inset-0 bg-danger/[0.03]" />
                  <div className="relative font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">// before</div>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground line-through decoration-danger/40">
                    {b.original}
                  </p>
                </div>

                <div className="hidden md:flex flex-col items-center gap-2 self-stretch border-l border-r border-[#1a1a1a] px-2">
                  <div className="flex-1 border-l border-dashed border-[#2a2a2a]" />
                  <span className="border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    rewritten
                  </span>
                  <div className="flex-1 border-l border-dashed border-[#2a2a2a]" />
                </div>

                <div className="relative p-4">
                  <div className="pointer-events-none absolute inset-0 bg-success/[0.03]" />
                  <div className="relative font-mono text-xs uppercase tracking-[0.15em] text-success/80">// after</div>
                  <p className="relative mt-2 text-sm leading-relaxed text-foreground">{b.rewritten}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Keyword gap */}
      <section className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
        <SectionLabel kicker="03" title="Keyword gap" small />
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              in your resume
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywordGap.inResume.map((k) => {
                const inJobs = keywordGap.inJobs.includes(k);
                return (
                  <span
                    key={k}
                    className={`border px-3 py-1 font-mono text-[11px] ${
                      inJobs ? "border-success/40 text-foreground" : "border-[#1a1a1a] text-muted-foreground/50"
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    {k}
                  </span>
                );
              })}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-warning/80">
              in target job postings
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywordGap.inJobs.map((k) => {
                const present = keywordGap.inResume.includes(k);
                return (
                  <span
                    key={k}
                    className={`border px-3 py-1 font-mono text-[11px] ${
                      present ? "border-success/40 text-foreground" : "border-warning/40 bg-warning/10 text-warning"
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    {k}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ATS score ring */}
      <section className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <SectionLabel kicker="04" title="ATS score" small />
          <div className="mt-6">
            <CircularProgress value={atsScore} color={atsColor} />
          </div>
        </div>
        <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">/ why it isn't higher</div>
          <ul className="mt-4 space-y-2.5 font-mono text-[12px] text-muted-foreground">
            <li>› 9 target keywords missing (Next.js, OpenTelemetry, tRPC, Vitest…)</li>
            <li>› vague seniority claims contradict commit history</li>
            <li>› 2-column PDF layout breaks ATS parsing — switch to single column</li>
            <li>› no measurable outcomes in 4 of 7 bullets — add numbers</li>
            <li>› skills section uses graphics, not text — ATS skips them</li>
          </ul>
        </div>
      </section>

      {/* Copy CTA */}
      <section className="flex flex-col items-center gap-4 pt-4">
        <ClickSpark sparkCount={14} sparkRadius={28}>
          <button
            onClick={copyAll}
            className="border border-violet px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] text-violet-glow transition hover:bg-violet hover:text-white hover:shadow-[0_0_30px_#7c3aed60]"
          >
            {copied ? "✓ copied" : "copy all rewritten bullets"}
          </button>
        </ClickSpark>
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

export const Route = createFileRoute("/dashboard/resume")({
  head: () => ({
    meta: [
      { title: "Resume — CodeAudit" },
      { name: "description", content: "Your resume rewritten from your actual commits, with ATS score and keyword gap." },
    ],
  }),
  component: ResumePage,
});
