'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus } from 'lucide-react'

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

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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