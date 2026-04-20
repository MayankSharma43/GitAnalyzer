import { Link, useLocation } from "@tanstack/react-router";
import ClickSpark from "@/components/animations/ClickSpark";

type Item = { to: string; label: string; exact?: boolean };
const items: Item[] = [
  { to: "/dashboard", label: "Overview", exact: true },
  { to: "/dashboard/code", label: "Code" },
  { to: "/dashboard/uiux", label: "UI/UX" },
  { to: "/dashboard/security", label: "Security" },
  { to: "/dashboard/jobs", label: "Jobs" },
  { to: "/dashboard/roadmap", label: "Roadmap" },
  { to: "/dashboard/resume", label: "Resume" },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-[#141414] bg-[#080808] lg:flex"
    >
      <Link to="/" className="block px-6 pt-7 pb-10">
        <div className="font-mono text-[11px] uppercase text-violet-glow/70" style={{ letterSpacing: "0.2em" }}>
          codeaudit
        </div>
      </Link>

      <nav className="flex flex-col">
        {items.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to as "/dashboard"}
              className={`group relative flex h-12 items-center pl-6 transition-colors duration-200 ${
                active
                  ? "bg-[#0f0f0f] text-white"
                  : "text-[#444] hover:bg-[#0a0a0a] hover:text-[#888]"
              }`}
              style={{ fontSize: 13, letterSpacing: "0.1em" }}
            >
              {active && <span key={item.to + "-bar"} className="nav-active-bar" />}
              <span className="uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-6 py-6">
        <ClickSpark>
          <button className="flex w-full items-center gap-2 py-2 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:text-violet-glow">
            <span className="text-violet-glow">↓</span> export pdf
          </button>
        </ClickSpark>
        <ClickSpark>
          <button className="flex w-full items-center gap-2 py-2 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:text-violet-glow">
            <span className="text-violet-glow">↗</span> share audit
          </button>
        </ClickSpark>
        <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className="status-pulse h-1 w-1 rounded-full bg-success" />
          alex.dev
        </div>
      </div>
    </aside>
  );
}
