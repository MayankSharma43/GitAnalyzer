import { createFileRoute, useNavigate } from "@tanstack/react-router";
import FuzzyText from "@/components/animations/FuzzyText";
import ClickSpark from "@/components/animations/ClickSpark";

function ErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-danger/80">
        // fatal
      </div>
      <div className="mt-4">
        <FuzzyText fontSize="clamp(4rem, 18vw, 14rem)" baseIntensity={0.25} hoverIntensity={0.7} color="#ef4444">
          ERROR
        </FuzzyText>
      </div>
      <p className="mt-8 font-mono text-sm text-muted-foreground">
        // something went wrong during your audit.
      </p>
      <div className="mt-10">
        <ClickSpark sparkColor="#ef4444">
          <button
            onClick={() => navigate({ to: "/input" })}
            className="border border-danger/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-danger transition hover:bg-danger/10 hover:shadow-[0_0_30px_#ef444460]"
          >
            try again →
          </button>
        </ClickSpark>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/error")({
  head: () => ({ meta: [{ title: "Error — CodeAudit" }] }),
  component: ErrorPage,
});
