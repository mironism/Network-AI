/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Enhanced matching algorithms
const normalizeValue = (value: string | null | undefined) => {
  if (!value || typeof value !== 'string') return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}

const generateNameVariations = (firstName: string, lastName: string) => {
  const variations = [
    `${firstName} ${lastName}`,
    `${lastName}, ${firstName}`,
    `${firstName.charAt(0)}. ${lastName}`,
    `${firstName} ${lastName.charAt(0)}.`,
    `${firstName.charAt(0)}${lastName.charAt(0)}`,
    firstName, // First name only
    lastName   // Last name only
  ]

  // Add common nicknames for first name
  const nicknames: Record<string, string[]> = {
    'michael': ['mike', 'mick', 'mickey'],
    'william': ['bill', 'will', 'billy'],
    'robert': ['bob', 'rob', 'bobby'],
    'richard': ['rick', 'dick', 'richie'],
    'james': ['jim', 'jimmy', 'jamie'],
    'christopher': ['chris', 'christy'],
    'daniel': ['dan', 'danny'],
    'matthew': ['matt', 'matty'],
    'anthony': ['tony'],
    'elizabeth': ['liz', 'beth', 'betty'],
    'jennifer': ['jen', 'jenny'],
    'michelle': ['shelly', 'mish'],
    'stephanie': ['steph', 'steffi']
  }

  const normalizedFirst = normalizeValue(firstName)
  if (nicknames[normalizedFirst]) {
    nicknames[normalizedFirst].forEach(nick => {
      variations.push(`${nick} ${lastName}`)
      variations.push(`${nick.charAt(0)}. ${lastName}`)
    })
  }

  return [...new Set(variations.filter(Boolean))]
}

const calculateNameSimilarity = (candidateName: string, inputName: string): number => {
  const candidate = normalizeValue(candidateName)
  const input = normalizeValue(inputName)

  if (!candidate || !input) return 0

  // Exact match
  if (candidate === input) return 30

  // Check if one contains the other
  if (candidate.includes(input) || input.includes(candidate)) return 25

  // Levenshtein distance
  const distance = levenshteinDistance(candidate, input)
  const maxLength = Math.max(candidate.length, input.length)
  const similarity = 1 - (distance / maxLength)

  return Math.round(similarity * 30)
}

const calculateCompanySimilarity = (candidateCompany: string, inputCompany: string): number => {
  if (!candidateCompany || !inputCompany) return 0

  const candidate = normalizeValue(candidateCompany)
  const input = normalizeValue(inputCompany)

  // Exact match
  if (candidate === input) return 25

  // Token-based matching for company names
  const candidateTokens = candidate.split(' ').filter(t => t.length > 2)
  const inputTokens = input.split(' ').filter(t => t.length > 2)

  const commonTokens = candidateTokens.filter(token =>
    inputTokens.some(inputToken => inputToken.includes(token) || token.includes(inputToken))
  )

  if (commonTokens.length === 0) return 0

  const ratio = commonTokens.length / Math.max(candidateTokens.length, inputTokens.length)
  return Math.round(ratio * 25)
}

const calculateLocationSimilarity = (candidateLocation: string, inputLocation: string): number => {
  if (!candidateLocation || !inputLocation) return 0

  const candidate = normalizeValue(candidateLocation)
  const input = normalizeValue(inputLocation)

  // Exact match
  if (candidate === input) return 20

  // Check if one contains the other (city vs city, state)
  if (candidate.includes(input) || input.includes(candidate)) return 15

  // Token-based matching
  const candidateTokens = candidate.split(' ')
  const inputTokens = input.split(' ')

  const commonTokens = candidateTokens.filter(token =>
    inputTokens.includes(token) && token.length > 2
  )

  if (commonTokens.length > 0) return 10

  return 0
}

const normalizeLinkedInUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    return parsed.pathname.replace(/\/$/, '').toLowerCase()
  } catch {
    return ''
  }
}

const calculateConfidence = (candidate: any, inputSignals: any) => {
  let score = 0
  const factors: string[] = []

  // LinkedIn URL match = instant high confidence
  if (candidate.linkedin_profile && inputSignals.linkedin_url) {
    const candidateSlug = normalizeLinkedInUrl(candidate.linkedin_profile)
    const inputSlug = normalizeLinkedInUrl(inputSignals.linkedin_url)
    if (candidateSlug === inputSlug) {
      return { score: 95, level: 'high', factors: ['Exact LinkedIn URL match'] }
    }
  }

  // Name similarity (0-30 points)
  const nameScore = calculateNameSimilarity(candidate.name || candidate.canonical_name, inputSignals.name)
  score += nameScore
  if (nameScore > 20) factors.push('Strong name match')
  else if (nameScore > 10) factors.push('Partial name match')

  // Company match (0-25 points)
  const companyScore = calculateCompanySimilarity(candidate.company || candidate.current_company, inputSignals.company)
  score += companyScore
  if (companyScore > 15) factors.push('Company alignment')
  else if (companyScore > 8) factors.push('Partial company match')

  // Location match (0-20 points)
  const locationScore = calculateLocationSimilarity(candidate.location, inputSignals.location)
  score += locationScore
  if (locationScore > 10) factors.push('Location consistency')

  // Professional uniqueness bonus (0-25 points)
  let uniqueScore = 0
  if (candidate.current_position && candidate.current_position.length > 10) uniqueScore += 10
  if (candidate.education) uniqueScore += 5
  if (candidate.linkedin_profile) uniqueScore += 10
  score += uniqueScore

  if (uniqueScore > 15) factors.push('Rich professional profile')

  const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'

  return { score: Math.min(score, 100), level, factors }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, company, location, linkedinUrl } = await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const callPerplexity = async (payload: Record<string, any>) => {
      const execute = (body: Record<string, any>) => fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.Preplexity}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      let response = await execute(payload)
      if (response.ok) return response

      const errorText = await response.text()
      const shouldRetryWithoutSearchOptions = response.status === 400 && /search_domain_filter|search_mode|search_enabled/i.test(errorText)

      if (shouldRetryWithoutSearchOptions && (payload.search_mode || payload.search_domain_filter || payload.search_enabled)) {
        console.warn('Perplexity request retrying without web search options:', errorText)
        const { search_mode, search_domain_filter, search_enabled, ...fallbackPayload } = payload
        response = await execute(fallbackPayload)
        if (response.ok) return response
        const fallbackErrorText = await response.text()
        throw new Error(`Perplexity API error: ${response.status} - ${fallbackErrorText}`)
      }

      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    // If LinkedIn URL provided, prioritize it as the definitive identity anchor
    if (linkedinUrl) {
      const linkedinSlug = normalizeLinkedInUrl(linkedinUrl)

      const definitiveCandidatePrompt = `Return ONLY valid JSON. Find the person at this EXACT LinkedIn profile: ${linkedinUrl}

Use this LinkedIn profile as the definitive identity. Extract their current professional information.

Return exactly this JSON structure:
{
  "candidates": [
    {
      "name": "<Full name from LinkedIn>",
      "current_position": "<Current job title and company>",
      "company": "<Current company name>",
      "location": "<Current location>",
      "linkedin_profile": "${linkedinUrl}",
      "profile_image_url": "<Profile image URL if available>",
      "experience_summary": "<Brief 1-2 sentence career summary>",
      "confidence": 95,
      "match_factors": ["Exact LinkedIn URL provided"]
    }
  ],
  "total_found": 1
}`

      const response = await callPerplexity({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You return strictly valid JSON for LinkedIn profile data extraction.' },
          { role: 'user', content: definitiveCandidatePrompt }
        ],
        max_tokens: 800,
        temperature: 0.0,
        search_enabled: true,
        search_mode: 'web',
        search_domain_filter: ['linkedin.com'],
        return_citations: false,
        return_images: false,
      })

      const data = await response.json()
      const rawResponse = data.choices?.[0]?.message?.content || ''

      try {
        const parsedData = JSON.parse(rawResponse)
        if (parsedData.candidates && parsedData.candidates.length > 0) {
          return NextResponse.json({
            success: true,
            candidates: parsedData.candidates.map((candidate: any) => ({
              ...candidate,
              confidence: 95,
              match_factors: ['Exact LinkedIn URL provided']
            })),
            total_found: parsedData.candidates.length,
            search_strategy: 'linkedin_definitive'
          })
        }
      } catch (parseError) {
        console.error('LinkedIn definitive search parse error:', parseError)
      }
    }

    // Generate multiple search queries for comprehensive candidate discovery
    const nameVariations = generateNameVariations(firstName, lastName)
    const baseSearches: string[] = []

    // Primary searches
    baseSearches.push(
      `"${firstName} ${lastName}" ${company ? `"${company}"` : ''} ${location ? `"${location}"` : ''} site:linkedin.com/in`,
      `"${firstName} ${lastName}" ${company ? `${company}` : ''} professional profile resume`,
      `"${lastName}, ${firstName}" ${company ? `${company}` : ''} ${location ? `${location}` : ''}`,
    )

    // Add variation searches
    nameVariations.slice(0, 3).forEach(variation => {
      if (variation !== `${firstName} ${lastName}`) {
        baseSearches.push(`"${variation}" ${company ? `${company}` : ''} linkedin profile`)
      }
    })

    // Company-specific searches if company provided
    if (company) {
      baseSearches.push(
        `"${firstName} ${lastName}" site:${company.toLowerCase().replace(/\s+/g, '')}.com`,
        `"${firstName}" "${lastName}" "${company}" directory team`
      )
    }

    const candidateDiscoveryPrompt = `Find potential identity matches for: ${firstName} ${lastName}
${company ? `Company context: ${company}` : ''}
${location ? `Location context: ${location}` : ''}

Search comprehensively and return ALL potential candidates who could match this person. Look for:
- Exact name matches
- Name variations (nicknames, middle names, maiden names)
- Current and former company affiliations
- Professional profiles across LinkedIn, company websites, directories

Return ONLY valid JSON with this exact structure:
{
  "candidates": [
    {
      "name": "<Full name found>",
      "current_position": "<Job title and company if available>",
      "company": "<Current company name>",
      "location": "<Location if available>",
      "linkedin_profile": "<LinkedIn URL if found, otherwise null>",
      "profile_image_url": "<Profile image URL if available, otherwise null>",
      "experience_summary": "<Brief professional summary if available>",
      "additional_info": "<Any other identifying info that helps distinguish this person>",
      "source": "<Where this candidate was found - linkedin, company website, etc.>"
    }
  ],
  "total_found": <number>
}

IMPORTANT:
- Include candidates even if you're not 100% certain it's the same person
- Provide enough distinguishing information for each candidate
- If no candidates found, return empty candidates array
- Focus on professional/business context candidates`

    const response = await callPerplexity({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: 'You are a professional researcher finding potential person matches. Return only valid JSON with comprehensive candidate information.' },
        { role: 'user', content: candidateDiscoveryPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.2,
      search_enabled: true,
      search_mode: 'web',
      return_citations: false,
      return_images: false,
    })

    const data = await response.json()
    const rawResponse = data.choices?.[0]?.message?.content || ''

    console.log('=== CANDIDATE DISCOVERY DEBUG ===')
    console.log('Raw response:', rawResponse.substring(0, 500))

    // Parse the response
    let parsedData: any
    try {
      parsedData = JSON.parse(rawResponse)
    } catch (error) {
      // Try to extract JSON from the response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0])
        } catch {
          console.error('Failed to parse candidate discovery response')
          return NextResponse.json({
            success: false,
            error: 'Failed to parse candidate discovery results',
            candidates: []
          })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'No valid JSON found in response',
          candidates: []
        })
      }
    }

    const candidates = parsedData.candidates || []

    // Calculate confidence scores and enhance candidates
    const inputSignals = {
      name: `${firstName} ${lastName}`,
      company,
      location,
      linkedin_url: linkedinUrl
    }

    const enhancedCandidates = candidates.map((candidate: any) => {
      const confidence = calculateConfidence(candidate, inputSignals)

      return {
        ...candidate,
        confidence: confidence.score,
        confidence_level: confidence.level,
        match_factors: confidence.factors,
        initials: candidate.name ?
          candidate.name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().substring(0, 2) :
          `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      }
    }).sort((a: any, b: any) => b.confidence - a.confidence)

    return NextResponse.json({
      success: true,
      candidates: enhancedCandidates.slice(0, 5), // Return top 5 candidates
      total_found: enhancedCandidates.length,
      search_strategy: 'comprehensive_discovery',
      input_signals: inputSignals
    })

  } catch (error) {
    console.error('Candidate discovery error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to discover candidates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}