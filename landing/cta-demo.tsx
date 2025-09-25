import { CTASection } from "./cta-with-rectangle"

export function CTADemo() {
  return (
    <CTASection
      badge={{
        text: "Get started"
      }}
      title="Start building with Agary"
      description="Get started with Agary and build your professional network in no time"
      action={{
        text: "Get Started",
        href: "/auth",
        variant: "default"
      }}
    />
  )
}
