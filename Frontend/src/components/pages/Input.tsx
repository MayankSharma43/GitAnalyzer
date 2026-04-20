import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import ClickSpark from "@/components/animations/ClickSpark";
import { api } from "@/lib/api";

type Level = "Junior" | "Mid-level" | "Senior" | "Staff";

const levels: { id: Level; tag: string }[] = [
  { id: "Junior", tag: "0–2y" },
  { id: "Mid-level", tag: "3–5y" },
  { id: "Senior", tag: "5–8y" },
  { id: "Staff", tag: "8y+" },
];

function isValidUrl(s: string) {
  try {
    new URL(s.startsWith("http") ? s : `https://${s}`);
    return s.includes(".");
  } catch {
    return false;
  }
}

const GitHubIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.55 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.5 3.18-1.18 3.18-1.18.63 1.58.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.55A11.52 11.52 0 0 0 23.5 12.02C23.5 5.66 18.35.5 12 .5z" />
  </svg>
);

export default function Input() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [github, setGithub] = useState("");
  const [chipInput, setChipInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const githubValid = github.includes("github.com/") && github.length > 18;

  const handleChipKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && chipInput.trim()) {
      e.preventDefault();
      setUrls((u) => [...u, chipInput.trim()]);
      setChipInput("");
    }
  };

  const removeChip = (i: number) => setUrls((u) => u.filter((_, idx) => idx !== i));

  const canNext0 = githubValid;
  const canNext1 = !!level && (remote || location.length > 1);

  // Detect if any of the additional URLs looks like a live web app (not a GitHub repo)
  const liveAppUrl = urls.find((u) => !u.includes("github.com") && isValidUrl(u));

  const launch = async () => {
    setLaunching(true);
    setError(null);

    try {
      const fullGithub = github.startsWith("http") ? github : `https://${github}`;
      const githubUrls = urls.filter((u) => u.includes("github.com"));

      const response = await api.createAudit({
        github_url: fullGithub,
        additional_urls: githubUrls,
        live_app_url: liveAppUrl,
        claimed_level: level ?? undefined,
        location: remote ? undefined : location,
        remote,
      });

      // Store audit_id in sessionStorage for Auditing.tsx to pick up
      sessionStorage.setItem("audit_id", response.audit_id);
      sessionStorage.setItem("audit_github", github);

      setTimeout(() => navigate({ to: "/auditing" }), 320);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start audit.";
      setError(message);
      setLaunching(false);
    }
  };

  return (
    <div className="relative min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex items-center gap-4">
          <button
            onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep((s) => s - 1))}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-violet-glow"
          >
            ← back
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            step {String(step + 1).padStart(2, "0")} / 03
          </span>
          <div className="ml-auto h-px flex-1 max-w-[200px] overflow-hidden bg-[#1a1a1a]">
            <motion.div
              className="h-full bg-violet"
              initial={false}
              animate={{ width: `${((step + 1) / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
                01 / source
              </div>
              <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Show us your work.
              </h1>
              <p className="mt-4 max-w-xl font-mono text-sm text-muted-foreground">
                // every public repo. every commit. every line.
              </p>

              <div className="mt-12 space-y-10">
                <div>
                  <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    github profile
                  </label>
                  <div className="term-input-wrap flex items-center gap-3 pb-1">
                    <GitHubIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="github.com/your-handle"
                      className="term-input h-16 w-full text-xl font-medium text-foreground placeholder:text-muted-foreground/40"
                    />
                    {github && (
                      <span
                        className={`shrink-0 font-mono text-sm ${githubValid ? "text-success" : "text-danger"}`}
                      >
                        {githubValid ? "[ ok ]" : "[ × ]"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    additional targets <span className="text-muted-foreground/60">(repos, deployed apps)</span>
                  </label>
                  <div className="term-input-wrap pb-1">
                    <input
                      value={chipInput}
                      onChange={(e) => setChipInput(e.target.value)}
                      onKeyDown={handleChipKey}
                      placeholder="press enter to add"
                      className="term-input h-12 w-full text-base text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                  {urls.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {urls.map((u, i) => {
                        const ok = isValidUrl(u);
                        return (
                          <span
                            key={i}
                            className="group inline-flex items-center gap-2 border-l-2 border-violet bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs"
                            style={{ borderRadius: 4 }}
                          >
                            <span className={ok ? "text-success" : "text-danger"}>{ok ? "✓" : "×"}</span>
                            <span>{u}</span>
                            <button
                              onClick={() => removeChip(i)}
                              className="ml-1 opacity-0 transition group-hover:opacity-100 hover:text-danger"
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
                02 / benchmark
              </div>
              <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Set your benchmark.
              </h1>
              <p className="mt-4 max-w-xl font-mono text-sm text-muted-foreground">
                // we'll compare your actual code against what's expected at this level.
              </p>

              <div className="mt-12 flex flex-wrap gap-3">
                {levels.map((l) => {
                  const active = level === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={`relative flex h-44 w-20 shrink-0 flex-col items-center justify-between overflow-hidden border p-3 transition-all duration-300 md:h-48 md:w-24 ${
                        active
                          ? "border-violet bg-[#12091f]"
                          : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a]"
                      }`}
                      style={{ borderRadius: 4 }}
                    >
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                        {l.tag}
                      </span>
                      <motion.span
                        animate={
                          active
                            ? { rotate: 0, scale: 1, color: "#ffffff" }
                            : { rotate: -90, scale: 0.85, color: "#444" }
                        }
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="text-xl font-black tracking-tight whitespace-nowrap"
                      >
                        {l.id}
                      </motion.span>
                      <span
                        className={`h-1 w-1 rounded-full transition ${active ? "bg-violet" : "bg-[#222]"}`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    location
                  </label>
                  <div className="term-input-wrap pb-1">
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={remote}
                      placeholder="e.g. berlin, germany"
                      className="term-input h-12 w-full text-base text-foreground placeholder:text-muted-foreground/40 disabled:opacity-30"
                    />
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={remote}
                    onChange={(e) => setRemote(e.target.checked)}
                    className="accent-[var(--violet)]"
                  />
                  remote anywhere
                </label>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
                03 / confirm
              </div>
              <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Your audit is ready.
              </h1>
              <p className="mt-4 max-w-xl font-mono text-sm text-muted-foreground">
                // last chance to back out. we don't soften the findings.
              </p>

              <div className="mt-10 border border-[#1a1a1a] bg-[#0a0a0a] p-6 font-mono text-sm" style={{ borderRadius: 4 }}>
                <TermLine label="github" value={github || "—"} />
                <TermLine label="repos" value={`${urls.length} target${urls.length === 1 ? "" : "s"} queued`} />
                <TermLine label="level" value={`${level ?? "—"} (claimed)`} />
                <TermLine label="location" value={remote ? "remote anywhere" : location || "—"} />
                {liveAppUrl && <TermLine label="live app" value={liveAppUrl} />}
              </div>

              {error && (
                <div className="mt-6 border border-danger/40 bg-danger/5 p-4 font-mono text-xs text-danger">
                  ⚠ {error}
                </div>
              )}

              <div className="mt-12">
                <ClickSpark sparkCount={14} sparkRadius={32}>
                  <button
                    onClick={launch}
                    disabled={launching}
                    className="btn-initiate group relative flex h-[72px] w-full items-center justify-center overflow-hidden rounded-md text-base font-bold uppercase text-white shadow-violet transition disabled:opacity-80"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    {launching ? (
                      <span className="flex items-center gap-3">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        launching...
                      </span>
                    ) : (
                      <span>initiate audit →</span>
                    )}
                  </button>
                </ClickSpark>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 2 && (
          <div className="mt-14 flex justify-end">
            <ClickSpark>
              <button
                disabled={(step === 0 && !canNext0) || (step === 1 && !canNext1)}
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                className="font-mono text-xs uppercase tracking-[0.2em] text-violet-glow transition hover:text-white disabled:cursor-not-allowed disabled:text-muted-foreground/30"
              >
                next →
              </button>
            </ClickSpark>
          </div>
        )}
      </div>
    </div>
  );
}

function TermLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-violet-glow/60">{">"}</span>
      <span className="w-24 text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
