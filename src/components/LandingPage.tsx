'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Bot, Users, Search, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { AgaryFeatureSteps } from '@/components/ui/feature-section'
import VerticalTestimonials from '@/components/ui/testimonials-vertical'
import { Footer } from '@/components/ui/footer'
import { CTASection } from '@/components/ui/cta-with-glow'
import { Logo } from '@/components/ui/logo'
import { Twitter, Linkedin, Github } from 'lucide-react'
import { cn } from '@/lib/utils'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function LandingPage() {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
      const handleScroll = () => {
          setIsScrolled(window.scrollY > 50)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Header */}
      <header>
          <nav
              data-state={menuState && 'active'}
              className="fixed z-20 w-full px-2 group">
              <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                  <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                      <div className="flex w-full justify-between lg:w-auto">
                          <Link
                              href="/"
                              aria-label="home"
                              className="flex items-center space-x-2">
                              <Logo size="md" />
                              <span className="text-2xl font-bold text-gray-900">Agary</span>
                          </Link>
                      </div>

                      <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                          <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                              <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className={cn(isScrolled && 'lg:hidden')}>
                                  <Link href="/auth">
                                      <span>Sign In</span>
                                  </Link>
                              </Button>
                              <Button
                                  asChild
                                  size="sm"
                                  className={cn(isScrolled && 'lg:hidden')}>
                                  <Link href="/auth">
                                      <span>Get Started</span>
                                  </Link>
                              </Button>
                              <Button
                                  asChild
                                  size="sm"
                                  className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                  <Link href="/auth">
                                      <span>Get Started</span>
                                  </Link>
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          </nav>
      </header>

      <main className="overflow-hidden">
          <div
              aria-hidden
              className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
              <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
              <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
              <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
          </div>

          {/* Hero Section */}
          <section>
              <div className="relative pt-24 md:pt-36">
                  <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                  <div className="mx-auto max-w-7xl px-6">
                      <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                          <AnimatedGroup variants={transitionVariants}>
                              <div className="flex justify-center mb-8">
                                  <img
                                      src="/accelerator.webp"
                                      alt="Accelerator"
                                      className="h-6 w-auto opacity-80"
                                  />
                              </div>

                              <Link
                                  href="/auth"
                                  className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                                  <span className="text-foreground text-sm">Introducing AI-Powered Contact Search</span>
                                  <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                                  <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                          <span className="flex size-6">
                                              <ArrowRight className="m-auto size-3" />
                                          </span>
                                          <span className="flex size-6">
                                              <ArrowRight className="m-auto size-3" />
                                          </span>
                                      </div>
                                  </div>
                              </Link>

                              <h1
                                  className="mt-8 max-w-4xl mx-auto text-balance text-6xl leading-tight md:text-7xl lg:mt-16 xl:text-[5.25rem] xl:leading-tight">
                                  The First <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">AI-Enabled</span> Personal CRM
                              </h1>
                              <p
                                  className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-relaxed">
                                  Transform your network into your greatest asset. Ask questions like "Who can help me with fundraising?" and get intelligent matches from your contacts powered by AI.
                              </p>
                          </AnimatedGroup>

                          <AnimatedGroup
                              variants={{
                                  container: {
                                      visible: {
                                          transition: {
                                              staggerChildren: 0.05,
                                              delayChildren: 0.75,
                                          },
                                      },
                                  },
                                  ...transitionVariants,
                              }}
                              className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                              <div
                                  key={1}
                                  className="bg-foreground/10 rounded-[14px] border p-0.5">
                                  <Button
                                      asChild
                                      size="lg"
                                      className="rounded-xl px-5 text-base">
                                      <Link href="/auth">
                                          <span className="text-nowrap">Start Now!</span>
                                      </Link>
                                  </Button>
                              </div>
                              <Button
                                  key={2}
                                  asChild
                                  size="lg"
                                  variant="ghost"
                                  className="h-10.5 rounded-xl px-5">
                                  <Link href="#features">
                                      <span className="text-nowrap">Learn More</span>
                                  </Link>
                              </Button>
                          </AnimatedGroup>
                      </div>
                  </div>

                  <AnimatedGroup
                      variants={{
                          container: {
                              visible: {
                                  transition: {
                                      staggerChildren: 0.05,
                                      delayChildren: 0.75,
                                  },
                              },
                          },
                          ...transitionVariants,
                      }}>
                      <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                          <div
                              aria-hidden
                              className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                          />
                          <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                              <div className="relative rounded-2xl border border-gray-200 overflow-hidden">
                                  <img 
                                      src="/tool.png" 
                                      alt="Agary Dashboard - AI-powered contact management interface"
                                      className="w-full h-auto object-cover rounded-2xl"
                                  />
                              </div>
                          </div>
                      </div>
                  </AnimatedGroup>
              </div>
          </section>

          {/* Testimonials Section */}
          <VerticalTestimonials />

          {/* How it Works Section */}
            <section id="features" className="py-20">
              <AgaryFeatureSteps />
            </section>

          {/* Features Section */}
          {/* <section id="features" className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                          Your Network, Supercharged
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                          Stop scrolling through endless contact lists. Just ask what you need, and let AI find the right people.
                      </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="text-center pb-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <Search className="h-6 w-6 text-blue-600" />
                              </div>
                              <CardTitle className="text-xl">Smart Search</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                              <p className="text-gray-600">
                                  Ask natural questions like "Who knows about AI startups?" and get relevant contacts instantly.
                              </p>
                          </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="text-center pb-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <Bot className="h-6 w-6 text-purple-600" />
                              </div>
                              <CardTitle className="text-xl">AI Assistant</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                              <p className="text-gray-600">
                                  Your personal AI assistant lives in the corner of your screen, ready to help whenever you need it.
                              </p>
                          </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="text-center pb-4">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <Users className="h-6 w-6 text-green-600" />
                              </div>
                              <CardTitle className="text-xl">Rich Profiles</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                              <p className="text-gray-600">
                                  Automatically enriched contact profiles with skills, expertise, and background information.
                              </p>
                          </CardContent>
                      </Card>
                  </div>
              </div>
          </section> */}

          {/* Old CTA section removed in favor of new CTASection component */}
      </main>

      {/* Footer */}
      {/* CTA Section */}
      <CTASection
        title="Ready to transform your networking?"
        action={{
          text: "Start Building Your Network",
          href: "/auth",
          variant: "default"
        }}
        className="bg-gradient-to-b from-background to-muted/20"
      />

      <Footer
        logo={<Logo size="md" className="text-orange-500" />}
        brandName="Agary"
        socialLinks={[
          {
            icon: <Twitter className="h-5 w-5" />,
            href: "https://twitter.com",
            label: "Twitter",
          },
          {
            icon: <Linkedin className="h-5 w-5" />,
            href: "https://linkedin.com",
            label: "LinkedIn",
          },
          {
            icon: <Github className="h-5 w-5" />,
            href: "https://github.com",
            label: "GitHub",
          },
        ]}
        mainLinks={[
          { href: "#features", label: "Features" },
          { href: "/auth", label: "Sign Up" },
          { href: "#", label: "About" },
          { href: "#", label: "Contact" },
        ]}
        legalLinks={[
          { href: "#", label: "Privacy Policy" },
          { href: "#", label: "Terms of Service" },
        ]}
        copyright={{
          text: "© 2025 Agary",
          license: "Licensed by Pisspal",
        }}
      />
    </>
  )
}