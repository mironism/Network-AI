'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { AgaryFeatureSteps } from '@/components/ui/feature-section'
import { Footer } from '@/components/ui/footer'
import { Logo } from '@/components/ui/logo'
import { CTASection } from '@/components/ui/cta-with-glow'
import { cn } from '@/lib/utils'

const transitionVariants = {
    item: {
        hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
        visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { type: 'spring', bounce: 0.3, duration: 1.5 } },
    },
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative pt-24 md:pt-36">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <AnimatedGroup variants={transitionVariants}>
            <Link
              href="/auth"
              className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
              <span className="text-foreground text-sm">Introducing AI-Powered Contact Search</span>
              <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
              <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                  <span className="flex size-6"><ArrowRight className="m-auto size-3" /></span>
                  <span className="flex size-6"><ArrowRight className="m-auto size-3" /></span>
                </div>
              </div>
            </Link>

            <h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl leading-tight md:text-7xl xl:text-[5.25rem] xl:leading-tight">
              The First <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">AI-Enabled</span> Personal CRM
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-relaxed">
              Transform your network into your greatest asset. Ask questions like “Who can help me with fundraising?” and get intelligent matches from your contacts powered by AI.
            </p>
          </AnimatedGroup>

          <div className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
            <Button asChild size="lg" className="rounded-xl px-5 text-base">
              <Link href="/auth"><span className="text-nowrap">Start Now!</span></Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-24">
        <AgaryFeatureSteps />
      </section>

      {/* CTA */}
      <CTASection title="Ready to get started?" action={{ text: 'Get Started', href: '/auth' }} className="mt-24" />
      <Footer
        logo={<Logo size="sm" />}
        brandName="Agary"
        socialLinks={[]}
        mainLinks={[{ href: '#features', label: 'Features' }]}
        legalLinks={[]}
        copyright={{ text: `© ${new Date().getFullYear()} Agary. All rights reserved.` }}
      />
    </main>
  )
}


