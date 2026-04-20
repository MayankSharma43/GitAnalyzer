import { motion } from "framer-motion";

export default function FeatureColumns() {
  return (
    <section className="grid grid-cols-1 gap-0 border-b border-[#1a1a1a] bg-[#0a0a0a] md:grid-cols-3">
      {/* Column 1 — tallest */}
      <div className="px-6 py-20 md:px-10 md:py-28">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-violet-glow">
          01 / CODE AUDIT
        </div>
        <h3
          className="mt-6 font-extrabold text-[#f0f0f0]"
          style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.05 }}
        >
          Every line.
          <br />
          No mercy.
        </h3>
        <p className="mt-6 text-[14px] font-light leading-[1.8] text-[#666]">
          We read every file in every repo. Modularity, coverage, security,
          architecture — scored against what real senior code looks like.
        </p>

        <div className="mt-8 border border-[#1a1a1a] bg-[#080808] p-5 font-mono text-[12px] leading-[1.7]">
          <div className="mb-2 font-sans text-[10px] uppercase tracking-widest text-[#555]">diff</div>
          <div className="bg-[#1a0808] px-2 text-[#ef4444]">
            - const token = jwt.sign(data, 'hardcoded_secret')
          </div>
          <div className="bg-[#081a0e] px-2 text-[#10b981]">
            + const token = jwt.sign(data, process.env.JWT_SECRET, &#123;
          </div>
          <div className="bg-[#081a0e] px-2 text-[#10b981]">
            +   algorithm: 'RS256',
          </div>
          <div className="bg-[#081a0e] px-2 text-[#10b981]">
            +   expiresIn: '15m'
          </div>
          <div className="bg-[#081a0e] px-2 text-[#10b981]">+ &#125;)</div>
        </div>
      </div>

      {/* Column 2 — medium */}
      <div className="border-x border-[#1a1a1a] px-6 py-20 md:px-10 md:py-24">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-violet-glow">
          02 / JOB INTEL
        </div>
        <h3
          className="mt-6 font-extrabold text-[#f0f0f0]"
          style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.05 }}
        >
          Know where you actually stand.
        </h3>
        <p className="mt-6 text-[14px] font-light leading-[1.8] text-[#666]">
          We benchmark you against 1,200+ live job postings in your stack.
        </p>

        <div className="mt-10 space-y-5">
          <BarRow label="YOU" value={62} color="#a78bfa" />
          <BarRow label="MARKET" value={84} color="#06b6d4" />
        </div>
      </div>

      {/* Column 3 — shortest */}
      <div className="px-6 py-20 md:px-10 md:py-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-violet-glow">
          03 / ROADMAP
        </div>
        <h3
          className="mt-6 font-extrabold text-[#f0f0f0]"
          style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", lineHeight: 1.05 }}
        >
          90 days.
          <br />
          Specific. Brutal.
        </h3>

        <div className="mt-8 space-y-3">
          {[
            { n: "01", text: "Fix auth" },
            { n: "02", text: "Add tests" },
            { n: "03", text: "Ship feature" },
          ].map((item) => (
            <div
              key={item.n}
              className="group flex cursor-pointer items-center gap-4 font-mono text-[13px] text-[#666] hover:translate-x-2 hover:text-[#f0f0f0]"
              style={{ transition: "transform 200ms, color 150ms" }}
            >
              <span className="text-[#444] group-hover:text-violet-glow">{item.n}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between font-mono text-[10px] tracking-widest text-[#555]">
        <span>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-[6px] w-full bg-[#141414]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
