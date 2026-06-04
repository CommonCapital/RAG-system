export default function Earnings() {
  return (
    <section
      className="relative py-32 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
      }}
    >
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-8">Shareholders</p>
            <h2 className="serif text-[38px] lg:text-[50px] font-bold text-white leading-tight mb-6">
              Blackstone Reports First-Quarter 2026 Earnings
            </h2>
            <p className="text-[16px] text-gray-400 leading-relaxed">
              Distributable Earnings of $1.2B · Fee-Related Earnings of $980M · Inflows of $41B
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <a
              href="#"
              className="flex items-center justify-between bg-white text-black text-[14px] font-semibold px-8 py-5 hover:bg-gray-100 transition-colors group"
            >
              View Press Release
              <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href="#"
              className="flex items-center justify-between border border-white/20 text-white text-[14px] font-semibold px-8 py-5 hover:bg-white/5 transition-colors group"
            >
              View Supplemental Data
              <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href="#"
              className="flex items-center justify-between border border-white/20 text-white text-[14px] font-semibold px-8 py-5 hover:bg-white/5 transition-colors group"
            >
              Listen to Webcast
              <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
