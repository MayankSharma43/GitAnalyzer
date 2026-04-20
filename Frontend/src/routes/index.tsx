import { createFileRoute } from "@tanstack/react-router";
import Splash from "@/components/pages/Splash";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeAudit — Brutally honest. Ruthlessly accurate." },
      { name: "description", content: "A developer career intelligence platform that audits your code, your level, and your market position." },
      { property: "og:title", content: "CodeAudit — Brutally honest." },
      { property: "og:description", content: "Audit your code, your level, your market position." },
    ],
  }),
  component: Splash,
});
