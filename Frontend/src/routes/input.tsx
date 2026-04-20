import { createFileRoute } from "@tanstack/react-router";
import Input from "@/components/pages/Input";

export const Route = createFileRoute("/input")({
  head: () => ({
    meta: [
      { title: "Start your audit — CodeAudit" },
      { name: "description", content: "Tell us about your code, your level, and your goals." },
    ],
  }),
  component: Input,
});
