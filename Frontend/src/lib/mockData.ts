// Centralized mock data for the entire CodeAudit experience.
export const auditMeta = {
  user: "alex.dev",
  github: "https://github.com/alex-dev",
  composite: 67,
  percentile: 41,
  reposAnalyzed: 12,
  issuesFound: 38,
  claimedLevel: "Senior",
  actualLevel: "Mid-level",
  mismatchNote:
    "Your authentication implementation in payments-api has 3 flaws a senior engineer would reject in code review.",
};

export const radarData = [
  { axis: "Code Quality", claimed: 90, actual: 64 },
  { axis: "Testing", claimed: 85, actual: 32 },
  { axis: "Security", claimed: 80, actual: 41 },
  { axis: "Architecture", claimed: 88, actual: 60 },
  { axis: "Documentation", claimed: 70, actual: 28 },
  { axis: "UI/UX", claimed: 75, actual: 58 },
  { axis: "Performance", claimed: 80, actual: 55 },
];

export const criticalFindings = [
  {
    severity: "CRITICAL" as const,
    title: "JWT refresh token never validated on rotation",
    description:
      "payments-api/src/auth/jwt.ts:34 — refreshToken() returns a new token without checking the prior token's signature, allowing replay.",
  },
  {
    severity: "CRITICAL" as const,
    title: "Untyped any[] used in core billing pipeline",
    description:
      "billing-engine/src/invoice.ts:112 — `function process(items: any[])` swallows runtime errors and lets malformed payloads through.",
  },
  {
    severity: "MAJOR" as const,
    title: "No tests on the most-changed file in the repo",
    description:
      "shop-frontend/src/checkout/Cart.tsx — 47 commits, 0% coverage. This is your highest-risk module.",
  },
];

export const repos = [
  { name: "payments-api", lang: "TypeScript", score: 58, modularity: 62, coverage: 24, docs: 30, architecture: 55 },
  { name: "shop-frontend", lang: "TypeScript", score: 71, modularity: 78, coverage: 12, docs: 40, architecture: 72 },
  { name: "billing-engine", lang: "Go", score: 64, modularity: 70, coverage: 41, docs: 22, architecture: 68 },
  { name: "ml-pipeline", lang: "Python", score: 52, modularity: 50, coverage: 8, docs: 18, architecture: 45 },
  { name: "infra-terraform", lang: "HCL", score: 80, modularity: 82, coverage: 0, docs: 60, architecture: 88 },
  { name: "design-system", lang: "TypeScript", score: 86, modularity: 90, coverage: 78, docs: 75, architecture: 84 },
  { name: "auth-service", lang: "Rust", score: 74, modularity: 80, coverage: 55, docs: 48, architecture: 76 },
  { name: "notifications", lang: "Node.js", score: 60, modularity: 58, coverage: 30, docs: 25, architecture: 60 },
  { name: "analytics-worker", lang: "Python", score: 55, modularity: 52, coverage: 18, docs: 20, architecture: 50 },
  { name: "docs-site", lang: "TypeScript", score: 78, modularity: 80, coverage: 0, docs: 92, architecture: 70 },
  { name: "cli-tool", lang: "Go", score: 68, modularity: 72, coverage: 50, docs: 65, architecture: 66 },
  { name: "experiments", lang: "JavaScript", score: 38, modularity: 32, coverage: 0, docs: 5, architecture: 28 },
];

export const languageStack = [
  { name: "TypeScript", value: 42, color: "#a78bfa" },
  { name: "Python", value: 18, color: "#06b6d4" },
  { name: "Go", value: 16, color: "#10b981" },
  { name: "Rust", value: 10, color: "#f59e0b" },
  { name: "JavaScript", value: 8, color: "#ef4444" },
  { name: "Other", value: 6, color: "#64748b" },
];

export const webVitals = [
  { metric: "LCP", value: 3.8, unit: "s", status: "FAIL", target: "< 2.5s", note: "Hero image not preloaded; blocks render." },
  { metric: "CLS", value: 0.08, unit: "", status: "PASS", target: "< 0.1", note: "Reserved space on async images." },
  { metric: "INP", value: 240, unit: "ms", status: "WARN", target: "< 200ms", note: "Long task in checkout reducer." },
];

export const waterfall = [
  { name: "HTML", time: 220 },
  { name: "CSS", time: 180 },
  { name: "JS bundle", time: 1250 },
  { name: "Images", time: 980 },
  { name: "Fonts", time: 340 },
  { name: "API: /me", time: 410 },
  { name: "API: /products", time: 720 },
];

export const a11yViolations = [
  { kind: "Missing alt text", count: 14, fix: "Add descriptive alt='' to <img> in product cards." },
  { kind: "Color contrast 3.2:1", count: 6, fix: "Raise --muted-foreground to meet 4.5:1." },
  { kind: "No focus visible", count: 9, fix: "Add :focus-visible ring on interactive elements." },
  { kind: "ARIA misuse", count: 3, fix: "<div role='button'> → use <button>." },
];

export const securityFindings = [
  {
    severity: "HIGH" as const,
    file: "payments-api/src/auth/jwt.ts",
    line: 34,
    title: "Refresh token signature not validated",
    owasp: "A02:2021 — Cryptographic Failures",
    snippet:
      "function refresh(token) {\n  const payload = jwt.decode(token); // ❌ no verify\n  return jwt.sign(payload, SECRET);\n}",
    fix: "Use jwt.verify(token, SECRET) and reject on JsonWebTokenError.",
  },
  {
    severity: "HIGH" as const,
    file: "shop-frontend/src/api/checkout.ts",
    line: 71,
    title: "Stripe secret key in client bundle",
    owasp: "A05:2021 — Security Misconfiguration",
    snippet: "const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET);",
    fix: "Move to a server function. The VITE_ prefix exposes it to the browser.",
  },
  {
    severity: "MEDIUM" as const,
    file: "billing-engine/internal/db/query.go",
    line: 88,
    title: "SQL string concatenation",
    owasp: "A03:2021 — Injection",
    snippet: 'db.Exec("SELECT * FROM users WHERE email=\'" + email + "\'")',
    fix: "Use parameterized queries: db.Exec(\"... WHERE email=$1\", email).",
  },
];

export const exposedSecrets = [
  { file: ".env.example", type: "Production AWS_SECRET_ACCESS_KEY (committed)", severity: "HIGH" },
  { file: "scripts/seed.js", type: "Hardcoded admin password", severity: "MEDIUM" },
];

export const fixQueue = [
  { rank: 1, title: "Validate JWT refresh signature", effort: "1h", impact: "CRITICAL" },
  { rank: 2, title: "Move Stripe secret to server", effort: "2h", impact: "CRITICAL" },
  { rank: 3, title: "Parameterize all SQL in billing-engine", effort: "4h", impact: "HIGH" },
  { rank: 4, title: "Rotate committed AWS key", effort: "1h", impact: "HIGH" },
  { rank: 5, title: "Add tests to Cart.tsx (40% target)", effort: "1 day", impact: "MEDIUM" },
];

export const jobMatches = [
  { title: "Senior Frontend Engineer", company: "Series B SaaS", min: 110, max: 145, match: 62 },
  { title: "Mid Full-Stack Engineer", company: "Healthtech Scale-up", min: 95, max: 125, match: 88 },
  { title: "Platform Engineer", company: "DevTools Startup", min: 120, max: 160, match: 54 },
  { title: "Frontend Lead (10 ppl)", company: "Fintech (post-IPO)", min: 150, max: 195, match: 38 },
  { title: "Software Engineer II", company: "Big Tech", min: 140, max: 180, match: 47 },
];

export const companyArchetypes = [
  { type: "Series B startup", expects: "Ship fast, own a domain end-to-end.", likelihood: 78 },
  { type: "Big Tech (FAANG)", expects: "Algorithms, system design, deep specialization.", likelihood: 41 },
  { type: "Boutique agency", expects: "Polished UI, multiple stacks, fast delivery.", likelihood: 84 },
  { type: "Fintech scale-up", expects: "Security mindset, observability, audit trails.", likelihood: 52 },
  { type: "Open-source first", expects: "Public contributions, RFC writing, docs.", likelihood: 35 },
  { type: "Enterprise SaaS", expects: "Backwards compat, large codebase navigation.", likelihood: 66 },
];

export const skillsHeatmap = [
  { skill: "TypeScript", demand: 98 },
  { skill: "React", demand: 96 },
  { skill: "AWS", demand: 88 },
  { skill: "PostgreSQL", demand: 84 },
  { skill: "Kubernetes", demand: 76 },
  { skill: "Go", demand: 72 },
  { skill: "GraphQL", demand: 65 },
  { skill: "Rust", demand: 58 },
  { skill: "Tailwind", demand: 88 },
  { skill: "tRPC", demand: 54 },
  { skill: "Next.js", demand: 92 },
  { skill: "Python", demand: 78 },
  { skill: "Terraform", demand: 70 },
  { skill: "Redis", demand: 68 },
  { skill: "Vitest", demand: 62 },
];

export const roadmap = [
  {
    phase: "Day 1–30",
    goals: [
      "Fix all 5 CRITICAL security findings",
      "Add tests to Cart.tsx (target: 60% coverage)",
      "Replace `any[]` in billing-engine with discriminated union",
      "Write a README for payments-api",
    ],
  },
  {
    phase: "Day 31–60",
    goals: [
      "Ship one OSS PR to a TypeScript tooling project",
      "Add E2E tests with Playwright for checkout flow",
      "Refactor analytics-worker to event-driven (remove polling)",
      "Publish a write-up: 'How I cut LCP 50%'",
    ],
  },
  {
    phase: "Day 61–90",
    goals: [
      "Design + ship a feature that requires schema migration",
      "Mentor a junior on code review (record outcomes)",
      "Speak internally on observability strategy",
      "Open-source design-system as a standalone package",
    ],
  },
];

export const skillROI = [
  { rank: 1, skill: "Rigorous testing (Vitest + Playwright)", why: "Single biggest lever to reach Senior in interviews.", roi: "High" },
  { rank: 2, skill: "Distributed systems primitives", why: "Unlocks the $140k+ band.", roi: "High" },
  { rank: 3, skill: "Production observability (OTel, Sentry)", why: "Shows you've shipped to real users.", roi: "High" },
  { rank: 4, skill: "Security mindset (OWASP top 10)", why: "Removes auto-rejects in fintech roles.", roi: "Medium" },
  { rank: 5, skill: "Technical writing", why: "Compounds career visibility long-term.", roi: "Medium" },
];

export const weeklyTasks = [
  {
    week: "Week 1",
    build: ["Refactor jwt.ts with verify()", "Add Cart.test.tsx with 5 cases"],
    read: ["OWASP Top 10 — A02 deep dive", "Kent C. Dodds — testing trophy"],
    fix: ["Move Stripe secret out of client", "Rotate AWS key"],
  },
  {
    week: "Week 2",
    build: ["Parameterize 12 SQL queries", "Add Sentry to payments-api"],
    read: ["Designing Data-Intensive Apps ch. 1–3"],
    fix: ["Reduce bundle 200kB by code-splitting routes"],
  },
  {
    week: "Week 3",
    build: ["E2E checkout flow in Playwright", "OTel traces in billing-engine"],
    read: ["Google SRE book ch. 2"],
    fix: ["LCP < 2.5s by preloading hero image"],
  },
  {
    week: "Week 4",
    build: ["Open-source design-system v0.1"],
    read: ["Semantic Versioning spec"],
    fix: ["Migrate experiments repo or archive it"],
  },
];

export const resumeBullets = [
  {
    original: "Built a scalable payments platform handling millions of transactions.",
    rewritten:
      "Built payments-api processing 4.2M tx/mo on Node + Postgres; reduced p99 latency from 1.4s → 380ms via N+1 query elimination.",
    mismatch: false,
  },
  {
    original: "Led architecture and made all key technical decisions.",
    rewritten:
      "Owned 3 of 12 services in the platform; co-authored the auth-service Rust migration RFC with one other engineer.",
    mismatch: true,
  },
  {
    original: "Expert in test-driven development and quality engineering.",
    rewritten:
      "Maintained 78% coverage on the design-system package (Vitest); other repos averaged 26% — improving in current role.",
    mismatch: true,
  },
  {
    original: "Mentored junior engineers across the org.",
    rewritten:
      "Reviewed an average of 18 PRs/month with documented feedback; ran a 4-session intro-to-TypeScript study group.",
    mismatch: false,
  },
];

export const repoRecommendations = [
  { name: "design-system", verdict: "lead" as const, reason: "Highest score, strong tests, shows taste." },
  { name: "payments-api", verdict: "lead" as const, reason: "Demonstrates real production scale and tradeoffs." },
  { name: "auth-service", verdict: "lead" as const, reason: "Rust + non-trivial; signals depth." },
  { name: "experiments", verdict: "remove" as const, reason: "0 tests, 0 docs — actively hurts you on read." },
  { name: "ml-pipeline", verdict: "remove" as const, reason: "Score 52, abandoned commits, weak signal." },
];

export const keywordGap = {
  inResume: ["React", "Node.js", "AWS", "TypeScript", "Agile", "Leadership", "Mentorship"],
  inJobs: ["TypeScript", "Next.js", "PostgreSQL", "Observability", "Kubernetes", "OpenTelemetry", "tRPC", "Vitest", "Terraform"],
};

export const atsScore = 64;
