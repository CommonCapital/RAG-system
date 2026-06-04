"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Search, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "The Firm",
    items: ["Overview", "Our Culture", "Leadership", "Sustainability", "Diversity, Equity & Inclusion", "Giving Back"],
  },
  {
    label: "What We Do",
    items: ["Real Estate", "Private Equity", "Credit & Insurance", "Multi-Asset Investing"],
  },
  {
    label: "News & Insights",
    items: ["All Insights", "Market Views", "Press Releases", "In The News", "Podcast"],
  },
  {
    label: "Financial Advisors",
    items: ["BREIT", "BCRED", "BMACX", "BPP", "BXPE", "All Products"],
  },
  {
    label: "Shareholders",
    items: ["Earnings", "Annual Reports", "SEC Filings", "Dividends & Capital", "Corporate Governance"],
  },
];

export default function Navbar() {
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}>
      <div className="max-w-[1440px] mx-auto px-8 lg:px-12 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="serif text-[21px] font-bold tracking-tight text-black shrink-0">
          BLACKSTONE
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center h-[72px] flex-1 ml-10">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative h-[72px] flex items-center"
              onMouseEnter={() => setActive(item.label)}
              onMouseLeave={() => setActive(null)}
            >
              <button className="flex items-center gap-[5px] px-5 h-full text-[13px] font-medium text-[#111] hover:text-black whitespace-nowrap">
                {item.label}
                <ChevronDown
                  size={11}
                  strokeWidth={2.5}
                  className={`text-gray-400 mt-px transition-transform duration-200 ${active === item.label ? "rotate-180" : ""}`}
                />
              </button>

              {active === item.label && (
                <div className="absolute top-[72px] left-0 bg-white shadow-xl border-t-2 border-black min-w-[240px] py-3 z-50">
                  {item.items.map((sub) => (
                    <a key={sub} href="#"
                      className="block px-6 py-2.5 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 transition-colors">
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-5">
          <button className="hidden lg:flex items-center justify-center text-gray-600 hover:text-black transition-colors">
            <Search size={17} strokeWidth={1.8} />
          </button>
          <a href="#"
            className="hidden lg:block text-[13px] font-semibold text-black bg-black text-white px-5 py-2 hover:bg-gray-800 transition-colors">
            LP Login
          </a>
          <button className="lg:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 max-h-[85vh] overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="border-b border-gray-100">
              <button
                className="w-full flex justify-between items-center px-8 py-4 text-[14px] font-medium"
                onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
              >
                {item.label}
                <ChevronDown size={14} className={`transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} />
              </button>
              {mobileExpanded === item.label && (
                <div className="pb-3 bg-gray-50">
                  {item.items.map((sub) => (
                    <a key={sub} href="#" className="block px-10 py-2.5 text-[13px] text-gray-600 hover:text-black">
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="px-8 py-5">
            <a href="#" className="text-[13px] font-semibold">LP Login</a>
          </div>
        </div>
      )}
    </header>
  );
}
