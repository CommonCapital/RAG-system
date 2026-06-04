import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import WhatWeDo from "@/components/WhatWeDo";
import PrivateWealth from "@/components/PrivateWealth";
import Earnings from "@/components/Earnings";
import Insights from "@/components/Insights";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <Hero />
        <Stats />
        <WhatWeDo />
        <PrivateWealth />
        <Earnings />
        <Insights />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
