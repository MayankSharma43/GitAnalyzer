import { useState } from "react";
import { motion } from "framer-motion";
import ClickSpark from "@/components/animations/ClickSpark";

const codeFragments = [
  { text: 'git commit -m "fix(auth): patch CVE-2024-1337"', top: "12%", left: "8%", duration: 22 },
  { text: "const token = jwt.sign(payload, process.env.SECRET)", top: "28%", left: "20%", duration: 18 },
  { text: "SELECT * FROM users WHERE id = $1", top: "55%", left: "10%", duration: 20 },
  { text: "npm run build:prod", top: "72%", left: "30%", duration: 16 },
  { text: "export default async function handler(req, res)", top: "40%", left: "5%", duration: 24 },
  { text: "if (!user.role) throw new UnauthorizedError()", top: "85%", left: "15%", duration: 19 },
];

export default function Hero() {
  const [unrotate, setUnrotate] = useState(false);

  const scrollToBreakdown = () => {
    document.getElementById("audit-breakdown")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative grid min-h-[calc(100vh-52px)] grid-cols-1 lg:grid-cols-[55fr_45fr]">
      {/* LEFT */}
      <div className="relative flex flex-col justify-end px-6 pb-16 md:px-12 md:pb-24">
        {/* Tiny labels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 font-mono text-[11px] leading-relaxed text-[#555]"
        >
          <div>// FOR AUTHENTICATION OF SKILL LEVEL</div>
          <div>// SUMMER COLLECTION AND PROTECTION</div>
          <div>// KEEP UNGIVEN</div>
        </motion.div>

        {/* audit. */}
        <motion.h1
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-black text-[#f0f0f0]"
          style={{
            fontSize: "clamp(7rem, 18vw, 16rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.04em",
          }}
        >
          audit.
        </motion.h1>

        {/* git counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex items-end gap-6"
        >
          <div className="font-mono text-[10px] leading-tight text-violet-glow">
            <div>main</div>
            <div>──┤</div>
          </div>
          <div
            onMouseEnter={() => setUnrotate(true)}
            onMouseLeave={() => setUnrotate(false)}
            className="relative cursor-pointer"
          >
            <motion.div
              animate={{ rotate: unrotate ? 0 : 90 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="font-black text-[#f0f0f0]"
              style={{
                fontSize: "clamp(3rem, 8vw, 7rem)",
                lineHeight: 1,
                opacity: 0.9,
                transformOrigin: "center",
              }}
            >
              47
            </motion.div>
            {unrotate && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] text-violet-glow">
                47 repos analyzed
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* RIGHT */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#111] to-[#1a0a2e]">
        {/* Grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff14 1px, transparent 1px), linear-gradient(to bottom, #ffffff14 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.5,
          }}
        />

        {/* Floating code fragments */}
        {codeFragments.map((frag, i) => (
          <div
            key={i}
            className="absolute whitespace-nowrap font-mono text-[12px]"
            style={{
              top: frag.top,
              left: frag.left,
              color: "#a78bfa",
              opacity: 0.4,
              animation: `code-drift ${frag.duration}s linear infinite`,
            }}
          >
            {frag.text}
          </div>
        ))}

        {/* Top-right label */}
        <div className="absolute right-6 top-6 text-right font-sans text-[11px] font-bold uppercase leading-[1.8] tracking-[0.08em] text-[#f0f0f0]">
          <div>CODE</div>
          <div>AUDIT</div>
          <div>INTELLIGENCE</div>
          <div>SYSTEM 2025</div>
        </div>

        {/* Arrow button */}
        <ClickSpark sparkColor="#a78bfa" sparkCount={10} sparkRadius={24}>
          <button
            onClick={scrollToBreakdown}
            className="group absolute bottom-8 right-8 flex h-[52px] w-[52px] items-center justify-center border border-[#2a2a2a] bg-[#1a1a1a] text-[18px] text-white hover:bg-violet"
            style={{ transition: "none" }}
            aria-label="Scroll to audit breakdown"
          >
            <span className="group-hover:hidden">→</span>
            <span className="hidden group-hover:inline">↗</span>
          </button>
        </ClickSpark>
      </div>

      {/* Cutting horizontal line */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-[#1f1f1f]"
        style={{ top: "60%" }}
      />

      <style>{`
        @keyframes code-drift {
          0% { transform: translateY(20px); opacity: 0; }
          15% { opacity: 0.4; }
          85% { opacity: 0.4; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
