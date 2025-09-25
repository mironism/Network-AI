import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactId } = await request.json()

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    // Get contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Build comprehensive search query for Perplexity with confidence scoring
    const hasLinkedIn = contact.linkedin_url && contact.linkedin_url.trim() !== ''
    const searchQuery = `${hasLinkedIn ?
      `Please research this specific LinkedIn profile: ${contact.linkedin_url} for ${contact.first_name} ${contact.last_name}.

Since you have the exact LinkedIn profile, gather comprehensive professional information from this profile and cross-reference with other sources to build a complete professional picture.` :
      `Research comprehensive information about: ${contact.first_name} ${contact.last_name}.

IMPORTANT: Multiple people may have this name. Be very careful about person identification and indicate your confidence level.`
    }

Find detailed professional and background information from reliable sources. Focus on gathering REAL, SPECIFIC information rather than placeholder text. Return your results as a valid JSON object with confidence scoring:

{
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
  }
}

IMPORTANT INSTRUCTIONS:
- ${hasLinkedIn ? 'Since LinkedIn URL is provided, use it as PRIMARY source and cross-reference findings' : 'Without LinkedIn, be careful about person identification and indicate confidence'}
- Search across LinkedIn, company websites, news articles, professional directories, and social media
- Fill ALL fields with REAL information when found - avoid placeholder text like "Not available"
- If you cannot find specific information, leave the field empty or use brief descriptive text
- For confidence scoring:
  * HIGH (90-100%): LinkedIn URL provided OR unique professional profile found
  * MEDIUM (70-89%): Strong indicators but some ambiguity
  * LOW (50-69%): Common name with multiple possible matches
- Return ONLY valid JSON, no additional text before or after
- Focus on finding ACTUAL data rather than saying information is not available`

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.Preplexity}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        max_tokens: 2000,
        temperature: 0.1,
      }),
    })

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text()
      console.error('Perplexity API error details:', errorText)
      throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`)
    }

    const perplexityData = await perplexityResponse.json()
    const rawResponse = perplexityData.choices[0]?.message?.content || 'No enrichment data found'

    console.log('=== PERPLEXITY DEBUG ===')
    console.log('Raw response length:', rawResponse.length)
    console.log('Raw response preview:', rawResponse.substring(0, 500))
    console.log('Contact info:', { name: `${contact.first_name} ${contact.last_name}`, linkedin: contact.linkedin_url })

    // Try to parse JSON response
    let parsedData = null
    try {
      parsedData = JSON.parse(rawResponse)
      console.log('Successfully parsed JSON, keys:', Object.keys(parsedData))
    } catch (error) {
      console.error('Failed to parse JSON response:', error)
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

    // Structure the enrichment data with comprehensive detail and confidence scoring
    const enrichmentData = {
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
      verification_note: 'AI-enhanced professional profile with person identification confidence scoring'
    }

    // Extract LinkedIn URL from social profiles if not already set
    let linkedinUpdate = {}
    let otherLinksUpdate = {}

    if (!contact.linkedin_url && parsedData.social_profiles) {
      const linkedinProfile = parsedData.social_profiles.find(profile =>
        profile.platform?.toLowerCase().includes('linkedin')
      )
      if (linkedinProfile?.url) {
        linkedinUpdate = { linkedin_url: linkedinProfile.url }
      }
    }

    // Extract other social links if not already set
    if (parsedData.social_profiles || parsedData.websites_and_profiles) {
      const otherLinks = []

      // Add non-LinkedIn social profiles
      if (parsedData.social_profiles) {
        parsedData.social_profiles.forEach(profile => {
          if (profile.url && !profile.platform?.toLowerCase().includes('linkedin')) {
            otherLinks.push(`${profile.platform}: ${profile.url}`)
          }
        })
      }

      // Add websites and profiles
      if (parsedData.websites_and_profiles) {
        parsedData.websites_and_profiles.forEach(site => {
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