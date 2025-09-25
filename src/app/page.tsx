import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsList from '@/components/contacts/ContactsList'
import AddContactForm from '@/components/contacts/AddContactForm'
import SearchBar from '@/components/contacts/SearchBar'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">NetworkAI</h1>
            <div className="text-sm text-gray-500">
              Welcome, {user.email}
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
    </div>
  )
}
