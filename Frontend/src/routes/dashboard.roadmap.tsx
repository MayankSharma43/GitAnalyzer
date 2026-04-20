import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import CountUp from "@/components/animations/CountUp";
import ClickSpark from "@/components/animations/ClickSpark";
import { skillROI, weeklyTasks } from "@/lib/mockData";
import { useDashboardContext } from "./dashboard";

function RoadmapPage() {
  const { report } = useDashboardContext();
  const [openWeek, setOpenWeek] = useState<string | null>("Week 1");
  const [done, setDone] = useState<string[]>([]);

  const allTasks = useMemo(
    () => weeklyTasks.flatMap((w) => [...w.build, ...w.read, ...w.fix].map((t) => `${w.week}|${t}`)),
    [],
  );
  const completed = done.length;

  if (!report) return null;

  const realRoadmap = report.roadmap || [];

  return (
    <div className="space-y-14">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          /dashboard / roadmap
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Your next 90 days.
        </h1>
      </header>

      {/* Timeline */}
      <section className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6 md:p-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">/ timeline</div>
        <svg viewBox="0 0 1000 60" className="mt-4 block h-16 w-full">
          {/* Static base line */}
          <line x1="40" y1="30" x2="960" y2="30" stroke="#1a1a1a" strokeWidth="2" />
          {/* Animated drawing line */}
          <motion.line
            x1="40" y1="30" x2="960" y2="30"
            stroke="#a78bfa" strokeWidth="2"
            strokeDasharray="920"
            initial={{ strokeDashoffset: 920 }}
            whileInView={{ strokeDashoffset: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          {/* Flowing dashed segments between nodes */}
          {[
            { x1: 40, x2: 340 },
            { x1: 340, x2: 660 },
            { x1: 660, x2: 960 },
          ].map((seg, i) => (
            <line
              key={i}
              x1={seg.x1} y1={30} x2={seg.x2} y2={30}
              stroke="#a78bfa" strokeWidth="1" opacity="0.35"
              className="flow-dash"
            />
          ))}
          {[40, 340, 660, 960].map((x, i) => (
            <motion.circle
              key={i}
              cx={x} cy={30} r={i === 0 ? 9 : 7}
              fill={i === 0 ? "#a78bfa" : "#0d0d0d"}
              stroke="#a78bfa" strokeWidth="2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.25, duration: 0.4, ease: "backOut" }}
            />
          ))}
        </svg>
        <div className="mt-2 grid grid-cols-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-violet-glow">today</span>
          <span>day 30</span>
          <span>day 60</span>
          <span>day 90</span>
        </div>

        {realRoadmap.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {realRoadmap.map((p: any) => (
              <div key={p.phase} className="border-l-[2px] border-violet bg-[#0a0a0a] p-5">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-violet-glow">
                  {p.phase}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.goals && p.goals.map((g: string) => (
                    <li key={g} className="flex gap-2">
                      <span className="text-violet-glow">›</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skill ROI */}
      <section>
        <SectionLabel kicker="01" title="Skills ranked by ROI" />
        <div className="mt-6 space-y-2">
          {skillROI.map((s) => (
            <div key={s.rank} className="flex items-center gap-6 border-l-[2px] border-[#1a1a1a] bg-[#0a0a0a] p-5 transition hover:border-violet hover:bg-[#0f0f0f]">
              <div className="select-none font-mono text-5xl font-black tabular-nums text-violet-glow/15">
                {String(s.rank).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{s.skill}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">{s.why}</div>
              </div>
              <span
                className={`shrink-0 border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
                  s.roi === "High"
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-warning/40 bg-warning/10 text-warning"
                }`}
                style={{ borderRadius: 4 }}
              >
                {s.roi} roi
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly tasks */}
      <section>
        <div className="flex items-end justify-between">
          <SectionLabel kicker="02" title="Weekly tasks" />
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-violet-glow tabular-nums"><CountUp to={completed} /></span> / {allTasks.length} done
          </div>
        </div>
        <div className="mt-4 h-[2px] overflow-hidden bg-[#1a1a1a]">
          <motion.div
            className="h-full bg-violet"
            animate={{ width: `${(completed / allTasks.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="mt-6 space-y-2">
          {weeklyTasks.map((w) => {
            const open = openWeek === w.week;
            return (
              <div key={w.week} className="overflow-hidden border border-[#1a1a1a] bg-[#0a0a0a]">
                <button
                  onClick={() => setOpenWeek(open ? null : w.week)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#0f0f0f]"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em]">{w.week}</span>
                  <span className="text-violet-glow">{open ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid gap-6 border-t border-[#1a1a1a] p-5 md:grid-cols-3">
                        {[
                          { label: "build", items: w.build, color: "violet-glow" },
                          { label: "read", items: w.read, color: "cyan" },
                          { label: "fix", items: w.fix, color: "warning" },
                        ].map((col) => (
                          <div key={col.label}>
                            <div className={`font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-${col.color}`}>
                              / {col.label}
                            </div>
                            <ul className="mt-3 space-y-2 text-sm">
                              {col.items.map((t) => {
                                const id = `${w.week}|${t}`;
                                const isDone = done.includes(id);
                                return (
                                  <li key={t}>
                                    <ClickSpark sparkColor="#10b981">
                                      <label className="flex cursor-pointer items-start gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isDone}
                                          onChange={() => {
                                            const next = !isDone;
                                            setDone((p) => (next ? [...p, id] : p.filter((x) => x !== id)));
                                            if (next) toast.success("task complete", { description: t });
                                          }}
                                          className="mt-0.5 h-4 w-4 accent-[var(--violet)]"
                                        />
                                        <span
                                          className={`relative ${isDone ? "text-success" : ""}`}
                                          style={
                                            isDone
                                              ? { backgroundImage: "linear-gradient(currentColor, currentColor)", backgroundSize: "100% 1px", backgroundPosition: "0 60%", backgroundRepeat: "no-repeat" }
                                              : undefined
                                          }
                                        >
                                          {t}
                                        </span>
                                      </label>
                                    </ClickSpark>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resources */}
      <section>
        <SectionLabel kicker="03" title="Recommended resources" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { name: "Designing Data-Intensive Applications", note: "Kleppmann" },
            { name: "Kent C. Dodds — Testing Trophy", note: "blog post" },
            { name: "OWASP Top 10 (2021)", note: "owasp.org" },
            { name: "Google SRE Book", note: "free online" },
            { name: "OpenTelemetry getting started", note: "opentelemetry.io" },
            { name: "Vitest docs", note: "vitest.dev" },
          ].map((r) => (
            <a
              key={r.name}
              href="#"
              target="_blank"
              rel="noreferrer"
              className="block border-l-[2px] border-[#1a1a1a] bg-[#0a0a0a] p-4 transition hover:border-violet hover:bg-[#0f0f0f]"
            >
              <div className="text-sm font-medium">{r.name}</div>
              <div className="mt-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <span>{r.note}</span>
                <span className="text-violet-glow">↗</span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <ClickSpark sparkCount={12}>
            <button className="border border-violet px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-violet-glow transition hover:bg-violet hover:text-white hover:shadow-[0_0_30px_#7c3aed60]">
              ↓ export roadmap
            </button>
          </ClickSpark>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">/ {kicker}</div>
      <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — CodeAudit" },
      { name: "description", content: "Your 30/60/90 plan, ranked by skill ROI, with weekly tasks." },
    ],
  }),
  component: RoadmapPage,
});
