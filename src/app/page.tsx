import { createClient } from '@/lib/supabase/server'
import CRMDashboard from '@/components/dashboard/CRMDashboard'
import MarketingLanding from '@/components/landing/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <MarketingLanding />
  }

  return <CRMDashboard user={user} />
}
