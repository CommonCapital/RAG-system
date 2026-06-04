const ARTICLES = [
  {
    category: "Market Views",
    title: "Market Views: The Year of the IPO",
    date: "May 28, 2026",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&auto=format&fit=crop",
  },
  {
    category: "News",
    title: "Introducing Tommy Fleetwood, our first Global Brand Ambassador",
    date: "May 14, 2026",
    img: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80&auto=format&fit=crop",
  },
  {
    category: "Credit",
    title: "Private Credit: Myth vs. Fact",
    date: "April 30, 2026",
    img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80&auto=format&fit=crop",
  },
  {
    category: "Real Estate",
    title: "Decoding the Next Phase of the Real Estate Cycle",
    date: "April 12, 2026",
    img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format&fit=crop",
  },
];

export default function Insights() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-16">

        <div className="flex items-end justify-between mb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium">News & Insights</p>
          <a href="#" className="text-[13px] font-semibold text-black border-b border-black pb-px hover:text-gray-500 hover:border-gray-400 transition-colors">
            View All
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {ARTICLES.map((a) => (
            <a key={a.title} href="#" className="group block">
              <div className="overflow-hidden mb-5" style={{ height: "220px" }}>
                <img
                  src={a.img}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-3">{a.category}</p>
              <h3 className="serif text-[18px] font-bold text-black leading-snug mb-3 group-hover:text-gray-600 transition-colors">
                {a.title}
              </h3>
              <p className="text-[12px] text-gray-400 mb-4">{a.date}</p>
              <span className="text-[13px] font-semibold text-black border-b border-black pb-px group-hover:text-gray-500 group-hover:border-gray-400 transition-colors">
                Learn More
              </span>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
