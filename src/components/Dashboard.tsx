'use client'

import ContactsList from '@/components/contacts/ContactsList'
import AddContactForm from '@/components/contacts/AddContactForm'
import SearchBar from '@/components/contacts/SearchBar'
import AIAssistant from '@/components/AIAssistant'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Agary</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, {user.email}
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <SearchBar />
          <AddContactForm />
          <ContactsList />
        </div>
      </main>

      <AIAssistant />
    </div>
  )
}