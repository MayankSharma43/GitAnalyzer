import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import CountUp from "@/components/animations/CountUp";
import { companyArchetypes, skillsHeatmap } from "@/lib/mockData";
import { useDashboardContext } from "./dashboard";

const archetypeColors: Record<string, string> = {
  "Series B startup": "#a78bfa",
  "Big Tech (FAANG)": "#06b6d4",
  "Boutique agency": "#f59e0b",
  "Fintech scale-up": "#10b981",
  "Open-source first": "#ef4444",
  "Enterprise SaaS": "#a78bfa",
};

function CircularProgress({ value, size = 180, color = "#a78bfa" }: { value: number; size?: number; color?: string }) {
  const stroke = 10;
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
        <span className="text-4xl font-black tabular-nums" style={{ color }}>
          <CountUp to={value} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function JobsPage() {
  const { report } = useDashboardContext();
  const [remote, setRemote] = useState(false);

  if (!report) return null;

  const realJobMatches = report.job_matches || [];

  return (
    <div className="space-y-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
            /dashboard / jobs
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Where you stand.
          </h1>
        </div>
        <div className="inline-flex border border-[#1a1a1a] bg-[#0a0a0a] p-1 font-mono text-[10px] uppercase tracking-[0.2em]">
          <button
            onClick={() => setRemote(false)}
            className={`px-5 py-2 transition ${!remote ? "bg-violet text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            local · berlin
          </button>
          <button
            onClick={() => setRemote(true)}
            className={`px-5 py-2 transition ${remote ? "bg-violet text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            remote
          </button>
        </div>
      </header>

      {/* Roles list */}
      <section>
        <SectionLabel kicker="01" title="Roles you qualify for" />
        <div className="mt-6 space-y-2">
          {realJobMatches.map((j: any) => {
            // @ts-ignore
            const min = remote && j.min ? j.min + 5 : j.min;
            // @ts-ignore
            const max = remote && j.max ? j.max + 12 : j.max;
            // @ts-ignore
            const match = j.match || 0;
            const color = match > 70 ? "#10b981" : match > 50 ? "#f59e0b" : "#ef4444";
            return (
              <div
                // @ts-ignore
                key={j.title}
                className="grid grid-cols-1 items-center gap-4 border-l-[2px] border-[#1a1a1a] bg-[#0a0a0a] p-5 transition hover:border-violet hover:bg-[#0f0f0f] md:grid-cols-[2fr_1fr_1.5fr_auto]"
              >
                <div>
                  <div className="font-semibold">{j.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{j.company}</div>
                </div>
                <div className="font-mono text-sm tabular-nums">
                  $<CountUp to={min} />k – $<CountUp to={max} />k
                </div>
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em]">
                    <span className="text-muted-foreground">match</span>
                    <span className="tabular-nums" style={{ color }}><CountUp to={match} />%</span>
                  </div>
                  <div className="mt-1 h-[3px] overflow-hidden bg-[#1a1a1a]">
                    <motion.div
                      className="h-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${match}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <a
                  href="#"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-glow transition hover:text-white"
                >
                  apply <span className="text-[0.85em]">↗</span>
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Salary spectrum */}
      <section className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6 md:p-8">
        <SectionLabel kicker="02" title="Salary spectrum" small />
        <div className="mt-8">
          <div className="relative h-4 overflow-hidden rounded-full bg-[#111]">
            <div className="absolute inset-y-0 left-[18%] flex w-[20%] items-center justify-center rounded-full bg-violet">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white">you</span>
            </div>
            <div className="absolute inset-y-0 left-[40%] w-[24%] rounded-full border border-dashed border-warning" />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>$40k</span><span>$80k</span><span>$120k</span><span>$160k</span><span>$200k+</span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">you're here</div>
              <div className="mt-2 text-3xl font-black tabular-nums">$<CountUp to={60} />k – $<CountUp to={80} />k</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-warning/80">4 skills away</div>
              <div className="mt-2 text-3xl font-black tabular-nums text-warning">$<CountUp to={80} />k – $<CountUp to={110} />k</div>
            </div>
          </div>
        </div>
      </section>

      {/* Company archetypes */}
      <section>
        <SectionLabel kicker="03" title="Companies that would hire you" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companyArchetypes.map((c) => {
            const color = archetypeColors[c.type] ?? "#a78bfa";
            return (
              <div
                key={c.type}
                className="group relative overflow-hidden p-5 transition"
                style={{ background: `${color}0a` }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: color }}
                />
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100"
                  style={{ background: `${color}10` }}
                />
                <div className="relative">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    archetype
                  </div>
                  <div className="mt-1 font-bold">{c.type}</div>
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {c.expects}
                  </p>
                  <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em]">
                    <span className="text-muted-foreground">likelihood</span>
                    <span style={{ color }}>
                      <CountUp to={c.likelihood} />%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skills heatmap + stack match ring */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <SectionLabel kicker="04" title="In-demand skills" small />
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            // hotter = higher hiring frequency in your target band
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {skillsHeatmap.map((s) => {
              const heat = s.demand / 100;
              const sizeBase = 0.78 + heat * 0.6;
              return (
                <span
                  key={s.skill}
                  className="border px-3 py-1.5 font-mono uppercase tracking-[0.05em] transition"
                  style={{
                    fontSize: `${sizeBase}rem`,
                    background: `color-mix(in oklab, #7c3aed ${heat * 60}%, transparent)`,
                    borderColor: `color-mix(in oklab, #7c3aed ${heat * 100}%, #1a1a1a)`,
                    color: heat > 0.7 ? "white" : "var(--foreground)",
                    borderRadius: 4,
                  }}
                >
                  {s.skill}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <SectionLabel kicker="05" title="Stack match" small />
          <div className="mt-6">
            <CircularProgress value={61} size={180} color="#a78bfa" />
          </div>
          <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
            // of what your target companies hire for
          </p>
          <div className="mt-5 w-full space-y-1.5 font-mono text-[11px]">
            <Row ok label="TypeScript, React, Node" />
            <Row ok label="PostgreSQL, AWS basics" />
            <Row label="Kubernetes, Terraform" />
            <Row label="OpenTelemetry, distributed tracing" />
            <Row warn label="Next.js (basic, not App Router)" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, ok, warn }: { label: string; ok?: boolean; warn?: boolean }) {
  const color = ok ? "text-success" : warn ? "text-warning" : "text-danger";
  const sym = ok ? "✓" : warn ? "~" : "✗";
  return (
    <div className="flex items-center gap-2">
      <span className={color}>{sym}</span>
      <span className="text-muted-foreground">{label}</span>
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

export const Route = createFileRoute("/dashboard/jobs")({
  head: () => ({
    meta: [
      { title: "Job Market — CodeAudit" },
      { name: "description", content: "Roles you qualify for, salary spectrum, in-demand skills, stack match." },
    ],
  }),
  component: JobsPage,
});
