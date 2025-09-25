'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  ExternalLink,
  MessageSquare,
  Star,
  Edit,
  Trash2,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ContactDetailsModal from './ContactDetailsModal'

interface EnrichmentData {
  enriched_at?: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  linkedin_url?: string
  other_links?: string
  enrichment_data?: EnrichmentData
  notes?: string
  voice_notes?: string[]
  created_at: string
  updated_at: string
}

interface ContactsGridProps {
  searchQuery: string
  filter: 'all' | 'recent' | 'starred'
}

export default function ContactsGrid({ searchQuery, filter }: ContactsGridProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [enrichingContacts, setEnrichingContacts] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [filter])

  useEffect(() => {
    if (searchQuery) {
      filterContacts()
    } else {
      fetchContacts()
    }
  }, [searchQuery])

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      switch (filter) {
        case 'recent':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          query = query.gte('created_at', weekAgo.toISOString())
          break
        case 'starred':
          // For now, show contacts with notes (we'll implement starring later)
          query = query.not('notes', 'is', null)
          break
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterContacts = async () => {
    if (!searchQuery.trim()) {
      fetchContacts()
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error searching contacts:', error)
    }
  }

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      setContacts(contacts.filter(c => c.id !== contactId))
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    }
  }

  const enrichContact = async (contactId: string) => {
    setEnrichingContacts(prev => new Set(prev).add(contactId))

    try {
      const response = await fetch('/api/enrich-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enrich contact')
      }

      // Refresh contacts to show updated data
      await fetchContacts()

    } catch (error) {
      console.error('Error enriching contact:', error)
    } finally {
      setEnrichingContacts(prev => {
        const newSet = new Set(prev)
        newSet.delete(contactId)
        return newSet
      })
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getContactBadges = (contact: Contact) => {
    const badges = []

    if (contact.enrichment_data) {
      // Add confidence badge if available
      if (contact.enrichment_data.confidence_score?.confidence_level) {
        const confidenceLevel = contact.enrichment_data.confidence_score.confidence_level
        badges.push({
          text: `AI ${confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Confidence`,
          variant: confidenceLevel === 'high' ? 'default' as const :
                   confidenceLevel === 'medium' ? 'secondary' as const :
                   'destructive' as const
        })
      } else {
        badges.push({ text: 'AI Enhanced', variant: 'default' as const })
      }
    }

    if (contact.linkedin_url) {
      badges.push({ text: 'LinkedIn', variant: 'secondary' as const })
    }

    if (contact.notes) {
      badges.push({ text: 'Notes', variant: 'outline' as const })
    }

    if (contact.voice_notes?.length) {
      badges.push({ text: 'Voice Notes', variant: 'outline' as const })
    }

    return badges
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">
            {searchQuery
              ? `No contacts found for "${searchQuery}"`
              : 'No contacts yet. Add your first contact to get started!'
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => {
          const badges = getContactBadges(contact)

          return (
            <Card
              key={contact.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md"
              onClick={() => setSelectedContact(contact)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {getInitials(contact.first_name, contact.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Added {formatDate(contact.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setSelectedContact(contact)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {contact.linkedin_url && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          window.open(contact.linkedin_url, '_blank')
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open LinkedIn
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          enrichContact(contact.id)
                        }}
                        disabled={enrichingContacts.has(contact.id)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {enrichingContacts.has(contact.id) ? 'Enriching...' :
                         contact.enrichment_data ? 'Refresh Data' : 'Enrich Contact'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteContact(contact.id)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {/* Badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {badges.map((badge, index) => (
                      <Badge key={index} variant={badge.variant} className="text-xs">
                        {badge.text}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Notes Preview */}
                {contact.notes && (
                  <div className="bg-gray-50 rounded-md p-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {contact.notes}
                    </p>
                  </div>
                )}

                {/* Enrichment Data Preview */}
                {contact.enrichment_data && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      <span>AI Enhanced Profile</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-1">
                    {contact.linkedin_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(contact.linkedin_url, '_blank')
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        LinkedIn
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedContact(contact)
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onUpdate={fetchContacts}
        />
      )}
    </>
  )
}