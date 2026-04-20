import { useNavigate } from "@tanstack/react-router";
import ClickSpark from "@/components/animations/ClickSpark";

export default function BrutalTruth() {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-1 gap-12 bg-[#050505] px-6 py-32 md:grid-cols-[3fr_2fr] md:gap-20 md:px-12">
      {/* Quote */}
      <div>
        <h2
          className="font-black text-[#f0f0f0]"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          "Your authentication
          <br />
          code would get you
          <br />
          rejected in 3 minutes
          <br />
          of code review."
        </h2>
        <div className="mt-8 font-mono text-[11px] text-[#555]">
          // CodeAudit analysis · ProjectX · github.com/dev/projectx · line 47
        </div>
      </div>

      {/* CTA block */}
      <div className="bg-violet p-12">
        <h3 className="text-[32px] font-black leading-tight text-white">
          Run your audit.
        </h3>
        <p className="mt-3 font-mono text-[13px] text-white/70">
          Free. Honest. Specific.
        </p>
        <ClickSpark sparkColor="#f0f0f0" sparkCount={12} sparkRadius={28}>
          <button
            onClick={() => navigate({ to: "/input" })}
            className="group mt-10 flex h-[52px] w-full items-center justify-center gap-2 bg-[#f0f0f0] text-[13px] font-bold uppercase tracking-[0.1em] text-[#0a0a0a] hover:border hover:border-[#f0f0f0] hover:bg-[#0a0a0a] hover:text-[#f0f0f0]"
            style={{ transition: "none" }}
          >
            AUDIT MY CODE →
          </button>
        </ClickSpark>
      </div>
    </section>
  );
}
