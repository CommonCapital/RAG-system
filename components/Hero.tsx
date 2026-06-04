"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    title: "Celebrating 40 Years at Blackstone",
    cta: "Watch Now",
    img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=90&auto=format&fit=crop",
  },
  {
    title: "Infrastructure of the Future",
    cta: "Learn More",
    img: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1800&q=90&auto=format&fit=crop",
  },
  {
    title: "Pattern Recognition",
    cta: "Learn More",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1800&q=90&auto=format&fit=crop",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{ marginTop: "72px" }}>
      {/* Above-carousel headline */}
      <div className="bg-white px-8 lg:px-16 pt-16 pb-10 max-w-[1440px] mx-auto">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4 font-medium">
          The World&apos;s #1 Alternative Asset Manager
        </p>
        <h1 className="serif text-[52px] lg:text-[68px] font-bold text-black leading-none tracking-tight">
          Build with Blackstone
        </h1>
        <p className="text-[22px] text-gray-400 font-light mt-3">$1.3T Assets Under Management</p>
      </div>

      {/* Full-bleed carousel */}
      <div className="relative overflow-hidden" style={{ height: "520px" }}>
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
          >
            <img
              src={slide.img}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

            {/* text */}
            <div className="absolute inset-0 flex flex-col justify-end px-8 lg:px-16 pb-16 max-w-[1440px] mx-auto">
              <h2 className="serif text-[36px] lg:text-[48px] font-bold text-white leading-tight max-w-lg mb-7">
                {slide.title}
              </h2>
              <a href="#"
                className="inline-flex items-center gap-2 bg-white text-black text-[13px] font-semibold px-7 py-3.5 hover:bg-gray-100 transition-colors w-fit">
                {slide.cta}
              </a>
            </div>
          </div>
        ))}

        {/* Dots + arrows */}
        <div className="absolute bottom-8 right-8 lg:right-16 flex items-center gap-4 z-10">
          <button onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
            className="w-9 h-9 flex items-center justify-center border border-white/40 text-white hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-2 items-center">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="h-[3px] transition-all duration-300 rounded-none"
                style={{ width: i === current ? 28 : 12, background: i === current ? "#fff" : "rgba(255,255,255,0.4)" }}
              />
            ))}
          </div>
          <button onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
            className="w-9 h-9 flex items-center justify-center border border-white/40 text-white hover:bg-white/10 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
