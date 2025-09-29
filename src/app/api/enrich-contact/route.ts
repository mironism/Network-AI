/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const normalizeLinkedInUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    return parsed.pathname.replace(/\/$/, '').toLowerCase()
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 ENRICHMENT ENDPOINT CALLED')
  console.log('Timestamp:', new Date().toISOString())

  try {
    const supabase = await createClient()
    console.log('✅ Supabase client created')

    // Check if user is authenticated
    console.log('🔐 Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    console.log('📖 Parsing request body...')
    const { contactId, selectedCandidate: initialSelectedCandidate, skipCandidateSelection } = await request.json()
    let selectedCandidate = initialSelectedCandidate
    console.log('Request params:', { contactId, hasSelectedCandidate: !!selectedCandidate, skipCandidateSelection })

    if (!contactId) {
      console.log('❌ Missing contact ID')
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    // Get contact data
    console.log('📋 Fetching contact data for ID:', contactId)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single()

    if (contactError || !contact) {
      console.log('❌ Contact not found:', contactError)
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    console.log('✅ Contact fetched:', {
      name: `${contact.first_name} ${contact.last_name}`,
      hasLinkedIn: !!contact.linkedin_url,
      linkedinUrl: contact.linkedin_url
    })

    // Skip candidate selection workflow for now - proceed directly to enrichment

    // If we have a selected candidate, update contact with confirmed data
    if (selectedCandidate) {
      const updates: any = {}

      if (selectedCandidate.linkedin_profile && !contact.linkedin_url) {
        updates.linkedin_url = selectedCandidate.linkedin_profile
      }

      if (selectedCandidate.company && !contact.company) {
        updates.company = selectedCandidate.company
      }

      if (selectedCandidate.location && !contact.location) {
        updates.location = selectedCandidate.location
      }

      // Update contact in database if we have new info
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('contacts')
          .update(updates)
          .eq('id', contactId)
          .eq('user_id', user.id)

        // Update local contact object
        Object.assign(contact, updates)
      }
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

    // DEBUG: Log enrichment flow decision
    console.log('=== ENRICHMENT FLOW DEBUG ===')
    console.log('Contact ID:', contactId)
    console.log('Contact LinkedIn URL:', contact.linkedin_url)
    console.log('Selected Candidate:', selectedCandidate ? 'YES' : 'NO')
    console.log('Skip Candidate Selection:', skipCandidateSelection)
    console.log('LinkedIn URL detected:', !!contact.linkedin_url)
    console.log('LinkedIn URL value:', JSON.stringify(contact.linkedin_url))

    // Special handling for definitive LinkedIn URL enrichment
    if (contact.linkedin_url && !selectedCandidate) {
      console.log('🎯 ENTERING DEFINITIVE LINKEDIN ENRICHMENT MODE')
      console.log('LinkedIn URL confirmed:', contact.linkedin_url)
      const linkedinSlug = normalizeLinkedInUrl(contact.linkedin_url)

      const definitiveEnrichmentPrompt = `DEFINITIVE LINKEDIN ENRICHMENT - SINGLE PERSON ONLY

CONFIRMED IDENTITY:
- Person: ${contact.first_name} ${contact.last_name}
- LinkedIn: ${contact.linkedin_url} (slug: ${linkedinSlug})
- Identity Status: 100% CONFIRMED by provided LinkedIn URL

CRITICAL INSTRUCTIONS:
1. Use ONLY the provided LinkedIn URL as the identity anchor
2. IGNORE any other people with the same name
3. Focus exclusively on enriching THIS specific LinkedIn profile
4. Search for content that references this exact LinkedIn URL
5. Cross-reference only with sources that clearly mention this LinkedIn profile

Search Strategy:
- Primary: ${contact.linkedin_url}
- Secondary: News/articles mentioning this LinkedIn profile
- Tertiary: Company pages mentioning this specific person

Return comprehensive professional data for ONLY this confirmed person.
Set identity.verified = true and confidence_score.overall_confidence = 95.
Do NOT include identity_candidates array.

Return ONLY valid JSON with this structure:
{
  "identity": {
    "linkedin_profile": "${contact.linkedin_url}",
    "canonical_name": "${contact.first_name} ${contact.last_name}",
    "verified": true
  },
  "confidence_score": {
    "overall_confidence": 95,
    "confidence_level": "high",
    "matching_factors": ["Exact LinkedIn URL provided"],
    "disambiguation_notes": "Identity confirmed by provided LinkedIn URL",
    "verification_suggestions": "No additional verification needed"
  },
  "person_summary": {
    "full_name": "${contact.first_name} ${contact.last_name}",
    "current_position": "<Current job title and company from LinkedIn>",
    "industry": "<Industry/field from LinkedIn>",
    "location": "<Current location from LinkedIn>",
    "experience_years": "<Years of experience or career stage>",
    "summary": "<Comprehensive 3-4 sentence professional overview from LinkedIn>"
  },
  "professional_background": {
    "current_company": "<Current employer from LinkedIn>",
    "previous_companies": ["<Previous companies from LinkedIn>"],
    "education": "<Educational background from LinkedIn>",
    "skills_expertise": ["<Skills from LinkedIn>"],
    "notable_achievements": ["<Achievements from LinkedIn and cross-references>"]
  },
  "social_profiles": [
    {
      "platform": "LinkedIn",
      "url": "${contact.linkedin_url}",
      "verified": true
    }
  ],
  "websites_and_profiles": [],
  "recent_activities": [],
  "additional_info": {
    "publications": [],
    "certifications": [],
    "awards": [],
    "speaking_events": []
  }
}`

      let definitiveData: any
      let definitiveRaw = ''

      try {
        console.log('📡 Calling Perplexity for definitive LinkedIn enrichment...')
        const definitiveResponse = await callPerplexity({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are enriching a CONFIRMED person using their definitive LinkedIn URL. Focus exclusively on this one person. Do not search for or return information about other people with similar names. Return only valid JSON.'
            },
            {
              role: 'user',
              content: definitiveEnrichmentPrompt
            }
          ],
          max_tokens: 1800,
          temperature: 0.0,
          search_enabled: true,
          search_mode: 'web',
          search_domain_filter: ['linkedin.com'],
          return_citations: false,
          return_images: false,
        })

        definitiveData = await definitiveResponse.json()
        definitiveRaw = definitiveData.choices?.[0]?.message?.content || ''

        console.log('=== DEFINITIVE LINKEDIN ENRICHMENT SUCCESS ===')
        console.log('LinkedIn URL:', contact.linkedin_url)
        console.log('Raw response preview:', definitiveRaw.substring(0, 500))
      } catch (apiError) {
        console.error('❌ Definitive LinkedIn enrichment API error:', apiError)
        // Fall back to manual construction
        definitiveRaw = ''
        definitiveData = null
      }

      let definitiveEnrichmentData: any
      try {
        definitiveEnrichmentData = JSON.parse(definitiveRaw)
      } catch (parseError) {
        console.error('Definitive enrichment parse error:', parseError)
        // Fallback to manual construction
        definitiveEnrichmentData = {
          identity: {
            linkedin_profile: contact.linkedin_url,
            canonical_name: `${contact.first_name} ${contact.last_name}`,
            verified: true
          },
          confidence_score: {
            overall_confidence: 95,
            confidence_level: 'high',
            matching_factors: ['Exact LinkedIn URL provided'],
            disambiguation_notes: 'Identity confirmed by provided LinkedIn URL',
            verification_suggestions: 'No additional verification needed'
          },
          person_summary: {
            full_name: `${contact.first_name} ${contact.last_name}`,
            summary: 'Professional enrichment data will be populated from LinkedIn profile.'
          },
          professional_background: {},
          social_profiles: [{
            platform: 'LinkedIn',
            url: contact.linkedin_url,
            verified: true
          }],
          websites_and_profiles: [],
          recent_activities: [],
          additional_info: {},
          raw_response: definitiveRaw,
          enriched_at: new Date().toISOString(),
          source: 'perplexity_definitive',
          model_used: 'sonar-pro',
          verification_note: 'Identity confirmed by provided LinkedIn URL - definitive enrichment'
        }
      }

      // Ensure the enrichment data has proper structure
      const finalEnrichmentData = {
        ...definitiveEnrichmentData,
        identity: {
          linkedin_profile: contact.linkedin_url,
          canonical_name: `${contact.first_name} ${contact.last_name}`,
          verified: true
        },
        confidence_score: {
          ...definitiveEnrichmentData.confidence_score,
          overall_confidence: 95,
          confidence_level: 'high',
          matching_factors: ['Exact LinkedIn URL provided']
        },
        enriched_at: new Date().toISOString(),
        source: 'perplexity_definitive',
        needs_manual_review: false
      }

      // Update contact with definitive enrichment data
      try {
        console.log('💾 Updating contact with definitive enrichment data...')
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            enrichment_data: finalEnrichmentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', contactId)
          .eq('user_id', user.id)

        if (updateError) {
          console.error('❌ Database update error:', updateError)
          throw new Error(`Failed to update contact: ${updateError.message}`)
        }

        console.log('✅ DEFINITIVE LINKEDIN ENRICHMENT COMPLETED SUCCESSFULLY')
        return NextResponse.json({
          success: true,
          message: 'Contact enriched successfully with definitive LinkedIn data',
          enrichmentData: finalEnrichmentData
        })
      } catch (dbError) {
        console.error('❌ Critical error in definitive LinkedIn enrichment:', dbError)
        throw dbError
      }
    } else {
      console.log('❌ DEFINITIVE LINKEDIN ENRICHMENT SKIPPED')
      console.log('Reason: LinkedIn URL missing or selectedCandidate present')
      console.log('LinkedIn URL:', contact.linkedin_url)
      console.log('Selected Candidate:', !!selectedCandidate)
    }

    console.log('🔄 CONTINUING TO GENERAL ENRICHMENT PATH')

    // Build comprehensive search query for Perplexity with confidence scoring
    let hasLinkedIn = contact.linkedin_url && contact.linkedin_url.trim() !== ''

    const identitySignals: string[] = []
    if (contact.location) identitySignals.push(`Location: ${contact.location}`)
    if (contact.company) identitySignals.push(`Company: ${contact.company}`)

    const hintDomains: string[] = []
    if (contact.other_links) {
      contact.other_links.split(',').forEach((raw: string) => {
        const urlMatch = raw.match(/https?:\/\/[^\s,]+/)
        if (urlMatch) {
          try {
            const u = new URL(urlMatch[0])
            hintDomains.push(u.hostname)
          } catch {}
        }
      })
    }

    const quickSearchNotes = [
      `Name: ${contact.first_name} ${contact.last_name}`,
      ...identitySignals,
      hintDomains.length ? `Known related domains: ${hintDomains.join(', ')}` : null
    ].filter(Boolean).join('\n- ')

    // Fallback: if LinkedIn not provided, do a quick pre-search to find the most likely LinkedIn URL first
    if (!hasLinkedIn) {
      try {
        const quickPrompt = `Return ONLY valid JSON with a single field linkedin_url. \n` +
          `Goal: Find the direct LinkedIn profile URL for: ${contact.first_name} ${contact.last_name}.\n` +
          `Use search operators like site:linkedin.com/in and exact quotes. If multiple matches exist, choose the best by unique signals (company, location, education).\n` +
          `If uncertain, return null.\n\n` +
          `Lead with highly targeted LinkedIn searches such as "${contact.first_name} ${contact.last_name}" ${contact.company ? `"${contact.company}" ` : ''}${contact.location ? `"${contact.location}" ` : ''}site:linkedin.com/in.\n` +
          `Prioritize results confirming these signals:\n- ${quickSearchNotes}\n\n` +
          `{"linkedin_url": "<url or null>"}`

        const quickResp = await callPerplexity({
          model: 'sonar-pro',
          messages: [
            { role: 'system', content: 'You return strictly valid JSON. No prose.' },
            { role: 'user', content: quickPrompt }
          ],
          max_tokens: 300,
          temperature: 0.0,
          search_enabled: true,
          search_mode: 'web',
          search_domain_filter: ['linkedin.com'],
          return_citations: false,
          return_images: false,
        })

        const quickData = await quickResp.json()
        const quickRaw = quickData.choices?.[0]?.message?.content || ''
        try {
          const q = JSON.parse(quickRaw)
          if (q?.linkedin_url && typeof q.linkedin_url === 'string') {
            contact.linkedin_url = q.linkedin_url
            hasLinkedIn = true
          }
        } catch {}
      } catch (e) {
        console.warn('LinkedIn quick search failed:', e)
      }
    }

    // Name variants to improve recall (handles middle initials, unicode accents, hyphens, and ordering)
    const nameVariants = [
      `${contact.first_name} ${contact.last_name}`,
      `${contact.first_name.charAt(0)}. ${contact.last_name}`,
      `${contact.first_name}${contact.last_name}`,
      `${contact.last_name} ${contact.first_name}`
    ].filter(Boolean).join(', ')

    const domainHints = hintDomains.length ? `\nIf relevant, prefer sources on: ${hintDomains.map(h => `site:${h}`).join(' OR ')}` : ''
    const extraSignals = [contact.location, contact.company].filter(Boolean).join(', ')

    const nameToken = `"${contact.first_name} ${contact.last_name}"`
    const locationToken = contact.location ? `"${contact.location}" ` : ''
    const companyToken = contact.company ? `"${contact.company}" ` : ''

    const targetedSearches: string[] = [
      `${nameToken} ${companyToken}${locationToken}site:linkedin.com/in`.trim(),
      `${nameToken} ${companyToken}${locationToken}profile`.trim(),
      `${nameToken} ${companyToken}${locationToken}resume`.trim()
    ]

    if (!hasLinkedIn) {
      targetedSearches.push(`${contact.first_name} ${contact.last_name} ${companyToken}${locationToken}linkedin`.trim())
    }

    hintDomains.forEach((domain) => {
      targetedSearches.push(`${nameToken} site:${domain}`.trim())
    })

    const filteredTargetedSearches = targetedSearches.filter(Boolean)

    const explicitSearchBlock = filteredTargetedSearches.length
      ? `Run these specific web searches (modify if better terms are obvious) and synthesize the strongest single identity match:\n${filteredTargetedSearches.map(q => `- ${q}`).join('\n')}`
      : ''

    const linkedinSlug = hasLinkedIn ? (() => { try { return new URL(contact.linkedin_url).pathname.replace(/\/$/, '') } catch { return '' } })() : ''

    // Determine if we have definitive identity confirmation
    const hasDefinitiveIdentity = hasLinkedIn || selectedCandidate
    const definitiveLinkedIn = hasLinkedIn ? contact.linkedin_url : selectedCandidate?.linkedin_profile

    const searchQuery = `${hasDefinitiveIdentity ?
      `DEFINITIVE IDENTITY CONFIRMED: ${contact.first_name} ${contact.last_name}.\n` +
      `${definitiveLinkedIn ? `LinkedIn: ${definitiveLinkedIn} (slug: "${linkedinSlug || normalizeLinkedInUrl(definitiveLinkedIn)}").\n` : ''}` +
      `${selectedCandidate ? `User-confirmed candidate: ${selectedCandidate.name} from ${selectedCandidate.company || 'Unknown company'}.\n` : ''}` +
      `Identity is CONFIRMED - focus on comprehensive enrichment rather than verification. Use the provided identity anchor and expand with detailed professional information.` :
      `Target person: ${contact.first_name} ${contact.last_name}.\nBe careful: common name risk. Confirm identity via multiple corroborating signals.`
    }\n\n` +
    `Also search variations/aliases: ${nameVariants}. Prefer exact matches. Use operators like site:linkedin.com/in, site:crunchbase.com, site:github.com, site:twitter.com.${domainHints}` +
    `${extraSignals ? `\nDisambiguation signals to prioritize: ${extraSignals}.` : ''}\n\n` +
    `${explicitSearchBlock ? `${explicitSearchBlock}\n\n` : ''}` +
    `Find detailed professional and background information from reliable sources. Focus on REAL, SPECIFIC information. Return a valid JSON object with confidence scoring and a single identity match:

{
  "identity": {
    "linkedin_profile": "${hasLinkedIn ? contact.linkedin_url : ''}",
    "canonical_name": "${contact.first_name} ${contact.last_name}",
    "verified": "<true/false - must be false if company/location mismatch or multiple candidates>"
  },
  "confidence_score": {
    "overall_confidence": "<percentage 0-100>",
    "confidence_level": "<high/medium/low>",
    "matching_factors": [
      "<LinkedIn URL match>",
      "<unique company/position combination>",
      "<location consistency>",
      "<timeline consistency>"
    ],
    "disambiguation_notes": "<If multiple people found with same name, explain why this specific person was selected>",
    "verification_suggestions": "<What additional info would help confirm identity>"
  },
  "person_summary": {
    "full_name": "${contact.first_name} ${contact.last_name}",
    "current_position": "<Current job title and company>",
    "industry": "<Industry/field they work in>",
    "location": "<Current location if available>",
    "experience_years": "<Years of experience or career stage>",
    "summary": "<Comprehensive 3-4 sentence professional overview>"
  },
  "professional_background": {
    "current_company": "<Current employer>",
    "previous_companies": ["<Company 1>", "<Company 2>"],
    "education": "<Educational background>",
    "skills_expertise": ["<Skill 1>", "<Skill 2>", "<Skill 3>"],
    "notable_achievements": ["<Achievement 1>", "<Achievement 2>"]
  },
  "social_profiles": [
    {
      "platform": "<Platform name (LinkedIn, Twitter/X, Instagram, Facebook, GitHub, YouTube, TikTok, etc.)>",
      "url": "<Direct profile URL>",
      "username": "<Username/handle if different from URL>",
      "follower_count": "<If available>",
      "profile_image_url": "<Direct link to profile image if publicly accessible>",
      "verified": "<true/false if verification status is known>",
      "activity_summary": "<What they post about/their online presence>"
    }
  ],
  "websites_and_profiles": [
    {
      "type": "<personal_website/portfolio/blog/company_profile/directory_listing>",
      "url": "<Direct URL>",
      "title": "<Site/page title>",
      "description": "<Brief description of what this site contains about the person>"
    }
  ],
  "recent_activities": [
    {
      "type": "<job change/promotion/publication/speaking>",
      "description": "<Brief description>",
      "date": "<If available>",
      "source": "<Where this info was found>"
    }
  ],
  "additional_info": {
    "publications": ["<Publication 1>", "<Publication 2>"],
    "certifications": ["<Certification 1>", "<Certification 2>"],
    "awards": ["<Award 1>", "<Award 2>"],
    "speaking_events": ["<Event 1>", "<Event 2>"]
  },
  "identity_candidates": [
    {
      "name": "<Candidate name>",
      "linkedin_profile": "<LinkedIn URL or null>",
      "company": "<Company if available>",
      "location": "<Location if available>",
      "confidence": "<percentage or descriptor>",
      "notes": "<Key signals>",
      "image_url": "<Profile image URL if available, otherwise null>"
    }
  ]
}

IMPORTANT INSTRUCTIONS:
- ${hasLinkedIn ? 'Since LinkedIn URL is provided, use it as PRIMARY source and cross-reference findings' : 'Without LinkedIn, be careful about person identification and indicate confidence'}
- Search across LinkedIn, company websites, news articles, professional directories, conference listings, publication databases, and social media
- Use precise search operators (quotes, site:, intitle:) to disambiguate; if multiple candidates exist, pick the best match and explain why in disambiguation_notes
- Prefer recent and authoritative sources; include direct profile/website URLs when possible
- Populate fields only with verified info; do not fabricate. Leave fields empty if unknown
- Return a SINGLE person matching the identity. Do NOT include profiles of different people.
- Social profiles must clearly belong to the same person (name, photo, company, location consistency). If uncertain, exclude.
- For confidence scoring:
  * HIGH (90-100%): LinkedIn URL provided OR unique professional profile found with multiple corroborating signals
  * MEDIUM (70-89%): Strong indicators but some ambiguity
  * LOW (50-69%): Common name with multiple possible matches
- Return ONLY valid JSON, no additional text before or after
- If multiple strong candidates exist and you cannot decisively match them, set identity.verified to false, lower confidence, include each candidate in identity_candidates, and explain the ambiguity.
- If location or company contradicts the provided signals, set identity.verified to false and explain why.
- Only set linkedin_profile when you are highly confident it belongs to the same person; otherwise leave it null.
- Focus on finding ACTUAL data rather than saying information is not available`

    // Call Perplexity API for general enrichment
    console.log('📡 Calling Perplexity for general enrichment...')
    console.log('Search query preview:', searchQuery.substring(0, 300))

    const perplexityResponse = await callPerplexity({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a comprehensive professional research assistant with person identification expertise. Your goal is to find ALL available verified information about individuals while ensuring correct person identification. CRITICAL: If a LinkedIn URL is provided, use it as the PRIMARY source for identity verification - all other data must be cross-referenced against this profile. If no LinkedIn URL is provided and multiple people exist with the same name, clearly indicate this ambiguity and your confidence level. Search across LinkedIn, company websites, news articles, professional directories, conference listings, publication databases, and social media. Be thorough and comprehensive while maintaining accuracy about person identity. Return only valid JSON objects with confidence scoring. Use "Not available" for missing information rather than making assumptions.'
        },
        {
          role: 'user',
          content: searchQuery
        }
      ],
      max_tokens: 1800,
      temperature: 0.0,
      search_enabled: true,
      search_mode: 'web',
      // Perplexity-specific flags
      return_citations: false,
      return_images: false,
    })
    const perplexityData = await perplexityResponse.json()
    const rawResponse = perplexityData.choices?.[0]?.message?.content || ''

    console.log('=== PERPLEXITY DEBUG ===')
    console.log('Raw response length:', rawResponse.length)
    console.log('Raw response preview:', rawResponse.substring(0, 500))
    console.log('Contact info:', { name: `${contact.first_name} ${contact.last_name}`, linkedin: contact.linkedin_url })

    // Try to parse JSON response (robustly handle code fences and minor formatting)
    const tryParse = (s: string) => {
      try {
        return JSON.parse(s)
      } catch (error) {
        return null
      }
    }

    const stripCodeFences = (s: string) => {
      const fenceMatch = s.match(/```[a-zA-Z]*\n([\s\S]*?)```/)
      if (fenceMatch) return fenceMatch[1]
      return s
    }

    const extractJsonObject = (s: string) => {
      const start = s.indexOf('{')
      const end = s.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        return s.slice(start, end + 1)
      }
      return s
    }

    const normalizeQuotesAndCommas = (s: string) => {
      // Replace smart quotes
      let out = s.replace(/[\u2018\u2019\u201C\u201D]/g, '"')
      // Remove trailing commas before } or ]
      out = out.replace(/,\s*(\}|\])/g, '$1')
      return out
    }

    const attemptRepairParse = (input: string) => {
      let candidate = input
      if (!candidate) candidate = '{}'
      candidate = stripCodeFences(candidate)
      candidate = extractJsonObject(candidate)
      candidate = normalizeQuotesAndCommas(candidate)
      let result = tryParse(candidate)
      if (!result) {
        // Second attempt: strip everything except JSON-looking lines
        const lines = candidate.split('\n').filter((l: string) => /[:\{\}\[\]"]/.test(l)).join('\n')
        result = tryParse(lines)
      }
      return result
    }

    let parsedData: any = tryParse(rawResponse) || attemptRepairParse(rawResponse)

    if (parsedData && typeof parsedData === 'string') {
      parsedData = tryParse(parsedData) || attemptRepairParse(parsedData)
    }

    const parsedSuccessfully = parsedData && typeof parsedData === 'object'

    if (parsedSuccessfully) {
      console.log('Successfully parsed JSON, keys:', Object.keys(parsedData))
    } else {
      console.error('Failed to parse JSON response - falling back to placeholder data')
      console.error('Raw response that failed to parse:', rawResponse)
      parsedData = {
        person_summary: {
          full_name: `${contact.first_name} ${contact.last_name}`,
          current_position: 'Information not available',
          summary: 'AI data processing encountered an issue. Please try enriching this contact again.'
        },
        professional_background: {},
        social_profiles: [],
        recent_activities: [],
        additional_info: {}
      }
    }

    const identityCandidates = Array.isArray(parsedData.identity_candidates) ? parsedData.identity_candidates : []

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

    const matchesName = (candidates: Array<string | undefined>) => {
      const first = normalizeValue(contact.first_name)
      const last = normalizeValue(contact.last_name)
      if (!first || !last) return false
      return candidates.some((candidate) => {
        const normalized = normalizeValue(candidate)
        return normalized.includes(first) && normalized.includes(last)
      })
    }

    const tokenize = (value: string) => {
      return value
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2)
    }

    const tokenMatch = (
      expectedValue: string | null | undefined,
      candidates: Array<string | undefined>,
      minimumMatches = 1
    ) => {
      const expected = normalizeValue(expectedValue || '')
      if (!expected) return false
      const expectedTokens = tokenize(expected)
      return candidates.some((candidate) => {
        const normalized = normalizeValue(candidate)
        if (!normalized) return false
        if (normalized.includes(expected) || expected.includes(normalized)) return true
        const candidateTokens = tokenize(normalized)
        if (!expectedTokens.length || !candidateTokens.length) return false
        const matches = expectedTokens.filter((token) => candidateTokens.includes(token))
        const threshold = Math.max(minimumMatches, expectedTokens.length ? 1 : 0)
        return matches.length >= threshold
      })
    }

    const matchesCompany = (company: string | null | undefined, candidates: Array<string | undefined>) => tokenMatch(company, candidates, 1)

    const matchesLocation = (location: string | null | undefined, candidates: Array<string | undefined>) => tokenMatch(location, candidates, 1)

    const stringArray = (input: unknown): string[] => {
      if (!input) return []
      if (typeof input === 'string') return [input]
      if (Array.isArray(input)) return input.filter((value): value is string => typeof value === 'string')
      return []
    }

    const nameSources: Array<string | undefined> = [
      parsedData.identity?.canonical_name,
      parsedData.person_summary?.full_name,
      ...identityCandidates.map((candidate: any) => candidate?.name as string | undefined)
    ]

    const companySources: Array<string | undefined> = [
      parsedData.professional_background?.current_company,
      parsedData.person_summary?.current_position,
      parsedData.identity?.company,
      ...stringArray(parsedData.professional_background?.previous_companies),
      ...identityCandidates.map((candidate: any) => candidate?.company as string | undefined)
    ]

    const locationSources: Array<string | undefined> = [
      parsedData.person_summary?.location,
      parsedData.identity?.location,
      ...(identityCandidates.map((candidate: any) => candidate?.location as string | undefined))
    ]

    const nameMatch = matchesName(nameSources)
    const companyMatch = matchesCompany(contact.company, companySources)
    const locationMatch = matchesLocation(contact.location, locationSources)

    const mismatchReasons: string[] = []
    if (!nameMatch) mismatchReasons.push('Name mismatch with returned profile')
    if (contact.company && !companyMatch) mismatchReasons.push(`Company mismatch (expected ${contact.company})`)
    if (contact.location && !locationMatch) mismatchReasons.push(`Location mismatch (expected ${contact.location})`)

    const candidateCount = identityCandidates.filter((candidate: Record<string, unknown>) => candidate && Object.keys(candidate).length > 0).length
    const hasAmbiguity = candidateCount > 1
    if (hasAmbiguity) mismatchReasons.push('Multiple identity candidates detected')

    const expectedLinkedInSlug = (() => {
      try {
        return contact.linkedin_url ? new URL(contact.linkedin_url).pathname.replace(/\/$/, '').toLowerCase() : ''
      } catch {
        return ''
      }
    })()

    const returnedLinkedInSlug = (() => {
      try {
        return parsedData.identity?.linkedin_profile ? new URL(parsedData.identity.linkedin_profile).pathname.replace(/\/$/, '').toLowerCase() : ''
      } catch {
        return ''
      }
    })()

    const conflictingLinkedIn = Boolean(expectedLinkedInSlug && returnedLinkedInSlug && expectedLinkedInSlug !== returnedLinkedInSlug)
    if (conflictingLinkedIn) mismatchReasons.push('Returned LinkedIn profile does not match stored profile')

    const strongMatch = nameMatch && (!contact.company || companyMatch) && (!contact.location || locationMatch) && !hasAmbiguity && !conflictingLinkedIn
    const requiresManualReview = mismatchReasons.length > 0

    // If LinkedIn provided, hard-filter results to that profile slug to avoid mismatches
    if (hasLinkedIn && parsedData?.social_profiles?.length) {
      const slug = (() => { try { return new URL(contact.linkedin_url).pathname.replace(/\/$/, '') } catch { return '' } })()
      const normalizedSlug = slug.toLowerCase()

      const exactLinkedIn: typeof parsedData.social_profiles = []
      const otherProfiles: typeof parsedData.social_profiles = []

      parsedData.social_profiles.forEach((profile: { url?: string; platform?: string }) => {
        const url = profile?.url
        if (!url) return
        try {
          const parsedUrl = new URL(url)
          const hostname = parsedUrl.hostname.toLowerCase()
          const path = parsedUrl.pathname.replace(/\/$/, '').toLowerCase()

          if (hostname.includes('linkedin.com')) {
            if (normalizedSlug && path === normalizedSlug) {
              exactLinkedIn.push(profile)
            }
            // Drop LinkedIn entries that do not match the known slug
            return
          }
        } catch {
          // If URL parsing fails, defer keeping it until we know we have a trusted LinkedIn match
          otherProfiles.push(profile)
          return
        }

        otherProfiles.push(profile)
      })

      parsedData.social_profiles = exactLinkedIn.length ? [...exactLinkedIn, ...otherProfiles] : parsedData.social_profiles
    }

    // Structure the enrichment data with comprehensive detail and confidence scoring
    const enrichmentData = {
      identity: parsedData.identity || { linkedin_profile: hasLinkedIn ? contact.linkedin_url : null, canonical_name: `${contact.first_name} ${contact.last_name}`, verified: hasLinkedIn ? true : false },
      confidence_score: parsedData.confidence_score || {
        overall_confidence: 'Unknown',
        confidence_level: 'low',
        matching_factors: [],
        disambiguation_notes: 'Confidence scoring not available',
        verification_suggestions: 'Manual verification recommended'
      },
      person_summary: parsedData.person_summary || {},
      professional_background: parsedData.professional_background || {},
      social_profiles: parsedData.social_profiles || [],
      websites_and_profiles: parsedData.websites_and_profiles || [],
      recent_activities: parsedData.recent_activities || [],
      additional_info: parsedData.additional_info || {},
      summary: parsedData.person_summary?.summary || 'Professional information will appear here after enrichment', // Keep backward compatibility
      raw_response: rawResponse,
      enriched_at: new Date().toISOString(),
      source: 'perplexity',
      model_used: 'sonar-pro',
      query_used: searchQuery,
      verification_note: 'AI-enhanced professional profile with person identification confidence scoring',
      identity_candidates: identityCandidates,
      needs_manual_review: requiresManualReview
    }

    // If we do NOT have a LinkedIn URL, never claim a LinkedIn match
    if (!hasLinkedIn && enrichmentData.confidence_score?.matching_factors) {
      enrichmentData.confidence_score.matching_factors = enrichmentData.confidence_score.matching_factors.filter((f: string) => !/linkedin/i.test(f))
    }

    if (requiresManualReview) {
      console.warn('Identity validation requires manual review:', {
        contactId,
        reasons: mismatchReasons,
        candidates: identityCandidates
      })
      enrichmentData.identity = {
        linkedin_profile: hasLinkedIn ? contact.linkedin_url : null,
        canonical_name: `${contact.first_name} ${contact.last_name}`,
        verified: false
      }
      enrichmentData.confidence_score = {
        ...enrichmentData.confidence_score,
        overall_confidence: '45',
        confidence_level: 'low',
        disambiguation_notes: mismatchReasons.join('; ') || 'Unable to confirm identity with available data',
        verification_suggestions: enrichmentData.confidence_score?.verification_suggestions || 'Manual review required to confirm identity'
      }
      enrichmentData.verification_note = `Manual review required: ${mismatchReasons.join('; ') || 'Identity signals inconclusive'}`
    } else {
      enrichmentData.identity.verified = true
      if (!enrichmentData.verification_note) {
        enrichmentData.verification_note = 'Identity signals aligned with provided contact information'
      }
    }

    // Extract LinkedIn URL from social profiles if not already set
    let linkedinUpdate = {}
    let otherLinksUpdate = {}

    const potentialLinkedInUrls: string[] = []

    if (parsedData.identity?.linkedin_profile && typeof parsedData.identity.linkedin_profile === 'string') {
      potentialLinkedInUrls.push(parsedData.identity.linkedin_profile)
    }

    if (parsedData.social_profiles) {
      parsedData.social_profiles.forEach((profile: { platform?: string; url?: string }) => {
        if (profile?.url && profile.platform?.toLowerCase().includes('linkedin')) {
          potentialLinkedInUrls.push(profile.url)
        }
      })
    }

    const uniqueLinkedInUrls = [...new Set(potentialLinkedInUrls.filter(Boolean))]

    if (!contact.linkedin_url && strongMatch && uniqueLinkedInUrls.length === 1) {
      linkedinUpdate = { linkedin_url: uniqueLinkedInUrls[0] }
      enrichmentData.identity.linkedin_profile = uniqueLinkedInUrls[0]
    } else {
      enrichmentData.identity.linkedin_profile = hasLinkedIn ? contact.linkedin_url : (strongMatch && uniqueLinkedInUrls.length === 1 ? uniqueLinkedInUrls[0] : null)
    }

    // Extract other social links if not already set
    if (parsedData.social_profiles || parsedData.websites_and_profiles) {
      const otherLinks: string[] = []

      // Add non-LinkedIn social profiles
      if (parsedData.social_profiles) {
        parsedData.social_profiles.forEach((profile: { platform?: string; url?: string }) => {
          if (profile.url && !profile.platform?.toLowerCase().includes('linkedin')) {
            otherLinks.push(`${profile.platform}: ${profile.url}`)
          }
        })
      }

      // Add websites and profiles
      if (parsedData.websites_and_profiles) {
        parsedData.websites_and_profiles.forEach((site: { type?: string; url?: string }) => {
          if (site.url) {
            otherLinks.push(`${site.type || 'Website'}: ${site.url}`)
          }
        })
      }

      if (otherLinks.length > 0) {
        otherLinksUpdate = { other_links: otherLinks.join(', ') }
      }
    }

    // Update contact with enrichment data and discovered links
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        enrichment_data: enrichmentData,
        ...linkedinUpdate,
        ...otherLinksUpdate,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('user_id', user.id)

    if (updateError) {
      throw new Error(`Failed to update contact: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Contact enriched successfully',
      enrichmentData
    })

  } catch (error) {
    console.error('Enrichment error:', error)
    return NextResponse.json({
      error: 'Failed to enrich contact',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
