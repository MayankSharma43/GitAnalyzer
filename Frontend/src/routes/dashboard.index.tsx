import { createFileRoute, useOutletContext } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";
import CountUp from "@/components/animations/CountUp";
import ClickSpark from "@/components/animations/ClickSpark";
import { Link } from "@tanstack/react-router";
import type { DashboardContext } from "./dashboard";

function DashboardIndex() {
  const { report } = useOutletContext<DashboardContext>();

  if (!report) return null;

  // Derive top-level metrics from real report
  const claimedLevel = sessionStorage.getItem("claimed_level") || "Unknown";
  const actualLevel = report.skill_level;
  const mismatchNote = 
    claimedLevel.toLowerCase() === actualLevel.toLowerCase() 
      ? "Accurate self-assessment. Your skills match your claimed level." 
      : `You claimed ${claimedLevel}, but our analysis strongly points to ${actualLevel}.`;

  const username = sessionStorage.getItem("github_username") || "Developer";

  return (
    <div className="space-y-16">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          /dashboard / overview
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
          Hey {username}, here's the truth.
        </h1>
        <p className="mt-3 max-w-2xl font-mono text-xs text-muted-foreground">
          // analyzed {report.repos_analysed} repos · verified against {report.languages.length} languages
        </p>
      </header>

      {/* Composite score — enormous raw number */}
      <section className="relative flex items-end gap-6 md:gap-10 py-6">
        <div className="flex items-end leading-[0.85]">
          <span
            className="font-black tabular-nums text-foreground"
            style={{ fontSize: "clamp(6rem, 18vw, 14rem)", letterSpacing: "-0.06em" }}
          >
            <CountUp to={Math.round(report.overall_score)} duration={1.8} />
          </span>
          <span className="ml-3 mb-3 font-mono text-base text-muted-foreground md:text-lg">/ 100</span>
        </div>
        <div
          className="hidden self-stretch md:flex items-end pb-4"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/60">
            composite score
          </span>
        </div>

        <div className="ml-auto hidden md:flex flex-col items-end gap-1 pb-3 text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            percentile
          </div>
          <div className="font-mono text-3xl font-bold text-cyan">
            top <CountUp to={100 - report.percentile} />%
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniMetric label="Repos analyzed" value={report.repos_analysed} accent="violet-glow" />
        <MiniMetric label="Issues found" value={report.critical_issues.length} accent="danger" />
        <MiniMetric label="Critical fixes" value={report.critical_issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length} accent="danger" />
        <MiniMetric label="Quick wins" value={report.recommendations.length} accent="success" />
      </section>

      {/* Diagonal claimed/actual banner */}
      <section className="relative grid h-[180px] grid-cols-2 overflow-hidden rounded-md md:h-[200px]">
        <div className="slash-left flex flex-col justify-center bg-[#0d0d0d] px-6 md:px-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            you claimed
          </div>
          <div className="mt-2 text-4xl font-black md:text-5xl">{claimedLevel}</div>
        </div>
        <div className="slash-right flex flex-col justify-center bg-[#12091f] px-6 text-right md:px-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-warning/80">
            we found
          </div>
          <div className="mt-2 text-4xl font-black text-warning md:text-5xl">{actualLevel}</div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 text-center font-mono text-[10px] text-muted-foreground md:bottom-4 md:text-xs">
          {mismatchNote}
        </div>
      </section>

      {/* Skill radar */}
      <section>
        <SectionHeading kicker="01" title="Skill: claimed vs reality" />
        <div className="mt-8 h-[420px] rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-4 md:p-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={report.radar_data || []} outerRadius="70%">
              <PolarGrid stroke="#1a1a1a" />
              <PolarAngleAxis dataKey="axis" stroke="#888" tick={{ fontSize: 11, fill: "#888", fontFamily: "Space Grotesk" }} />
              <PolarRadiusAxis stroke="#1a1a1a" tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Claimed" dataKey="claimed" stroke="#a78bfa" strokeDasharray="3 3" fill="#a78bfa" fillOpacity={0.04} />
              <Radar name="Actual" dataKey="actual" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.30} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: "0.1em" }} />
              <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 4, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top critical findings */}
      <section>
        <SectionHeading kicker="02" title="Your biggest problems" />
        <div className="mt-8 space-y-3">
          {report.critical_issues.slice(0, 3).map((f, i) => {
            const accent = f.severity === "CRITICAL" ? "border-l-danger" : "border-l-warning";
            const accentText = f.severity === "CRITICAL" ? "text-danger" : "text-warning";
            return (
              <div
                key={i}
                className={`group relative flex items-start gap-5 border-l-[3px] bg-[#0d0d0d] p-5 transition hover:bg-[#0f0f0f] ${accent}`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${accentText}`}>
                    {f.severity}
                  </div>
                  <h3 className="mt-2 text-base font-semibold md:text-lg">{f.title}</h3>
                  <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
                <ClickSpark>
                  <Link
                    to="/dashboard/code"
                    className="hidden shrink-0 self-center font-mono text-[10px] uppercase tracking-[0.2em] text-violet-glow transition hover:text-white md:block"
                  >
                    view →
                  </Link>
                </ClickSpark>
              </div>
            );
          })}
        </div>
      </section>

      {/* Salary bar */}
      <section className="rounded-md border border-[#1a1a1a] bg-[#0d0d0d] p-6 md:p-8">
        <SectionHeading kicker="03" title="Where you sit on salary" small />
        <div className="mt-8">
          <div className="relative h-4 overflow-hidden rounded-full bg-[#111]">
            <div className="absolute inset-y-0 left-[18%] w-[20%] rounded-full bg-violet" />
            <div className="absolute inset-y-0 left-[40%] w-[24%] rounded-full border border-dashed border-warning" />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>$40k</span><span>$80k</span><span>$120k</span><span>$160k</span><span>$200k+</span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                current bracket
              </div>
              <div className="mt-2 text-3xl font-black tabular-nums">
                $<CountUp to={60} />k – $<CountUp to={80} />k
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-warning/80">
                reach with 4 skills
              </div>
              <div className="mt-2 text-3xl font-black tabular-nums text-warning">
                $<CountUp to={80} />k – $<CountUp to={110} />k
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value, accent }: { label: string; value: number; accent: string }) {
  const colorMap: Record<string, string> = {
    "violet-glow": "text-violet-glow",
    danger: "text-danger",
    success: "text-success",
    cyan: "text-cyan",
  };
  return (
    <div className="border-l-2 border-[#1a1a1a] pl-4 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-black tabular-nums ${colorMap[accent] ?? ""}`}>
        <CountUp to={value} duration={1.4} />
      </div>
    </div>
  );
}

function SectionHeading({ kicker, title, small = false }: { kicker: string; title: string; small?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
        / {kicker}
      </div>
      <h2 className={`mt-2 font-black tracking-tight ${small ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"}`}>
        {title}
      </h2>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — CodeAudit Dashboard" },
      { name: "description", content: "Composite score, percentile, and your biggest problems." },
    ],
  }),
  component: DashboardIndex,
});
