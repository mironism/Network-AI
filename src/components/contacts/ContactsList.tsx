'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  first_name: string
  last_name: string
  linkedin_url?: string
  other_links?: string
  enrichment_data?: any
  created_at: string
}

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading contacts...</div>
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No contacts yet. Add your first contact above!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Contacts ({contacts.length})</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {contact.first_name} {contact.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.linkedin_url && (
                <div>
                  <Badge variant="secondary">LinkedIn</Badge>
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm ml-2"
                  >
                    View Profile
                  </a>
                </div>
              )}
              {contact.other_links && (
                <div>
                  <Badge variant="outline">Other Links</Badge>
                  <p className="text-sm text-gray-600 mt-1">{contact.other_links}</p>
                </div>
              )}
              {contact.enrichment_data && (
                <div>
                  <Badge variant="default">AI Enriched</Badge>
                </div>
              )}
              <p className="text-xs text-gray-400">
                Added {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}