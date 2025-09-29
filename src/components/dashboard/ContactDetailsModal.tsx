'use client'

import { useEffect, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Edit3,
  X,
  Mail,
  Building,
  MapPin,
  Briefcase,
  Globe,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CandidateSelectionModal from './CandidateSelectionModal'

type ConfidenceLevel = 'low' | 'medium' | 'high' | string

interface Candidate {
  name: string
  current_position?: string
  company?: string
  location?: string
  linkedin_profile?: string
  profile_image_url?: string
  experience_summary?: string
  confidence: number
  confidence_level: 'high' | 'medium' | 'low'
  match_factors: string[]
  initials: string
  source?: string
  additional_info?: string
}

interface EnrichmentData {
  summary?: string
  enriched_at?: string
  person_summary?: {
    current_position?: string
    industry?: string
    location?: string
    experience_years?: string
    summary?: string
  }
  professional_background?: {
    current_company?: string
    education?: string
    previous_companies?: string[]
    skills_expertise?: string[]
    notable_achievements?: string[]
  }
  social_profiles?: Array<{
    platform?: string
    url?: string
    follower_count?: number | string
    short_summary?: string
    activity_summary?: string
    profile_image_url?: string
    verified?: string
    username?: string
  }>
  recent_activities?: Array<{
    type?: string
    date?: string
    description?: string
    source?: string
  }>
  websites_and_profiles?: Array<{
    type?: string
    url?: string
    title?: string
    description?: string
  }>
  additional_info?: {
    publications?: string[]
    certifications?: string[]
    awards?: string[]
    speaking_events?: string[]
  }
  confidence_score?: {
    confidence_level?: ConfidenceLevel
    overall_confidence?: number
    matching_factors?: string[]
    disambiguation_notes?: string
    verification_suggestions?: string
  }
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  location?: string
  company?: string
  linkedin_url?: string
  other_links?: string
  enrichment_data?: EnrichmentData
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
  const [currentContact, setCurrentContact] = useState(contact)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'enrichment' | 'activity'>('overview')
  const [firstName, setFirstName] = useState(contact.first_name)
  const [lastName, setLastName] = useState(contact.last_name)
  const [location, setLocation] = useState(contact.location || '')
  const [company, setCompany] = useState(contact.company || '')
  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedin_url || '')
  const [otherLinks, setOtherLinks] = useState(contact.other_links || '')
  const [notes, setNotes] = useState(contact.notes || '')
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [showCandidateSelection, setShowCandidateSelection] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidateMessage, setCandidateMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch fresh contact data
  const refreshContact = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contact.id)
        .single()

      if (error) throw error
      if (data) {
        setCurrentContact(data)
      }
    } catch (error) {
      console.error('Error refreshing contact:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          location: location.trim() || null,
          company: company.trim() || null,
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
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichContact = async (selectedCandidate?: Candidate, skipCandidateSelection = false) => {
    setEnriching(true)
    setError(null)

    try {
      const response = await fetch('/api/enrich-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: contact.id,
          selectedCandidate,
          skipCandidateSelection,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success && data.requiresCandidateSelection) {
        // Show candidate selection modal
        setCandidates(data.candidates || [])
        setCandidateMessage(data.message || 'Multiple potential matches found.')
        setShowCandidateSelection(true)
        return
      }

      if (!data.success) {
        throw new Error(data.error || 'Enrichment failed')
      }

      // Successful enrichment - refresh the contact data
      await refreshContact()
      onUpdate()
    } catch (error) {
      console.error('Error enriching contact:', error)
      setError(error instanceof Error ? error.message : 'Failed to enrich contact. Please try again.')
    } finally {
      setEnriching(false)
    }
  }

  const handleCandidateSelect = async (candidate: Candidate) => {
    setShowCandidateSelection(false)
    setCandidates([])
    setCandidateMessage('')

    // Start enrichment with selected candidate
    await handleEnrichContact(candidate, false)
  }

  const handleCandidateSkip = async () => {
    setShowCandidateSelection(false)
    setCandidates([])
    setCandidateMessage('')

    // Skip candidate selection and do basic enrichment
    await handleEnrichContact(undefined, true)
  }

  const handleCandidateCancel = () => {
    setShowCandidateSelection(false)
    setCandidates([])
    setCandidateMessage('')
    setEnriching(false)
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

  // Reset scroll position of the current tab content to top on tab change
  useEffect(() => {
    const container = document.getElementById(`tab-${activeTab}`)
    if (container) {
      container.scrollTop = 0
    }
  }, [activeTab])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-[90vw] sm:max-w-[90vw] md:max-w-[1000px] lg:max-w-[1100px] h-[85vh] overflow-hidden p-0 rounded-xl">
        {/* Header Section */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                  {currentContact.first_name} {currentContact.last_name}
                </DialogTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Added {new Date(contact.created_at).toLocaleDateString()}</span>
                  </div>
                  {contact.updated_at !== contact.created_at && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated {new Date(contact.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentContact.enrichment_data && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={loading}
                size="sm"
                className="flex items-center space-x-2"
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 min-h-0 flex flex-col">
            <div className="px-6 pt-4 pb-2">
              <TabsList className="w-full h-10 whitespace-nowrap">
                <TabsTrigger value="overview" className="flex-1 flex items-center justify-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 flex items-center justify-center space-x-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>Notes</span>
                </TabsTrigger>
                <TabsTrigger value="enrichment" className="flex-1 flex items-center justify-center space-x-2 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>AI Data</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1 flex items-center justify-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Activity</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 min-h-0 overflow-hidden">
              <div id="tab-overview" className="h-full min-h-[60vh] px-6 pb-6 overflow-y-scroll" style={{ scrollbarGutter: 'stable' }}>
                <div className="space-y-6 pb-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Basic Information */}
                <Card className="h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <div className="space-y-2">
                            <Label htmlFor="edit-company">Company</Label>
                            <Input
                              id="edit-company"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="ExampleTech AG"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                              id="edit-location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="City, Country"
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
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Full Name</p>
                              <p className="text-gray-700">{currentContact.first_name} {currentContact.last_name}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Building className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Company</p>
                              <p className="text-gray-700">{currentContact.company || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Location</p>
                              <p className="text-gray-700">{currentContact.location || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <ExternalLink className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">LinkedIn Profile</p>
                              {currentContact.linkedin_url ? (
                                <a
                                  href={currentContact.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all inline-flex items-center"
                                >
                                  View LinkedIn Profile
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              ) : (
                                <p className="text-gray-700">—</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {currentContact.other_links && parseOtherLinks(currentContact.other_links).length > 0 && (
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <LinkIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 mb-2">Other Links</p>
                              <div className="flex flex-wrap gap-2">
                                {parseOtherLinks(currentContact.other_links).map((link, index) => (
                                  <Badge key={index} variant="outline" className="text-xs max-w-[280px] truncate" title={link}>
                                    {link}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="flex-1 min-h-0 overflow-hidden">
              <div id="tab-notes" className="h-full min-h-[60vh] px-6 pb-6 overflow-y-scroll" style={{ scrollbarGutter: 'stable' }}>
                <div className="space-y-6 pb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span>Personal Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea
                        id="edit-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this contact..."
                        rows={8}
                        className="min-h-[200px]"
                      />
                    </div>
                  ) : contact.notes ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {contact.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No notes yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Add Notes</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voice Notes */}
              {contact.voice_notes && contact.voice_notes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mic className="h-5 w-5 text-red-600" />
                      <span>Voice Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contact.voice_notes.map((note, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                          <div className="flex items-center space-x-2 mb-2">
                            <Mic className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Voice Note {index + 1}</span>
                          </div>
                          <p className="text-gray-800">{note}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
                </div>
              </div>
            </TabsContent>

            {/* AI Enrichment Tab */}
            <TabsContent value="enrichment" className="flex-1 min-h-0 overflow-hidden">
              <div id="tab-enrichment" className="h-full min-h-[60vh] px-6 pb-6 overflow-y-scroll" style={{ scrollbarGutter: 'stable' }}>
                <div className="space-y-6 pb-6">
              {currentContact.enrichment_data ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2 text-purple-700">
                        <Sparkles className="h-5 w-5" />
                        <span>AI-Enhanced Professional Profile</span>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnrichContact}
                        disabled={enriching}
                        className="flex items-center space-x-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>{enriching ? 'Refreshing...' : 'Refresh Data'}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Confidence Score */}
                    {currentContact.enrichment_data.confidence_score && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Person Identification Confidence</span>
                        </h4>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              currentContact.enrichment_data.confidence_score.confidence_level === 'high'
                                ? 'bg-green-100 text-green-800'
                                : currentContact.enrichment_data.confidence_score.confidence_level === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {currentContact.enrichment_data.confidence_score.confidence_level?.toUpperCase() || 'UNKNOWN'}
                            </div>
                            <span className="text-lg font-semibold text-gray-900">
                              {currentContact.enrichment_data.confidence_score.overall_confidence}%
                            </span>
                          </div>
                          {(currentContact.enrichment_data.confidence_score.confidence_level === 'low' ||
                            currentContact.enrichment_data.confidence_score.confidence_level === 'medium') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEnrichContact}
                                disabled={enriching}
                                className="text-orange-600 hover:text-orange-800"
                              >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Re-verify
                            </Button>
                          )}
                        </div>

                        {currentContact.enrichment_data.confidence_score.matching_factors &&
                         currentContact.enrichment_data.confidence_score.matching_factors.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">Matching Factors:</p>
                            <div className="flex flex-wrap gap-1">
                              {currentContact.enrichment_data.confidence_score.matching_factors.map((factor, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">{factor}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {currentContact.enrichment_data.confidence_score.disambiguation_notes &&
                         currentContact.enrichment_data.confidence_score.disambiguation_notes !== 'Confidence scoring not available' && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">Disambiguation Notes:</p>
                            <p className="text-sm text-gray-700">{currentContact.enrichment_data.confidence_score.disambiguation_notes}</p>
                          </div>
                        )}

                        {currentContact.enrichment_data.confidence_score.verification_suggestions &&
                         currentContact.enrichment_data.confidence_score.verification_suggestions !== 'Manual verification recommended' && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Verification Suggestions:</p>
                            <p className="text-sm text-gray-700">{currentContact.enrichment_data.confidence_score.verification_suggestions}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Person Summary */}
                    {currentContact.enrichment_data.person_summary ? (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>Professional Overview</span>
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {currentContact.enrichment_data.person_summary.current_position && (
                            <div>
                              <p className="font-medium text-gray-900 mb-1">Current Position</p>
                              <p className="text-gray-700">{currentContact.enrichment_data.person_summary.current_position}</p>
                            </div>
                          )}
                          {currentContact.enrichment_data.person_summary.industry && (
                            <div>
                              <p className="font-medium text-gray-900 mb-1">Industry</p>
                              <p className="text-gray-700">{currentContact.enrichment_data.person_summary.industry}</p>
                            </div>
                          )}
                          {currentContact.enrichment_data.person_summary.location && (
                            <div>
                              <p className="font-medium text-gray-900 mb-1">Location</p>
                              <p className="text-gray-700">{currentContact.enrichment_data.person_summary.location}</p>
                            </div>
                          )}
                          {currentContact.enrichment_data.person_summary.experience_years && (
                            <div>
                              <p className="font-medium text-gray-900 mb-1">Experience</p>
                              <p className="text-gray-700">{currentContact.enrichment_data.person_summary.experience_years}</p>
                            </div>
                          )}
                        </div>
                        {currentContact.enrichment_data.person_summary.summary && (
                          <div className="mt-4">
                            <p className="font-medium text-gray-900 mb-2">Professional Summary</p>
                            <p className="text-gray-700 leading-relaxed">{currentContact.enrichment_data.person_summary.summary}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                          <Building className="h-5 w-5" />
                          <span>Professional Summary</span>
                        </h4>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {currentContact.enrichment_data.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Professional Background */}
                    {currentContact.enrichment_data.professional_background && Object.keys(currentContact.enrichment_data.professional_background).length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
                        <h4 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
                          <Briefcase className="h-5 w-5" />
                          <span>Professional Background</span>
                        </h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            {currentContact.enrichment_data.professional_background.current_company && (
                              <div>
                                <p className="font-medium text-gray-900 mb-1">Current Company</p>
                                <p className="text-gray-700">{currentContact.enrichment_data.professional_background.current_company}</p>
                              </div>
                            )}
                            {currentContact.enrichment_data.professional_background.education && (
                              <div>
                                <p className="font-medium text-gray-900 mb-1">Education</p>
                                <p className="text-gray-700">{currentContact.enrichment_data.professional_background.education}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            {currentContact.enrichment_data.professional_background.previous_companies && currentContact.enrichment_data.professional_background.previous_companies.length > 0 && (
                              <div>
                                <p className="font-medium text-gray-900 mb-2">Previous Companies</p>
                                <div className="space-y-1">
                                  {currentContact.enrichment_data.professional_background.previous_companies.slice(0, 3).map((company, index) => (
                                    <Badge key={index} variant="outline" className="mr-2 mb-1">{company}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {currentContact.enrichment_data.professional_background.skills_expertise && currentContact.enrichment_data.professional_background.skills_expertise.length > 0 && (
                              <div>
                                <p className="font-medium text-gray-900 mb-2">Skills & Expertise</p>
                                <div className="flex flex-wrap gap-1">
                                  {currentContact.enrichment_data.professional_background.skills_expertise.slice(0, 5).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {currentContact.enrichment_data.professional_background.notable_achievements && currentContact.enrichment_data.professional_background.notable_achievements.length > 0 && (
                          <div className="mt-4">
                            <p className="font-medium text-gray-900 mb-2">Notable Achievements</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                              {currentContact.enrichment_data.professional_background.notable_achievements.slice(0, 3).map((achievement, index) => (
                                <li key={index} className="text-sm">{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social Profiles */}
                    {currentContact.enrichment_data.social_profiles && currentContact.enrichment_data.social_profiles.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                          <LinkIcon className="h-5 w-5" />
                          <span>Social Profiles</span>
                        </h4>
                        <div className="space-y-4">
                          {currentContact.enrichment_data.social_profiles.map((profile, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    {profile.profile_image_url ? (
                                      <AvatarImage src={profile.profile_image_url} alt={`${profile.platform} profile`} />
                                    ) : null}
                                    <AvatarFallback>{(profile.platform || 'P').charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-blue-900">{profile.platform}</span>
                                      {profile.verified === 'true' && (
                                        <Badge variant="secondary" className="text-xs">
                                          ✓ Verified
                                        </Badge>
                                      )}
                                    </div>
                                    {profile.username && (
                                      <p className="text-xs text-gray-500">@{profile.username}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {profile.follower_count && (
                                    <Badge variant="outline" className="text-xs">
                                      {profile.follower_count} followers
                                    </Badge>
                                  )}
                                  {profile.url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(profile.url, '_blank')}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Visit
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {(profile.short_summary || profile.activity_summary) && (
                                <p className="text-gray-600 text-sm">{profile.short_summary || profile.activity_summary}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Websites and Profiles */}
                    {currentContact.enrichment_data.websites_and_profiles && currentContact.enrichment_data.websites_and_profiles.length > 0 && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center space-x-2">
                          <Globe className="h-5 w-5" />
                          <span>Websites & Online Presence</span>
                        </h4>
                        <div className="space-y-4">
                          {currentContact.enrichment_data.websites_and_profiles.map((site, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-indigo-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge variant="outline" className="text-xs capitalize">{site.type}</Badge>
                                    {site.title && (
                                      <span className="font-medium text-indigo-900">{site.title}</span>
                                    )}
                                  </div>
                                  {site.description && (
                                    <p className="text-gray-600 text-sm">{site.description}</p>
                                  )}
                                </div>
                                {site.url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(site.url, '_blank')}
                                    className="text-indigo-600 hover:text-indigo-800 ml-4"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Visit
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Activities */}
                    {currentContact.enrichment_data.recent_activities && currentContact.enrichment_data.recent_activities.length > 0 && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
                        <h4 className="font-semibold text-orange-900 mb-4 flex items-center space-x-2">
                          <Calendar className="h-5 w-5" />
                          <span>Recent Activities</span>
                        </h4>
                        <div className="space-y-3">
                          {currentContact.enrichment_data.recent_activities.slice(0, 4).map((activity, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="text-xs capitalize">{activity.type}</Badge>
                                {activity.date && (
                                  <span className="text-xs text-gray-500">{activity.date}</span>
                                )}
                              </div>
                              <p className="text-gray-700 text-sm mb-1">{activity.description}</p>
                              {activity.source && (
                                <p className="text-xs text-gray-500">Source: {activity.source}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    {currentContact.enrichment_data.additional_info && Object.values(currentContact.enrichment_data.additional_info).some(arr => Array.isArray(arr) && arr.length > 0) && (
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <span>Additional Information</span>
                        </h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          {currentContact.enrichment_data.additional_info.publications && currentContact.enrichment_data.additional_info.publications.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-900 mb-2">Publications</p>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {currentContact.enrichment_data.additional_info.publications.slice(0, 3).map((pub, index) => (
                                  <li key={index} className="truncate">{pub}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentContact.enrichment_data.additional_info.certifications && currentContact.enrichment_data.additional_info.certifications.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-900 mb-2">Certifications</p>
                              <div className="flex flex-wrap gap-1">
                                {currentContact.enrichment_data.additional_info.certifications.slice(0, 4).map((cert, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">{cert}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {currentContact.enrichment_data.additional_info.awards && currentContact.enrichment_data.additional_info.awards.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-900 mb-2">Awards</p>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {currentContact.enrichment_data.additional_info.awards.slice(0, 3).map((award, index) => (
                                  <li key={index} className="truncate">{award}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentContact.enrichment_data.additional_info.speaking_events && currentContact.enrichment_data.additional_info.speaking_events.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-900 mb-2">Speaking Events</p>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {currentContact.enrichment_data.additional_info.speaking_events.slice(0, 3).map((event, index) => (
                                  <li key={index} className="truncate">{event}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {currentContact.enrichment_data.enriched_at && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Last enriched: {new Date(currentContact.enrichment_data.enriched_at).toLocaleString()}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Powered by Perplexity AI
                          </Badge>
                        </div>


                        {currentContact.enrichment_data.enriched_at && (
                          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="flex items-center space-x-1">
                              <Sparkles className="h-3 w-3" />
                              <span>Profile enhanced on {new Date(currentContact.enrichment_data.enriched_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Enhance with AI</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Get detailed professional information, current role, achievements, and background using AI-powered research.
                    </p>
                    <Button
                      onClick={() => handleEnrichContact()}
                      disabled={enriching}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {enriching ? 'Enriching Contact...' : 'Enrich with AI'}
                    </Button>

                    {error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Enrichment Error</p>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setError(null)}
                              className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="flex-1 min-h-0 overflow-hidden">
              <div id="tab-activity" className="h-full min-h-[60vh] px-6 pb-6 overflow-y-scroll" style={{ scrollbarGutter: 'stable' }}>
                <div className="space-y-6 pb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Activity Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Contact Created</p>
                        <p className="text-sm text-gray-600">{formatDate(contact.created_at)}</p>
                      </div>
                    </div>

                    {contact.updated_at !== contact.created_at && (
                      <div className="flex items-start space-x-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">Contact Updated</p>
                          <p className="text-sm text-gray-600">{formatDate(contact.updated_at)}</p>
                        </div>
                      </div>
                    )}

                    {currentContact.enrichment_data?.enriched_at && (
                      <div className="flex items-start space-x-4">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">AI Enhancement</p>
                          <p className="text-sm text-gray-600">
                            {new Date(currentContact.enrichment_data.enriched_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        {isEditing && (
          <div className="sticky bottom-0 bg-white border-t p-4">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                size="sm"
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
              <Button onClick={handleSave} disabled={loading} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* Candidate Selection Modal */}
        <CandidateSelectionModal
          candidates={candidates}
          contactName={`${currentContact.first_name} ${currentContact.last_name}`}
          isOpen={showCandidateSelection}
          onSelect={handleCandidateSelect}
          onSkip={handleCandidateSkip}
          onCancel={handleCandidateCancel}
          loading={enriching}
          message={candidateMessage}
        />
      </DialogContent>
    </Dialog>
  )
}