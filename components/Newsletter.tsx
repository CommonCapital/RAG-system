"use client";
import { useState } from "react";

const COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Japan",
  "Australia", "Canada", "Singapore", "Hong Kong", "Switzerland",
  "United Arab Emirates", "Other",
];

export default function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className="bg-[#f7f7f5] py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-20 items-start">

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-8">Stay Informed</p>
            <h2 className="serif text-[42px] font-bold text-black leading-tight mb-6">
              Subscribe to Blackstone Insights
            </h2>
            <p className="text-[16px] text-gray-600 leading-relaxed">
              Receive Blackstone&apos;s latest market perspectives, portfolio updates, and firm announcements directly to your inbox.
            </p>
          </div>

          <div>
            {done ? (
              <div className="pt-8">
                <p className="serif text-[28px] font-bold text-black mb-3">Thank you.</p>
                <p className="text-[15px] text-gray-500">You&apos;ve been added to our mailing list.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">First Name *</label>
                    <input required type="text"
                      className="w-full bg-white border-0 border-b border-gray-300 px-0 py-3 text-[14px] text-black outline-none focus:border-black transition-colors placeholder-gray-300" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Last Name *</label>
                    <input required type="text"
                      className="w-full bg-white border-0 border-b border-gray-300 px-0 py-3 text-[14px] text-black outline-none focus:border-black transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Email Address *</label>
                  <input required type="email"
                    className="w-full bg-white border-0 border-b border-gray-300 px-0 py-3 text-[14px] text-black outline-none focus:border-black transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Company</label>
                    <input type="text"
                      className="w-full bg-white border-0 border-b border-gray-300 px-0 py-3 text-[14px] text-black outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Job Title</label>
                    <input type="text"
                      className="w-full bg-white border-0 border-b border-gray-300 px-0 py-3 text-[14px] text-black outline-none focus:border-black transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-2">Country *</label>
                  <select required
                    className="w-full bg-transparent border-0 border-b border-gray-300 px-0 py-3 text-[14px] text-black outline-none focus:border-black transition-colors appearance-none">
                    <option value="">Select a Country</option>
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit"
                    className="bg-black text-white text-[13px] font-semibold px-10 py-4 hover:bg-gray-800 transition-colors tracking-wide">
                    Subscribe
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  By submitting, you agree to receive communications from Blackstone. See our Privacy Notice.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
