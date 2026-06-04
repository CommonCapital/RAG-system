const PRODUCTS = [
  {
    ticker: "BREIT",
    name: "Blackstone Real Estate Income Trust",
    desc: "A non-traded REIT offering individual investors access to Blackstone's institutional real estate portfolio.",
  },
  {
    ticker: "BCRED",
    name: "Blackstone Private Credit Fund",
    desc: "A non-traded BDC focused on floating-rate, senior secured loans to U.S. middle market companies.",
  },
  {
    ticker: "BMACX",
    name: "Blackstone Private Multi-Asset Credit and Income Fund",
    desc: "Diversified exposure to Blackstone's alternative credit strategies in a single vehicle.",
  },
];

export default function PrivateWealth() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-16">

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Left copy */}
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-8">Financial Advisors</p>
            <h2 className="serif text-[38px] font-bold text-black leading-tight mb-7">
              Bringing Blackstone to Individual Investors
            </h2>
            <p className="text-[16px] text-gray-600 leading-relaxed mb-8">
              Through partnerships with financial advisors, Blackstone makes its leading alternative investment strategies accessible to qualified individual investors.
            </p>
            <a href="#" className="text-[14px] font-semibold text-black border-b border-black pb-px hover:text-gray-500 hover:border-gray-400 transition-colors">
              Learn More
            </a>
          </div>

          {/* Product cards */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRODUCTS.map((p) => (
              <a key={p.ticker} href="#"
                className="group block bg-[#f7f7f5] p-8 hover:bg-gray-100 transition-colors duration-200">
                <p className="serif text-[32px] font-bold text-black mb-3 group-hover:text-gray-700 transition-colors">{p.ticker}</p>
                <p className="text-[12px] text-gray-500 leading-snug mb-5">{p.name}</p>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-7">{p.desc}</p>
                <span className="text-[13px] font-semibold text-black border-b border-black pb-px group-hover:text-gray-500 group-hover:border-gray-400 transition-colors">
                  Learn More
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
