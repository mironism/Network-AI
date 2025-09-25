"use client";
import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Agary transformed how I manage my professional relationships. I can instantly find the right contacts for any business need with simple questions.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Sarah Chen",
    role: "Startup Founder",
  },
  {
    text: "The AI assistant is incredible! Just asking 'Who can help with fundraising?' instantly shows me my best connections. It's like having a personal network consultant.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Marcus Johnson",
    role: "VC Partner",
  },
  {
    text: "Finally, a CRM that understands relationships. Agary helps me nurture my network and find the perfect introductions for my clients.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Rachel Kumar",
    role: "Business Development",
  },
  {
    text: "Agary's smart search saved me hours of scrolling through contacts. It's revolutionized how I leverage my professional network.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David Park",
    role: "CEO",
  },
  {
    text: "The AI-powered contact management is genius. It automatically enriches profiles and suggests relevant connections for my projects.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Emily Rodriguez",
    role: "Product Manager",
  },
  {
    text: "I love how Agary learns from my interactions and gets smarter over time. It's become essential for my business development.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Jennifer Wu",
    role: "Sales Director",
  },
  {
    text: "The floating AI assistant is so convenient. I can ask questions about my network anytime and get instant, relevant suggestions.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Alex Thompson",
    role: "Entrepreneur",
  },
  {
    text: "Agary turned my chaotic contact list into a strategic asset. Now I always know who to reach out to for any opportunity.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Lisa Zhang",
    role: "Investor Relations",
  },
  {
    text: "The first truly intelligent CRM. Agary understands context and relationships in ways traditional CRMs never could.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Michael Brown",
    role: "Growth Manager",
  },
];

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-blue-600/10 max-w-xs w-full bg-white" key={i}>
                  <div className="text-sm leading-relaxed">{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const VerticalTestimonials = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default VerticalTestimonials;