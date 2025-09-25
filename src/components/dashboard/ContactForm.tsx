'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Users, AlertTriangle } from 'lucide-react'

interface Contact {
  id: string
  first_name: string
  last_name: string
  linkedin_url?: string
  other_links?: string
  notes?: string
  created_at: string
}

interface ContactFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function ContactForm({ onSuccess, onCancel }: ContactFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [otherLinks, setOtherLinks] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [duplicates, setDuplicates] = useState<Contact[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  const supabase = createClient()

  // Check for potential duplicates
  const checkForDuplicates = async (firstName: string, lastName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .or(`first_name.ilike.${firstName.trim()},last_name.ilike.${lastName.trim()}`)

      if (error) throw error

      // Filter for close matches
      return data?.filter(contact => {
        const firstMatch = contact.first_name.toLowerCase() === firstName.toLowerCase()
        const lastMatch = contact.last_name.toLowerCase() === lastName.toLowerCase()
        return firstMatch && lastMatch
      }) || []
    } catch (error) {
      console.error('Error checking duplicates:', error)
      return []
    }
  }

  // Merge contact with existing one
  const mergeWithExisting = async (existingContact: Contact) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Merge data - preserve existing data but add new info
      const mergedData = {
        linkedin_url: linkedinUrl.trim() || existingContact.linkedin_url || null,
        other_links: [existingContact.other_links, otherLinks.trim()]
          .filter(Boolean)
          .join(', ') || null,
        notes: [existingContact.notes, notes.trim()]
          .filter(Boolean)
          .join('\n\n---\n\n') || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('contacts')
        .update(mergedData)
        .eq('id', existingContact.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Reset form
      setFirstName('')
      setLastName('')
      setLinkedinUrl('')
      setOtherLinks('')
      setNotes('')
      setDuplicates([])
      setShowDuplicateWarning(false)

      onSuccess()
    } catch (error) {
      console.error('Error merging contact:', error)
      alert((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check for duplicates first
      const potentialDuplicates = await checkForDuplicates(firstName, lastName)

      if (potentialDuplicates.length > 0) {
        setDuplicates(potentialDuplicates)
        setShowDuplicateWarning(true)
        setLoading(false)
        return
      }

      // No duplicates, proceed with adding
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('contacts')
        .insert([
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            linkedin_url: linkedinUrl.trim() || null,
            other_links: otherLinks.trim() || null,
            notes: notes.trim() || null,
            user_id: user.id,
          }
        ])

      if (error) throw error

      // Reset form
      setFirstName('')
      setLastName('')
      setLinkedinUrl('')
      setOtherLinks('')
      setNotes('')

      onSuccess()
    } catch (error) {
      console.error('Error adding contact:', error)
      alert((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const addAnyway = async () => {
    setLoading(true)
    setShowDuplicateWarning(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('contacts')
        .insert([
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            linkedin_url: linkedinUrl.trim() || null,
            other_links: otherLinks.trim() || null,
            notes: notes.trim() || null,
            user_id: user.id,
          }
        ])

      if (error) throw error

      // Reset form
      setFirstName('')
      setLastName('')
      setLinkedinUrl('')
      setOtherLinks('')
      setNotes('')
      setDuplicates([])

      onSuccess()
    } catch (error) {
      console.error('Error adding contact:', error)
      alert((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add New Contact</span>
        </SheetTitle>
        <SheetDescription>
          Add a new contact to your network. AI enrichment will happen automatically.
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="John"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/johndoe"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherLinks">Other Links</Label>
          <Input
            id="otherLinks"
            placeholder="Twitter, website, etc. (comma separated)"
            value={otherLinks}
            onChange={(e) => setOtherLinks(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Meeting notes, context, or any other information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Duplicate Warning */}
        {showDuplicateWarning && duplicates.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-orange-800">
                  Found {duplicates.length} existing contact{duplicates.length > 1 ? 's' : ''} with the same name:
                </p>

                <div className="space-y-2">
                  {duplicates.map((duplicate, index) => (
                    <div key={duplicate.id} className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{duplicate.first_name} {duplicate.last_name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {duplicate.linkedin_url && (
                              <Badge variant="secondary" className="text-xs">LinkedIn</Badge>
                            )}
                            {duplicate.other_links && (
                              <Badge variant="outline" className="text-xs">Other Links</Badge>
                            )}
                            {duplicate.notes && (
                              <Badge variant="outline" className="text-xs">Has Notes</Badge>
                            )}
                            <span>Added {new Date(duplicate.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mergeWithExisting(duplicate)}
                          disabled={loading}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Merge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-sm text-orange-700">
                    Choose to merge with an existing contact or add as separate entry.
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDuplicateWarning(false)
                        setDuplicates([])
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addAnyway}
                      disabled={loading}
                    >
                      Add Separately
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Contact'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}