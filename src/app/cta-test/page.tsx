import { CTASection } from "../../../landing/cta-with-rectangle"

export default function CTATestPage() {
  return (
    <div className="min-h-screen bg-background">
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
        withGlow={true}
        className="bg-gradient-to-b from-background to-muted/20"
      />
    </div>
  )
}
