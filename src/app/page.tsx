import About from "@/components/About";
import Contact from "@/components/Contact";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Partners from "@/components/Partners";
import Testimonial from "@/components/Testimonial";
import Image from "next/image";
import getAllEvents from "./actions/getAllEvent";
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
      <div className="max-md:hidden">
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
