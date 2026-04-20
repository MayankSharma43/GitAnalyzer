import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import LiveBackground from "@/components/LiveBackground";
import CustomCursor from "@/components/CustomCursor";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <LiveBackground />
      <div className="relative z-10 max-w-md text-center">
        <h1 className="font-mono text-7xl font-black text-violet-glow">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">// nothing here yet</h2>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-violet/40 px-6 py-2.5 text-sm text-violet-glow transition hover:bg-violet hover:text-white"
          >
            return home →
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CodeAudit — Brutally honest developer career intelligence" },
      { name: "description", content: "Audit your code, your career, your truth. Composite score, market position, 90-day roadmap." },
      { property: "og:title", content: "CodeAudit — Brutally honest." },
      { property: "og:description", content: "Audit your code, your career, your truth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <LiveBackground />
      <CustomCursor />
      <div className="relative z-10">
        <Outlet />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "!bg-[#0f0f0f] !border !border-[#1f1f1f] !border-l-[3px] !border-l-violet !text-foreground !font-mono !text-xs !rounded-md",
            description: "!text-muted-foreground",
          },
        }}
      />
    </>
  );
}
