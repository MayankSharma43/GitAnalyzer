/**
 * src/lib/api.ts
 * Typed API client for the Developer Career Intelligence System backend.
 * Base URL defaults to http://localhost:8000 — override via VITE_API_URL.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditCreatePayload {
  github_url: string;
  additional_urls: string[];
  live_app_url?: string;
  claimed_level?: string;
  location?: string;
  remote: boolean;
}

export interface AuditResponse {
  audit_id: string;
  status: string;
  message: string;
}

export interface ScoreSummary {
  code_quality: number;
  architecture: number;
  testing: number;
  performance: number;
  deployment: number;
  overall: number;
}

export interface AuditStatusResponse {
  audit_id: string;
  status: "pending" | "running" | "completed" | "failed";
  github_username: string | null;
  created_at: string;
  completed_at: string | null;
  scores: ScoreSummary | null;
  skill_level: string | null;
  percentile: number | null;
  error_message: string | null;
}

export interface CriticalIssue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  file: string | null;
  line: number | null;
  title: string;
  description: string;
  fix: string | null;
  owasp: string | null;
}

export interface Recommendation {
  rank: number;
  title: string;
  effort: string;
  impact: string;
  why: string | null;
}

export interface RadarDataPoint {
  axis: string;
  claimed: number;
  actual: number;
}

export interface ReportResponse {
  audit_id: string;
  skill_level: string;
  overall_score: number;
  percentile: number;
  scores: ScoreSummary;
  strengths: string[];
  critical_issues: CriticalIssue[];
  recommendations: Recommendation[];
  radar_data: RadarDataPoint[];
  roadmap: any[];
  job_matches: any[];
  resume_bullets: any[];
  career_narrative: string | null;
  repos_analysed: number;
  languages: { name: string; value: number; color: string }[];
  created_at: string;
}

export interface ProgressEvent {
  audit_id: string;
  step: number;
  total_steps: number;
  step_name: string;
  message: string;
  section: string;
  percent: number;
  status: "running" | "completed" | "failed";
  data?: Record<string, unknown>;
  type?: "ping";
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      typeof err === "object" && err !== null
        ? (err as { error?: string; detail?: string }).error ??
          (err as { error?: string; detail?: string }).detail ??
          res.statusText
        : res.statusText
    );
  }

  return res.json() as Promise<T>;
}

// ── API methods ───────────────────────────────────────────────────────────────

export const api = {
  /** POST /audit — create audit and start pipeline */
  createAudit: (payload: AuditCreatePayload): Promise<AuditResponse> =>
    apiFetch<AuditResponse>("/audit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /audit/{id} — poll status + scores */
  getAuditStatus: (auditId: string): Promise<AuditStatusResponse> =>
    apiFetch<AuditStatusResponse>(`/audit/${auditId}`),

  /** GET /audit/{id}/report — full structured report */
  getReport: (auditId: string): Promise<ReportResponse> =>
    apiFetch<ReportResponse>(`/audit/${auditId}/report`),

  /** WS /audit/{id}/progress — returns a WebSocket instance */
  connectProgress: (auditId: string): WebSocket => {
    const wsBase = BASE_URL.replace(/^http/, "ws");
    return new WebSocket(`${wsBase}/audit/${auditId}/progress`);
  },
};
