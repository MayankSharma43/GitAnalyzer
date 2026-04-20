import { useEffect, useRef } from "react";

/**
 * LiveBackground — fixed full-viewport canvas with three layers:
 *  1. Slowly drifting violet dot grid
 *  2. 6–8 large blurred drifting blobs (violet + cyan, very low opacity)
 *  3. Static 1px scanlines at 0.03 opacity
 */
export default function LiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Blob = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      alpha: number;
    };
    const blobColors = ["#7c3aed", "#06b6d4"];
    const blobs: Blob[] = [];

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const seedBlobs = () => {
      blobs.length = 0;
      const count = 7;
      for (let i = 0; i < count; i++) {
        blobs.push({
          x: Math.random() * W(),
          y: Math.random() * H(),
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 200 + Math.random() * 150,
          color: blobColors[i % blobColors.length],
          alpha: 0.04 + Math.random() * 0.03,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W() * dpr;
      canvas.height = H() * dpr;
      canvas.style.width = `${W()}px`;
      canvas.style.height = `${H()}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    seedBlobs();
    window.addEventListener("resize", resize);

    let gridOffset = 0;
    const GRID = 40;

    const tick = () => {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      // Layer 2: blurred blobs (drawn first so grid sits over them slightly)
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r) b.vx = Math.abs(b.vx);
        if (b.x > w + b.r) b.vx = -Math.abs(b.vx);
        if (b.y < -b.r) b.vy = Math.abs(b.vy);
        if (b.y > h + b.r) b.vy = -Math.abs(b.vy);

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        const hex = b.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const bl = parseInt(hex.slice(5, 7), 16);
        grad.addColorStop(0, `rgba(${r},${g},${bl},${b.alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }

      // Layer 1: drifting dot grid
      gridOffset = (gridOffset + 0.3) % GRID;
      ctx.fillStyle = "rgba(124, 58, 237, 0.15)";
      const startX = -GRID + gridOffset;
      const startY = -GRID + gridOffset;
      for (let x = startX; x < w + GRID; x += GRID) {
        for (let y = startY; y < h + GRID; y += GRID) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Layer 3: static scanlines (cheap — draw thin horizontal bands)
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: "#070709" }}
    />
  );
}
