import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import { api, ReportResponse } from "@/lib/api";

export type DashboardContext = {
  report: ReportResponse | null;
};

export const DashboardContextObj = createContext<DashboardContext>({ report: null });
export const useDashboardContext = () => useContext(DashboardContextObj);

function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auditId = sessionStorage.getItem("audit_id");
    if (!auditId) {
      navigate({ to: "/input" });
      return;
    }

    api.getReport(auditId)
      .then(setReport)
      .catch((err) => {
        console.error("Failed to load report", err);
        setError("Failed to load audit report. Please try auditing again.");
      });
  }, [navigate]);

  if (error) {
    return <div className="flex h-screen items-center justify-center p-6 text-center font-mono text-danger">{error}</div>;
  }

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-violet-glow blink-caret">
        Loading personalized report...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-6 py-8 pb-24 md:px-10 md:py-10 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <DashboardContextObj.Provider value={{ report }}>
                <Outlet />
              </DashboardContextObj.Provider>
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CodeAudit" },
      { name: "description", content: "Your composite score, market position, and the truth about your code." },
    ],
  }),
  component: DashboardLayout,
});
