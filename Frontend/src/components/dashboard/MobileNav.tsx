import { Link, useLocation } from "@tanstack/react-router";

type Item = { to: string; label: string; exact?: boolean; icon: string };
const items: Item[] = [
  { to: "/dashboard", label: "Home", exact: true, icon: "◇" },
  { to: "/dashboard/code", label: "Code", icon: "</>" },
  { to: "/dashboard/uiux", label: "UI", icon: "▢" },
  { to: "/dashboard/security", label: "Sec", icon: "⚷" },
  { to: "/dashboard/jobs", label: "Jobs", icon: "$" },
  { to: "/dashboard/roadmap", label: "Plan", icon: "→" },
  { to: "/dashboard/resume", label: "CV", icon: "≡" },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch justify-around border-t border-[#1a1a1a] bg-[#080808]/80 px-2 py-2 lg:hidden"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to as "/dashboard"}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition ${
              active ? "text-violet-glow" : "text-muted-foreground/60"
            }`}
          >
            <span className="font-mono text-base">{item.icon}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
