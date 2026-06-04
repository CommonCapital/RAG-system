export default function Stats() {
  return (
    <section className="bg-white py-24 px-8 lg:px-16 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

        {/* Left */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-8">Delivering for Investors</p>
          <div className="serif text-[80px] lg:text-[100px] font-bold text-black leading-none mb-4">$1.3T</div>
          <p className="text-[16px] text-gray-500 mb-8">Assets Under Management</p>
          <p className="text-[17px] text-gray-700 leading-relaxed mb-10 max-w-md">
            Blackstone is the world&apos;s largest alternative asset manager. Our portfolio companies collectively employ approximately 900,000 people globally.
          </p>
          <a href="#" className="inline-flex items-center gap-2 text-[14px] font-semibold text-black group">
            <span className="border-b border-black group-hover:border-gray-400 group-hover:text-gray-500 transition-colors pb-px">Learn More</span>
          </a>
        </div>

        {/* Right */}
        <div className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-8">Private Wealth</p>
          <h2 className="serif text-[38px] lg:text-[46px] font-bold text-black leading-tight mb-8">
            Institutional quality for individual investors
          </h2>
          <p className="text-[17px] text-gray-700 leading-relaxed mb-10 max-w-md">
            We partner with financial advisors to bring Blackstone&apos;s leading alternative investment strategies to individual investors worldwide.
          </p>
          <a href="#" className="inline-flex items-center gap-2 text-[14px] font-semibold text-black group">
            <span className="border-b border-black group-hover:border-gray-400 group-hover:text-gray-500 transition-colors pb-px">Learn More</span>
          </a>
        </div>

      </div>
    </section>
  );
}
