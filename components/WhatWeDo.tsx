const BUSINESSES = [
  {
    name: "Real Estate",
    aum: "$336B AUM",
    desc: "The largest owner of commercial real estate globally, across logistics, rental housing, office, hospitality, and life sciences.",
    img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Private Equity",
    aum: "$345B AUM",
    desc: "One of the world's leading private equity investors, partnering with management teams to build great businesses.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Credit & Insurance",
    aum: "$354B AUM",
    desc: "One of the largest credit-focused alternative managers, spanning liquid credit, direct lending, and insurance solutions.",
    img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Multi-Asset Investing",
    aum: "$83B AUM",
    desc: "Customized investment solutions across alternative and traditional asset classes for institutions and individuals.",
    img: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80&auto=format&fit=crop",
  },
];

export default function WhatWeDo() {
  return (
    <section className="bg-[#f7f7f5] py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-16">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-16">What We Do</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BUSINESSES.map((b) => (
            <a key={b.name} href="#" className="group block bg-white overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="overflow-hidden" style={{ height: "220px" }}>
                <img
                  src={b.img}
                  alt={b.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-7">
                <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-3">{b.aum}</p>
                <h3 className="serif text-[22px] font-bold text-black mb-3 group-hover:text-gray-700 transition-colors">{b.name}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">{b.desc}</p>
                <span className="text-[13px] font-semibold text-black border-b border-black pb-px group-hover:border-gray-400 group-hover:text-gray-500 transition-colors">
                  Learn More
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
