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

    // Build search query for Perplexity
    const searchQuery = `Find detailed professional information about ${contact.first_name} ${contact.last_name}${
      contact.linkedin_url ? ` (LinkedIn: ${contact.linkedin_url})` : ''
    }. Include their current job title, company, industry, education, notable achievements, recent projects, and any interesting background information. Focus on professional context and recent activities.`

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.Preplexity}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional research assistant. Provide accurate, up-to-date information about professionals in a structured format. Focus on verified professional information and recent activities.'
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    })

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`)
    }

    const perplexityData = await perplexityResponse.json()
    const enrichmentText = perplexityData.choices[0]?.message?.content || 'No enrichment data found'

    // Structure the enrichment data
    const enrichmentData = {
      summary: enrichmentText,
      enriched_at: new Date().toISOString(),
      source: 'perplexity',
      query_used: searchQuery,
      model_used: 'llama-3.1-sonar-small-128k-online'
    }

    // Update contact with enrichment data
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        enrichment_data: enrichmentData,
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