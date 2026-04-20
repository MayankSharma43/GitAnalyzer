import { useRef, useEffect, useState, type CSSProperties, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  tag?: ElementType;
  onLetterAnimationComplete?: () => void;
};

/**
 * Lightweight SplitText (no premium GSAP plugin needed).
 * Splits text into spans per char/word and runs a stagger animation.
 */
const SplitText = ({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag: Tag = "p",
  onLetterAnimationComplete,
}: Props) => {
  const ref = useRef<HTMLElement | null>(null);
  const completed = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.fonts?.status === "loaded") setFontsLoaded(true);
    else document.fonts?.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !fontsLoaded || completed.current) return;

      const units =
        splitType === "words"
          ? text.split(/(\s+)/)
          : splitType === "lines"
            ? text.split(/\n/)
            : text.split("");

      el.innerHTML = units
        .map((u) => {
          if (/^\s+$/.test(u)) return u;
          return `<span class="split-unit" style="display:inline-block;will-change:transform,opacity">${
            u === " " ? "&nbsp;" : u.replace(/</g, "&lt;")
          }</span>`;
        })
        .join("");

      const targets = el.querySelectorAll<HTMLElement>(".split-unit");
      const startPct = (1 - threshold) * 100;
      const start = `top ${startPct}%`;

      gsap.fromTo(targets, { ...from }, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: { trigger: el, start, once: true },
        onComplete: () => {
          completed.current = true;
          onLetterAnimationComplete?.();
        },
      });
    },
    { dependencies: [text, fontsLoaded], scope: ref as React.RefObject<HTMLElement> },
  );

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ textAlign, display: "inline-block", whiteSpace: "normal", wordWrap: "break-word" }}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
