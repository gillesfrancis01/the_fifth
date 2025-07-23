import About from "@/components/About";
import Contact from "@/components/Contact";

import Hero from "@/components/Hero";
import Partners from "@/components/Partners";

import PortfolioList from "@/components/PortfolioList";
import { Portfolio } from "@/constants";
import { Separator } from "@/components/Separator";
import TestimonialFull from "@/components/TestimonialFull";

export default async function Home() {

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <Hero />
      <Partners />
      <About />
      <div className="max-md:hidden bg-[url('/bg-logo.png')] bg-size-[100px]">
      {Portfolio.map((item, index) => (
    <PortfolioList
      portfolio={item}
      key={item.id}
      reverse={index % 2 !== 0} // Inverser un élément sur deux
    />
  ))}
  <Separator/>
  </div>
      <TestimonialFull />
      <Contact />

    </div>
    
  );
}
