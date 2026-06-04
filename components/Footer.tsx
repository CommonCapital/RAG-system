export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-16 pt-20 pb-12">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 md:col-span-1">
            <p className="serif text-[22px] font-bold tracking-tight mb-5">BLACKSTONE</p>
            <p className="text-[13px] text-gray-500 leading-relaxed max-w-[200px]">
              The world&apos;s largest alternative asset manager.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-6">Quick Links</p>
            <ul className="space-y-4">
              {["The Firm", "Our People", "Insights", "Careers"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-[14px] text-gray-300 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-6">Get in Touch</p>
            <ul className="space-y-4">
              {["Contact Us", "Our Offices", "Limited Partner Login"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-[14px] text-gray-300 hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-gray-600 mt-6 leading-relaxed">
              Switchboard<br />+1 (212) 583-5000
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-6">Follow Us</p>
            <ul className="space-y-4">
              {["LinkedIn", "Instagram", "X (Twitter)", "Facebook"].map((s) => (
                <li key={s}>
                  <a href="#" className="text-[14px] text-gray-300 hover:text-white transition-colors">{s}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col lg:flex-row justify-between gap-6">
          <p className="text-[12px] text-gray-600">© 2026 Blackstone Inc.</p>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {[
              "Transparency & Disclosure",
              "Legal",
              "Privacy Notice",
              "Japan Disclaimer",
              "Phishing and Fraud Awareness",
              "Manage Cookies",
              "Do Not Sell or Share My Personal Information",
            ].map((l) => (
              <a key={l} href="#" className="text-[12px] text-gray-600 hover:text-gray-300 transition-colors whitespace-nowrap">
                {l}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
