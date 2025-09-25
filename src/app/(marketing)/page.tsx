import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const primaryHref = user ? '/' : '/auth'

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">Agary</h1>
        <p className="mt-4 text-lg text-gray-600">AI-powered networking CRM. Enrich contacts. Ask your network. Get intros faster.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={primaryHref}>
            <Button size="lg" className="px-6">{user ? 'Open App' : 'Get Started'}</Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg" className="px-6">Log in</Button>
          </Link>
        </div>
      </section>
    </main>
  )
}


