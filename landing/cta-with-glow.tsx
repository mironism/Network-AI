"use client"

import { Button } from "../src/components/ui/button"
import { Glow } from "./glow"
import { cn } from "../src/lib/utils"

interface CTAProps {
  title: string
  action: {
    text: string
    href: string
    variant?: "default" | "glow"
  }
  className?: string
}

export function CTASection({ title, action, className }: CTAProps) {
  return (
    <section className={cn("group relative overflow-hidden py-24 sm:py-32", className)}>
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-8 text-center px-6 sm:gap-10 sm:px-8">
        <h2 className="text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl animate-appear">
          {title}
        </h2>
        <Button 
          variant={action.variant || "default"} 
          size="lg" 
          className="animate-appear delay-100"
          asChild
        >
          <a href={action.href}>{action.text}</a>
        </Button>
      </div>
      <div className="absolute left-0 top-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <Glow variant="bottom" className="animate-appear-zoom delay-300" />
      </div>
    </section>
  )
}
