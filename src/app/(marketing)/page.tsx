import { createClient } from '@/lib/supabase/server'
import MarketingLanding from '@/components/LandingPage'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <MarketingLanding />
}


