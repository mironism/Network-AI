'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  ExternalLink,
  User,
  Building,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react'

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

interface CandidateSelectionModalProps {
  candidates: Candidate[]
  contactName: string
  isOpen: boolean
  onSelect: (candidate: Candidate) => void
  onSkip: () => void
  onCancel: () => void
  loading?: boolean
  message?: string
}

const getConfidenceColor = (level: string, score: number) => {
  if (level === 'high' || score >= 80) return 'text-green-600 bg-green-100'
  if (level === 'medium' || score >= 60) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
}

const getConfidenceIcon = (level: string, score: number) => {
  if (level === 'high' || score >= 80) return CheckCircle2
  if (level === 'medium' || score >= 60) return AlertCircle
  return XCircle
}

export default function CandidateSelectionModal({
  candidates,
  contactName,
  isOpen,
  onSelect,
  onSkip,
  onCancel,
  loading = false,
  message
}: CandidateSelectionModalProps) {
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelect = async (candidate: Candidate) => {
    setIsProcessing(true)
    try {
      await onSelect(candidate)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkip = async () => {
    setIsProcessing(true)
    try {
      await onSkip()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Select the Correct Person</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            {message || `We found multiple people matching "${contactName}". Please select the correct person:`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
          <div className="space-y-4">
            {candidates.map((candidate, index) => {
              const ConfidenceIcon = getConfidenceIcon(candidate.confidence_level, candidate.confidence)
              const isSelected = selectedCandidateIndex === index

              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCandidateIndex(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <Avatar className="w-16 h-16 flex-shrink-0">
                        <AvatarImage
                          src={candidate.profile_image_url}
                          alt={`${candidate.name} profile`}
                        />
                        <AvatarFallback className="text-lg font-semibold">
                          {candidate.initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {candidate.name}
                            </h3>
                            {candidate.current_position && (
                              <p className="text-sm text-gray-600 flex items-center mb-1">
                                <Building className="h-4 w-4 mr-1" />
                                {candidate.current_position}
                              </p>
                            )}
                            {candidate.location && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {candidate.location}
                              </p>
                            )}
                          </div>

                          {/* Confidence Score */}
                          <div className="flex flex-col items-end space-y-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getConfidenceColor(candidate.confidence_level, candidate.confidence)}`}>
                              <ConfidenceIcon className="h-3 w-3" />
                              <span>{candidate.confidence}% match</span>
                            </div>
                            {candidate.linkedin_profile && (
                              <Badge variant="secondary" className="text-xs">
                                LinkedIn verified
                              </Badge>
                            )}
                            {candidate.source && (
                              <Badge variant="outline" className="text-xs">
                                {candidate.source}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Experience Summary */}
                        {candidate.experience_summary && (
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {candidate.experience_summary}
                          </p>
                        )}

                        {/* Additional Info */}
                        {candidate.additional_info && (
                          <p className="text-xs text-gray-600 mb-3 bg-gray-50 rounded p-2">
                            {candidate.additional_info}
                          </p>
                        )}

                        {/* Match Factors */}
                        {candidate.match_factors && candidate.match_factors.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Match Factors:</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.match_factors.map((factor, factorIndex) => (
                                <Badge key={factorIndex} variant="secondary" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            {candidate.linkedin_profile && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(candidate.linkedin_profile, '_blank', 'noopener,noreferrer')
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View LinkedIn
                              </Button>
                            )}
                          </div>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelect(candidate)
                            }}
                            disabled={isProcessing}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {isProcessing ? 'Processing...' : 'Select This Person'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {candidates.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No potential matches found.</p>
              <p className="text-sm text-gray-400">
                Try enriching with different information or skip this step.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {candidates.length > 0 && (
                <>
                  Found {candidates.length} potential match{candidates.length !== 1 ? 'es' : ''}
                  {selectedCandidateIndex !== null && (
                    <span className="ml-2 text-blue-600 font-medium">
                      • {candidates[selectedCandidateIndex].name} selected
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isProcessing}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isProcessing}
                size="sm"
              >
                {isProcessing ? 'Processing...' : 'None of These Match'}
              </Button>

              {selectedCandidateIndex !== null && (
                <Button
                  onClick={() => handleSelect(candidates[selectedCandidateIndex])}
                  disabled={isProcessing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isProcessing ? 'Processing...' : 'Confirm Selection'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}