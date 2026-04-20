export default function Footer() {
  return (
    <footer className="flex h-[52px] flex-col items-center justify-between gap-2 border-t border-[#1a1a1a] bg-[#0a0a0a] px-6 py-3 font-mono text-[10px] text-[#333] md:flex-row md:py-0">
      <div>© 2025 CODEAUDIT</div>
      <div className="italic">built for developers who want the truth</div>
      <div className="flex items-center gap-4">
        {["GITHUB", "TWITTER", "DOCS"].map((l, i, arr) => (
          <span key={l} className="flex items-center gap-4">
            <a
              href="#"
              className="text-[#333] hover:text-violet-glow"
              style={{ transition: "none" }}
            >
              {l} ↗
            </a>
            {i < arr.length - 1 && <span className="text-[#222]">·</span>}
          </span>
        ))}
      </div>
    </footer>
  );
}
