'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ExternalLink,
  Save,
  Calendar,
  MessageSquare,
  Mic,
  Sparkles,
  Clock,
  User,
  Link as LinkIcon,
  FileText,
  Edit3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  first_name: string
  last_name: string
  linkedin_url?: string
  other_links?: string
  enrichment_data?: any
  notes?: string
  voice_notes?: string[]
  created_at: string
  updated_at: string
}

interface ContactDetailsModalProps {
  contact: Contact
  onClose: () => void
  onUpdate: () => void
}

export default function ContactDetailsModal({ contact, onClose, onUpdate }: ContactDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(contact.first_name)
  const [lastName, setLastName] = useState(contact.last_name)
  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedin_url || '')
  const [otherLinks, setOtherLinks] = useState(contact.other_links || '')
  const [notes, setNotes] = useState(contact.notes || '')
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)

  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          linkedin_url: linkedinUrl.trim() || null,
          other_links: otherLinks.trim() || null,
          notes: notes.trim() || null,
        })
        .eq('id', contact.id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Failed to update contact')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichContact = async () => {
    setEnriching(true)
    try {
      const response = await fetch('/api/enrich-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: contact.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enrich contact')
      }

      const data = await response.json()

      // Refresh the contact data
      onUpdate()

      alert('Contact enriched successfully!')
    } catch (error) {
      console.error('Error enriching contact:', error)
      alert('Failed to enrich contact. Please try again.')
    } finally {
      setEnriching(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const parseOtherLinks = (links: string) => {
    if (!links) return []
    return links.split(',').map(link => link.trim()).filter(link => link)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                {getInitials(contact.first_name, contact.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">
                {contact.first_name} {contact.last_name}
              </DialogTitle>
              <DialogDescription className="flex items-center space-x-4 mt-1">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Added {formatDate(contact.created_at)}</span>
                </span>
                {contact.updated_at !== contact.created_at && (
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatDate(contact.updated_at)}</span>
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={loading}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save'}
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName">First Name</Label>
                        <Input
                          id="edit-firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-lastName">Last Name</Label>
                        <Input
                          id="edit-lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
                      <Input
                        id="edit-linkedin"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-links">Other Links</Label>
                      <Input
                        id="edit-links"
                        value={otherLinks}
                        onChange={(e) => setOtherLinks(e.target.value)}
                        placeholder="Twitter, website, etc. (comma separated)"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <p className="text-lg">{contact.first_name} {contact.last_name}</p>
                      </div>

                      {contact.linkedin_url && (
                        <div>
                          <Label className="text-sm font-medium">LinkedIn</Label>
                          <div className="flex items-center space-x-2">
                            <a
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>View LinkedIn Profile</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {contact.other_links && parseOtherLinks(contact.other_links).length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Other Links</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {parseOtherLinks(contact.other_links).map((link, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {link}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this contact..."
                    rows={6}
                  />
                ) : contact.notes ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No notes yet</p>
                )}
              </CardContent>
            </Card>

            {/* Voice Notes */}
            {contact.voice_notes && contact.voice_notes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="h-5 w-5" />
                    <span>Voice Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contact.voice_notes.map((note, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Enrichment */}
            {contact.enrichment_data ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-purple-600">
                      <Sparkles className="h-5 w-5" />
                      <span>AI Enhanced</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEnrichContact}
                      disabled={enriching}
                    >
                      {enriching ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Professional Summary</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {contact.enrichment_data.summary}
                    </p>
                  </div>
                  {contact.enrichment_data.enriched_at && (
                    <div className="text-xs text-gray-500">
                      Last enriched: {new Date(contact.enrichment_data.enriched_at).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>AI Enrichment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">
                      Enhance this contact with AI-powered data from Perplexity
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleEnrichContact}
                      disabled={enriching}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {enriching ? 'Enriching...' : 'Enrich Contact'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Added:</span>
                  <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{new Date(contact.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Has Notes:</span>
                  <span>{contact.notes ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Voice Notes:</span>
                  <span>{contact.voice_notes?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                // Reset form
                setFirstName(contact.first_name)
                setLastName(contact.last_name)
                setLinkedinUrl(contact.linkedin_url || '')
                setOtherLinks(contact.other_links || '')
                setNotes(contact.notes || '')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}