import { useEffect, useRef, useState } from "react";

/**
 * CustomCursor — desktop only. Outer lerped ring + inner exact dot.
 * Hovering interactive elements expands the ring; clicking compresses both.
 */
export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let hovering = false;
    let pressing = false;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx - 1.5}px, ${my - 1.5}px, 0)`;
    };

    const isInteractive = (el: Element | null) => {
      if (!el) return false;
      return !!el.closest(
        "a, button, [role='button'], input, textarea, select, label, summary, [data-cursor='hover']",
      );
    };

    const over = (e: MouseEvent) => {
      hovering = isInteractive(e.target as Element);
      ring.dataset.hover = hovering ? "1" : "0";
    };

    const down = () => {
      pressing = true;
      ring.dataset.press = "1";
      dot.dataset.press = "1";
    };
    const up = () => {
      pressing = false;
      ring.dataset.press = "0";
      dot.dataset.press = "0";
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      const size = hovering ? 36 : 12;
      const scale = pressing ? 0.7 : 1;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.transform = `translate3d(${rx - size / 2}px, ${ry - size / 2}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", down, { passive: true });
    window.addEventListener("mouseup", up, { passive: true });
    raf = requestAnimationFrame(loop);

    document.documentElement.classList.add("custom-cursor");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border transition-[width,height,background-color,border-color] duration-150 ease-out"
        style={{
          width: 12,
          height: 12,
          borderColor: "#a78bfa",
          background: "transparent",
          mixBlendMode: "screen",
        }}
        data-hover="0"
        data-press="0"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-[3px] rounded-full"
        style={{ background: "#a78bfa" }}
        data-press="0"
      />
    </>
  );
}
