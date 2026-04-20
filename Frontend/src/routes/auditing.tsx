import { createFileRoute } from "@tanstack/react-router";
import Auditing from "@/components/pages/Auditing";

export const Route = createFileRoute("/auditing")({
  head: () => ({
    meta: [
      { title: "Auditing... — CodeAudit" },
      { name: "description", content: "Compiling your brutal truth." },
    ],
  }),
  component: Auditing,
});
