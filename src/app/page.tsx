import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CRMDashboard from '@/components/dashboard/CRMDashboard'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return <CRMDashboard user={user} />
}
