import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { api, type ProgressEvent } from "@/lib/api";

// Fallback animation lines when backend isn't connected
const FALLBACK_LINES = [
  { text: "Fetching GitHub profile...", section: "CODE" },
  { text: "Scanning repositories...", section: "CODE" },
  { text: "Analyzing code quality...", section: "CODE" },
  { text: "Checking test coverage...", section: "CODE" },
  { text: "Auditing UI/UX patterns...", section: "UIUX" },
  { text: "Running security audit...", section: "SECURITY" },
  { text: "Cross-referencing job market...", section: "JOBS" },
  { text: "Building 90-day roadmap...", section: "ROADMAP" },
  { text: "Rewriting resume bullets...", section: "RESUME" },
  { text: "Compiling your brutal truth...", section: "RESUME" },
];

const SECTIONS = ["CODE", "UIUX", "SECURITY", "JOBS", "ROADMAP", "RESUME"] as const;

interface LogLine {
  text: string;
  section: string;
  done: boolean;
}

export default function Auditing() {
  const navigate = useNavigate();
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [percent, setPercent] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [flickerIdx, setFlickerIdx] = useState<number | null>(null);
  const [isFailed, setIsFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Seconds counter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Random flicker ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      if (logLines.length > 0) {
        const i = Math.floor(Math.random() * logLines.length);
        setFlickerIdx(i);
        setTimeout(() => setFlickerIdx(null), 400);
      }
    }, 3500);
    return () => clearInterval(t);
  }, [logLines.length]);

  // ── Fallback animation (no backend / no audit_id) ──────────────────────────
  const startFallback = () => {
    setUseFallback(true);
    let idx = 0;
    const tick = () => {
      if (idx >= FALLBACK_LINES.length) {
        setTimeout(() => navigate({ to: "/dashboard" }), 1100);
        return;
      }
      const line = FALLBACK_LINES[idx];
      setLogLines((prev) => [
        ...prev.map((l) => ({ ...l, done: true })),
        { text: line.text, section: line.section, done: false },
      ]);
      setPercent(Math.round(((idx + 1) / FALLBACK_LINES.length) * 100));
      setCompletedSections((prev) => new Set([...prev, line.section]));
      idx++;
      fallbackIntervalRef.current = setTimeout(tick, 850);
    };
    tick();
  };

  // ── WebSocket connection ────────────────────────────────────────────────────
  useEffect(() => {
    const auditId = sessionStorage.getItem("audit_id");

    if (!auditId) {
      // No backend — run the pretty fallback animation
      startFallback();
      return;
    }

    let ws: WebSocket;
    try {
      ws = api.connectProgress(auditId);
      wsRef.current = ws;
    } catch {
      startFallback();
      return;
    }

    const connectTimeout = setTimeout(() => {
      // If WS hasn't opened in 5s, fall back
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        startFallback();
      }
    }, 5000);

    ws.onopen = () => {
      clearTimeout(connectTimeout);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as ProgressEvent;

        // Ignore ping frames
        if (data.type === "ping") return;

        setLogLines((prev) => [
          ...prev.map((l) => ({ ...l, done: true })),
          { text: data.message, section: data.section, done: false },
        ]);
        setPercent(data.percent);
        setCompletedSections((prev) => new Set([...prev, data.section]));

        if (data.status === "completed") {
          setTimeout(() => {
            sessionStorage.setItem("audit_status", "completed");
            navigate({ to: "/dashboard" });
          }, 1100);
        }

        if (data.status === "failed") {
          setIsFailed(true);
        }
      } catch {
        // Non-JSON frame — ignore
      }
    };

    ws.onerror = () => {
      clearTimeout(connectTimeout);
      // Fall back to polling if WS fails entirely
      startPolling(auditId);
    };

    ws.onclose = () => {
      clearTimeout(connectTimeout);
    };

    return () => {
      clearTimeout(connectTimeout);
      ws?.close();
      if (fallbackIntervalRef.current) clearTimeout(fallbackIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling fallback (if WebSocket unavailable) ────────────────────────────
  const startPolling = (auditId: string) => {
    const POLL_INTERVAL = 3000;
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 3min timeout

    const poll = async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        setIsFailed(true);
        return;
      }
      try {
        const status = await api.getAuditStatus(auditId);

        const statusMessages: Record<string, string> = {
          pending: "Waiting in queue...",
          running: "Analysis in progress...",
          completed: "Analysis complete — routing to dashboard...",
          failed: status.error_message ?? "Analysis failed.",
        };

        const msg = statusMessages[status.status] ?? "Processing...";
        setLogLines((prev) => {
          const last = prev[prev.length - 1];
          if (last?.text === msg) return prev;
          return [...prev.map((l) => ({ ...l, done: true })), { text: msg, section: "CODE", done: false }];
        });
        setPercent(status.status === "completed" ? 100 : Math.min(90, attempts * 3));

        if (status.status === "completed") {
          sessionStorage.setItem("audit_status", "completed");
          setTimeout(() => navigate({ to: "/dashboard" }), 1100);
          return;
        }
        if (status.status === "failed") {
          setIsFailed(true);
          return;
        }
        setTimeout(poll, POLL_INTERVAL);
      } catch {
        setTimeout(poll, POLL_INTERVAL);
      }
    };

    // Kick off with fallback lines first
    setUseFallback(true);
    poll();
  };

  const activeLineIdx = logLines.findLastIndex((l) => !l.done);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Top progress bar */}
      <div className="fixed left-0 right-0 top-0 z-20 h-[2px]">
        <motion.div
          className="h-full bg-violet"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Decorative giant seconds counter */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-10 z-0 text-center font-mono font-black leading-none text-white/[0.05] select-none"
        style={{ fontSize: "8rem" }}
      >
        {String(seconds).padStart(3, "0")}
      </div>

      {/* Left vertical section list */}
      <div className="fixed left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 md:flex">
        {SECTIONS.map((s) => {
          const done = completedSections.has(s);
          return (
            <div key={s} className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em]">
              <div className="relative h-px w-10 bg-[#1a1a1a] overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-violet"
                  initial={{ width: 0 }}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className={done ? "text-violet-glow" : "text-muted-foreground/40"}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* Center terminal log */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20 md:px-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-glow/70">
          // analyzing — {seconds}s elapsed
          {useFallback && " — demo mode"}
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
          {isFailed ? "Analysis encountered an error." : "Compiling your brutal truth."}
        </h1>

        <div className="mt-10 space-y-1 font-mono text-[15px] leading-[2]">
          {logLines.map((l, i) => {
            const isActive = i === activeLineIdx && !isFailed;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`relative flex items-center gap-3 px-3 ${isActive ? "bg-violet/[0.03]" : ""} ${flickerIdx === i ? "opacity-60" : ""}`}
              >
                {l.done && <span className="text-success">[✓]</span>}
                {isActive && <span className="text-violet-glow blink-caret">[...]</span>}
                {isFailed && !l.done && <span className="text-danger">[✗]</span>}
                <span className={l.done ? "text-muted-foreground" : "text-foreground"}>{l.text}</span>
              </motion.div>
            );
          })}
        </div>

        {isFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex items-center gap-4 font-mono text-xs"
          >
            <span className="text-danger">// pipeline failed.</span>
            <button
              onClick={() => navigate({ to: "/input" })}
              className="text-violet-glow transition hover:text-white underline"
            >
              try again →
            </button>
          </motion.div>
        )}

        {percent >= 100 && !isFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 font-mono text-xs text-violet-glow"
          >
            // done. routing to dashboard...
          </motion.div>
        )}
      </div>
    </div>
  );
}
