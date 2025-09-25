"use client";
import React from "react";
import { motion } from "motion/react";

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
  {
    text: "I've tried every CRM on the market, but Agary is the only one that truly understands professional relationships and context.",
    image: "https://randomuser.me/api/portraits/women/10.jpg",
    name: "Amanda Foster",
    role: "Angel Investor",
  },
  {
    text: "Agary's ability to instantly connect me with relevant people in my network has accelerated my deal flow significantly.",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
    name: "James Mitchell",
    role: "Investment Banker",
  },
  {
    text: "The AI enrichment feature automatically fills in details about my contacts that I never would have discovered manually. It's like magic.",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    name: "Sophie Turner",
    role: "Partnership Lead",
  },
  {
    text: "As a recruiter, Agary helps me find the perfect candidates by understanding not just skills, but professional relationships and context.",
    image: "https://randomuser.me/api/portraits/men/13.jpg",
    name: "Robert Hayes",
    role: "Executive Recruiter",
  },
  {
    text: "Agary has become my secret weapon for business development. It knows my network better than I do and suggests connections I never considered.",
    image: "https://randomuser.me/api/portraits/women/14.jpg",
    name: "Maria Santos",
    role: "Strategic Partnerships",
  },
  {
    text: "The natural language search is game-changing. I can ask complex questions about my network and get intelligent, contextual answers.",
    image: "https://randomuser.me/api/portraits/men/15.jpg",
    name: "Kevin O'Connor",
    role: "Venture Capitalist",
  },
  {
    text: "Agary helps me maintain relationships at scale. It reminds me when to follow up and suggests relevant conversation topics.",
    image: "https://randomuser.me/api/portraits/women/16.jpg",
    name: "Isabella Martinez",
    role: "Relationship Manager",
  },
  {
    text: "For someone juggling hundreds of professional relationships, Agary is indispensable. It's like having a personal assistant who knows everyone.",
    image: "https://randomuser.me/api/portraits/men/17.jpg",
    name: "Daniel Kim",
    role: "Startup Accelerator",
  },
  {
    text: "The AI understands industry connections and can map out introduction paths I never would have thought of. It's revolutionized my networking strategy.",
    image: "https://randomuser.me/api/portraits/women/18.jpg",
    name: "Grace Lee",
    role: "Tech Executive",
  },
  {
    text: "Agary doesn't just store contacts—it understands them. The insights it provides about my network have opened doors to new opportunities.",
    image: "https://randomuser.me/api/portraits/men/19.jpg",
    name: "Thomas Anderson",
    role: "Corporate Development",
  },
  {
    text: "I was skeptical about AI in CRM, but Agary proved me wrong. It's intuitive, intelligent, and incredibly powerful for relationship management.",
    image: "https://randomuser.me/api/portraits/women/20.jpg",
    name: "Victoria Chang",
    role: "Business Strategist",
  },
  {
    text: "The speed at which Agary can analyze my network and provide relevant suggestions is mind-blowing. It's saved me countless hours.",
    image: "https://randomuser.me/api/portraits/men/21.jpg",
    name: "Christopher Davis",
    role: "M&A Advisor",
  },
  {
    text: "Agary has transformed how I approach fundraising. It instantly identifies warm introduction paths to investors I want to meet.",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    name: "Nicole Taylor",
    role: "Founder & CEO",
  },
  {
    text: "The platform learns from every interaction and gets smarter over time. It's like having a networking coach that never forgets.",
    image: "https://randomuser.me/api/portraits/men/23.jpg",
    name: "Ryan Murphy",
    role: "Sales Executive",
  },
  {
    text: "Agary's ability to understand professional context and suggest relevant connections has accelerated my career growth tremendously.",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
    name: "Catherine Wilson",
    role: "Strategy Consultant",
  },
  {
    text: "I love how Agary proactively suggests when and how to reconnect with people in my network. It's relationship management on autopilot.",
    image: "https://randomuser.me/api/portraits/men/25.jpg",
    name: "Patrick O'Brien",
    role: "Investment Director",
  },
  {
    text: "The AI assistant feels like having a personal concierge for my professional network. It anticipates my needs and delivers perfect suggestions.",
    image: "https://randomuser.me/api/portraits/women/26.jpg",
    name: "Samantha Price",
    role: "Tech Entrepreneur",
  },
  {
    text: "Agary has given me a competitive edge in deal sourcing. It identifies connections and opportunities that would have taken weeks to discover manually.",
    image: "https://randomuser.me/api/portraits/men/27.jpg",
    name: "Jonathan Silver",
    role: "Private Equity",
  },
  {
    text: "The intelligent contact enrichment feature has filled gaps in my network data that I didn't even know existed. It's incredibly thorough.",
    image: "https://randomuser.me/api/portraits/women/28.jpg",
    name: "Laura Phillips",
    role: "Business Development",
  },
  {
    text: "Agary understands the nuances of professional relationships better than any tool I've used. It's like having a networking expert on call 24/7.",
    image: "https://randomuser.me/api/portraits/men/29.jpg",
    name: "Brian Coleman",
    role: "Growth Investor",
  },
];

export const TestimonialsRow = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
  direction?: "left" | "right";
}) => {
  // Calculate the width needed for one full set of testimonials
  const cardWidth = 320; // 320px (w-80)
  const gap = 24; // 24px (gap-6)
  const setWidth = props.testimonials.length * (cardWidth + gap);

  return (
    <div className={`overflow-hidden ${props.className}`}>
      <motion.div
        animate={{
          translateX: props.direction === "right"
            ? [`0px`, `-${setWidth}px`]
            : [`0px`, `${setWidth}px`],
        }}
        transition={{
          duration: props.duration || 20,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex gap-6"
        style={{
          width: `${setWidth * 2}px`,
        }}
      >
        {/* First set of testimonials */}
        {props.testimonials.map(({ text, image, name, role }, i) => (
          <div className="p-8 rounded-3xl border shadow-lg shadow-primary/10 w-80 flex-shrink-0 bg-white" key={`first-${i}`}>
            <div className="text-sm leading-relaxed">{text}</div>
            <div className="flex items-center gap-3 mt-5">
              <img
                width={40}
                height={40}
                src={image}
                alt={name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex flex-col">
                <div className="font-medium tracking-tight leading-5 text-sm">{name}</div>
                <div className="leading-5 opacity-60 tracking-tight text-xs">{role}</div>
              </div>
            </div>
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {props.testimonials.map(({ text, image, name, role }, i) => (
          <div className="p-8 rounded-3xl border shadow-lg shadow-primary/10 w-80 flex-shrink-0 bg-white" key={`second-${i}`}>
            <div className="text-sm leading-relaxed">{text}</div>
            <div className="flex items-center gap-3 mt-5">
              <img
                width={40}
                height={40}
                src={image}
                alt={name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex flex-col">
                <div className="font-medium tracking-tight leading-5 text-sm">{name}</div>
                <div className="leading-5 opacity-60 tracking-tight text-xs">{role}</div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const firstRow = testimonials.slice(0, 10);
const secondRow = testimonials.slice(10, 20);
const thirdRow = testimonials.slice(20, 29);

const Testimonials = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16"
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

        <div className="space-y-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <TestimonialsRow testimonials={firstRow} duration={60} direction="left" />
          <TestimonialsRow testimonials={secondRow} duration={70} direction="right" className="hidden sm:block" />
          <TestimonialsRow testimonials={thirdRow} duration={65} direction="left" className="hidden md:block" />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;