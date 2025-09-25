"use client"

import { Button } from "../src/components/ui/button"
import { Badge } from "../src/components/ui/badge"
import { cn } from "../src/lib/utils"

interface CTAProps {
  badge?: {
    text: string
  }
  title: string
  description?: string
  action: {
    text: string
    href: string
    variant?: "default" | "glow"
  }
  withGlow?: boolean
  className?: string
}

export function CTASection({
  badge,
  title,
  description,
  action,
  withGlow = true,
  className,
}: CTAProps) {
  return (
    <section className={cn("overflow-hidden pt-0 md:pt-0", className)}>
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24">
        {/* Badge */}
        {badge && (
          <Badge
            variant="outline"
            className="animate-fade-in-up"
          >
            <span className="text-muted-foreground">{badge.text}</span>
          </Badge>
        )}

        {/* Title */}
        <h2 className="text-3xl font-semibold sm:text-5xl animate-fade-in-up">
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-muted-foreground animate-fade-in-up">
            {description}
          </p>
        )}

        {/* Action Button */}
        <Button
          variant={action.variant || "default"}
          size="lg"
          className="animate-fade-in-up"
          asChild
        >
          <a href={action.href}>{action.text}</a>
        </Button>

        {/* Glow Effect */}
        {withGlow && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-glow-strong animate-scale-in bg-gradient-to-b from-transparent to-blue-500/10" />
        )}
      </div>
    </section>
  )
}
