import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question, k = 6, messages = [] } = await request.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // 1) Try to create embedding for the question (optional)
    let embedding: number[] | null = null
    try {
      if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')
      const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: question
        })
      })
      if (embedResp.ok) {
        const embedJson = await embedResp.json()
        embedding = embedJson.data?.[0]?.embedding || null
      }
    } catch (e) {
      // Soft-fail to keyword search
      embedding = null
    }

    // 2) Retrieve top-k contacts via RPC. If no embeddings exist yet for this user, opportunistically backfill a small batch.
    let contacts: any[] = []
    if (embedding) {
      const { data: matches, error: matchError } = await supabase
        .rpc('match_contacts', {
          user_uuid: user.id,
          query_embedding: embedding,
          match_count: k
        })

      if (matchError) {
        console.warn('match_contacts error, falling back to keyword search:', matchError)
      } else {
        contacts = (matches || []).map((m: any) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`.trim(),
          company: m.company || null,
          location: m.location || null,
          linkedin_url: m.linkedin_url || null,
          enrichment_data: m.enrichment_data || null,
          similarity: m.similarity
        }))
        // If no results and user likely has no embeddings, opportunistically backfill up to 50 contacts
        if (contacts.length === 0) {
          // Check if any embedding exists for this user
          const { data: anyVec } = await supabase
            .from('contacts')
            .select('id')
            .eq('user_id', user.id)
            .not('embedding', 'is', null)
            .limit(1)

          if (!anyVec || anyVec.length === 0) {
            try {
              // Fetch up to 50 contacts missing embeddings
              const { data: toEmbed } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, company, notes, enrichment_data')
                .eq('user_id', user.id)
                .is('embedding', null)
                .limit(50)

              if ((toEmbed?.length || 0) > 0 && process.env.OPENAI_API_KEY) {
                const texts = (toEmbed || []).map((c: any) => [
                  c.first_name, c.last_name, c.company,
                  c.notes,
                  c.enrichment_data?.person_summary?.summary,
                  c.enrichment_data?.professional_background?.current_company,
                ].filter(Boolean).join(' '))

                const embedResp2 = await fetch('https://api.openai.com/v1/embeddings', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: 'text-embedding-3-small',
                    input: texts
                  })
                })
                if (embedResp2.ok) {
                  const ej = await embedResp2.json()
                  const vectors = ej.data?.map((d: any) => d.embedding) || []
                  // Upsert embeddings one-by-one (small batch)
                  for (let i = 0; i < Math.min(vectors.length, toEmbed!.length); i++) {
                    const cid = toEmbed![i].id
                    const vec = vectors[i]
                    await supabase
                      .from('contacts')
                      .update({ embedding: vec, updated_at: new Date().toISOString() })
                      .eq('id', cid)
                      .eq('user_id', user.id)
                  }

                  // Re-run match after backfill
                  const { data: matches2 } = await supabase
                    .rpc('match_contacts', {
                      user_uuid: user.id,
                      query_embedding: embedding,
                      match_count: k
                    })
                  if (matches2) {
                    contacts = matches2.map((m: any) => ({
                      id: m.id,
                      name: `${m.first_name} ${m.last_name}`.trim(),
                      company: m.company || null,
                      location: m.location || null,
                      linkedin_url: m.linkedin_url || null,
                      enrichment_data: m.enrichment_data || null,
                      similarity: m.similarity
                    }))
                  }
                }
              }
            } catch (e) {
              console.warn('opportunistic embedding backfill failed:', e)
            }
          }
        }
      }
    }

    // Fallback: keyword search over first_name/last_name/company/notes
    if (!contacts.length) {
      // Extract useful tokens from the question (drop stopwords/punctuation)
      const tokens = (question.toLowerCase().match(/[a-z0-9]+/g) || [])
        .filter(t => t.length >= 2)
        .filter(t => !['who','whos','whois','s','is','the','a','an','in','on','at','for','with','about','my','our','network','help','can','me','tell','find'].includes(t))
        .slice(0, 5)

      const orParts: string[] = []
      if (tokens.length) {
        tokens.forEach(tok => {
          orParts.push(`first_name.ilike.%${tok}%`)
          orParts.push(`last_name.ilike.%${tok}%`)
          orParts.push(`company.ilike.%${tok}%`)
          orParts.push(`notes.ilike.%${tok}%`)
        })
      } else {
        // If no tokens, fall back to whole string once
        const q = question.replace(/[,]/g, ' ')
        orParts.push(`first_name.ilike.%${q}%`)
        orParts.push(`last_name.ilike.%${q}%`)
        orParts.push(`company.ilike.%${q}%`)
        orParts.push(`notes.ilike.%${q}%`)
      }

      const { data: kw, error: kwErr } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .or(orParts.join(','))
        .limit(k)

      if (!kwErr && kw) {
        contacts = kw.map((m: any) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`.trim(),
          company: m.company || null,
          location: m.location || null,
          linkedin_url: m.linkedin_url || null,
          enrichment_data: m.enrichment_data || null,
        }))
      }
    }

    const contactsForPrompt = contacts.map((c: any) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      location: c.location,
      linkedin_url: c.linkedin_url,
      enrichment_data: c.enrichment_data,
      similarity: c.similarity
    }))

    // 3) Build a concise RAG prompt
    const context = contactsForPrompt.map((c: any, i: number) => (
      `#${i + 1} ${c.name}` +
      `${c.company ? `, ${c.company}` : ''}` +
      `${c.location ? `, ${c.location}` : ''}` +
      `${c.linkedin_url ? `, LinkedIn: ${c.linkedin_url}` : ''}` +
      `${c.enrichment_data?.person_summary?.summary ? `\nSummary: ${c.enrichment_data.person_summary.summary}` : ''}`
    )).join('\n\n')

    const recentAssistant = Array.isArray(messages)
      ? [...messages].reverse().find((m: any) => m.role === 'assistant' && Array.isArray(m.contacts) && m.contacts.length)
      : null
    const lastSuggestedNames = recentAssistant ? recentAssistant.contacts.map((c: any) => c.name).join(', ') : ''

    const system = 'You are Agary, an expert CRM copilot. Maintain conversational coherence using the entire message history. Resolve pronouns and follow-ups naturally. Ground answers ONLY in the provided contacts context provided below. If the answer is explicitly present in the provided fields (e.g., location, company), answer directly and concisely; do not claim lack of info when the field exists. Be direct, and include a short list of suggested people with reasoning.'

    // Build compact chat history for the LLM
    const historyMessages = Array.isArray(messages)
      ? messages.slice(-12).map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m.content === 'string' ? m.content : ''
        }))
      : []

    // Identify a primary candidate from the last assistant suggestions (first item)
    const primaryCandidateName: string | null = recentAssistant?.contacts?.[0]?.name || null
    const primary = primaryCandidateName
      ? contactsForPrompt.find((c: any) => c.name === primaryCandidateName) || null
      : null

    const primaryBlock = primary
      ? `Primary candidate (from prior turn):\n` +
        JSON.stringify({
          name: primary.name,
          company: primary.company,
          location: primary.location || primary.enrichment_data?.person_summary?.location || null,
          linkedin_url: primary.linkedin_url,
          summary: primary.enrichment_data?.person_summary?.summary || null
        })
      : ''

    const userPrompt = [
      primaryBlock,
      `Candidate contacts:`,
      context || 'No contacts matched.',
      lastSuggestedNames ? `Previously suggested people: ${lastSuggestedNames}` : '' ,
      `Question: ${question}`
    ].filter(Boolean).join('\n\n')

    // Heuristic: if follow-up asks for location and there is a single prior suggestion, answer directly
    const asksLocation = /\b(where|based|located|live|living)\b/i.test(question)
    let directFollowupAnswer: string | null = null
    if (asksLocation && recentAssistant && Array.isArray(recentAssistant.contacts) && recentAssistant.contacts.length >= 1) {
      // Use the first suggested contact from the last assistant reply
      const targetName: string = recentAssistant.contacts[0]?.name
      const target = contactsForPrompt.find((c: any) => c.name === targetName)
      if (target) {
        const loc = target.location || target.enrichment_data?.person_summary?.location
        if (loc) {
          directFollowupAnswer = `${target.name} is based in ${loc}.`
        } else {
          directFollowupAnswer = `I don't have a location saved for ${target.name}.`
        }
      }
    }

    // If we produced a deterministic follow-up answer, return it immediately
    if (directFollowupAnswer) {
      return NextResponse.json({ answer: directFollowupAnswer, contacts: contactsForPrompt })
    }

    // 4) Final answer: prefer OpenAI if available, else heuristic fallback
    let answer = ''
    if (process.env.OPENAI_API_KEY) {
      const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            ...historyMessages,
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2
        })
      })

      if (chatResp.ok) {
        const chatJson = await chatResp.json()
        answer = chatJson.choices?.[0]?.message?.content || ''
      }
    }

    if (!answer) {
      // Heuristic fallback answer without external LLM
      const lines: string[] = []
      if (contactsForPrompt.length === 0) {
        lines.push('No matching contacts found. Try refining your query or enrich contacts first.')
      } else {
        lines.push('Top suggested people:')
        contactsForPrompt.slice(0, 5).forEach((c: any, i: number) => {
          const parts = [c.name]
          if (c.company) parts.push(c.company)
          if (c.location) parts.push(c.location)
          const reasonHints: string[] = []
          const summary = c.enrichment_data?.person_summary?.summary as string | undefined
          if (summary) reasonHints.push(summary)
          lines.push(`${i + 1}. ${parts.join(' — ')}${c.linkedin_url ? ` (LinkedIn: ${c.linkedin_url})` : ''}`)
          if (reasonHints.length) lines.push(`   · ${reasonHints[0]}`)
        })
      }
      answer = lines.join('\n')
    }

    return NextResponse.json({ answer, contacts: contactsForPrompt })
  } catch (error) {
    console.error('ask-network error:', error)
    return NextResponse.json({ error: 'Failed to answer', details: (error as Error).message }, { status: 500 })
  }
}


