/* eslint-disable @typescript-eslint/no-explicit-any */

interface SearchAPIParams {
  query: string
  count?: number
  domains?: string[]
  dateRange?: string
  country?: string
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  domain: string
  publishedDate?: string
}

interface SearchAPIResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
}

class PerplexitySearchAPI {
  private apiKey: string
  private baseUrl = 'https://api.perplexity.ai'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(params: SearchAPIParams): Promise<SearchAPIResponse> {
    const searchPayload = {
      q: params.query,
      count: params.count || 10,
      ...(params.domains && { domain_filter: params.domains }),
      ...(params.dateRange && { date_range: params.dateRange }),
      ...(params.country && { country: params.country }),
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload),
      })

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} - ${await response.text()}`)
      }

      const data = await response.json()

      return {
        results: data.results || [],
        totalResults: data.total_results || 0,
        searchTime: data.search_time || 0
      }
    } catch (error) {
      console.error('Perplexity Search API error:', error)
      throw error
    }
  }

  async multiSearch(queries: SearchAPIParams[]): Promise<SearchAPIResponse[]> {
    // For now, we'll do sequential searches since the Search API might not support batch yet
    const results = await Promise.allSettled(
      queries.map(query => this.search(query))
    )

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error('Multi-search error:', result.reason)
        return {
          results: [],
          totalResults: 0,
          searchTime: 0
        }
      }
    })
  }

  // Helper method to generate targeted searches for person discovery
  generatePersonSearchQueries(
    firstName: string,
    lastName: string,
    company?: string,
    location?: string,
    linkedinUrl?: string
  ): SearchAPIParams[] {
    const queries: SearchAPIParams[] = []

    // Primary LinkedIn search
    queries.push({
      query: `"${firstName} ${lastName}" ${company ? `"${company}"` : ''} ${location ? `"${location}"` : ''}`,
      domains: ['linkedin.com'],
      count: 5
    })

    // Professional profile search
    queries.push({
      query: `"${firstName} ${lastName}" ${company ? `${company}` : ''} professional profile resume`,
      count: 5
    })

    // Company-specific search
    if (company) {
      queries.push({
        query: `"${firstName} ${lastName}" "${company}" team employee directory`,
        count: 3
      })
    }

    // News and publications search
    queries.push({
      query: `"${firstName} ${lastName}" ${company ? `${company}` : ''} news article publication`,
      dateRange: 'last_year',
      count: 3
    })

    // Social media profiles
    queries.push({
      query: `"${firstName} ${lastName}" profile`,
      domains: ['twitter.com', 'github.com', 'medium.com'],
      count: 3
    })

    return queries
  }

  // Parse search results to extract person-related information
  parsePersonResults(results: SearchResult[]): any[] {
    const candidates: any[] = []

    results.forEach(result => {
      // Extract potential person information from search results
      const candidate: any = {
        source_url: result.url,
        source_domain: result.domain,
        title: result.title,
        snippet: result.snippet,
        published_date: result.publishedDate
      }

      // Try to extract LinkedIn profile info
      if (result.domain.includes('linkedin.com')) {
        const linkedinMatch = result.url.match(/linkedin\.com\/in\/([^\/\?]+)/)
        if (linkedinMatch) {
          candidate.linkedin_profile = result.url
          candidate.linkedin_slug = linkedinMatch[1]
        }
      }

      // Extract name from title if it looks like a person's profile
      const namePattern = /^([A-Z][a-z]+ [A-Z][a-z]+)/
      const nameMatch = result.title.match(namePattern)
      if (nameMatch) {
        candidate.extracted_name = nameMatch[1]
      }

      // Extract company info from snippet
      const companyPatterns = [
        /at ([A-Z][A-Za-z\s&]+)(?:\s|,|\.)/,
        /works at ([A-Z][A-Za-z\s&]+)(?:\s|,|\.)/,
        /CEO of ([A-Z][A-Za-z\s&]+)(?:\s|,|\.)/,
        /founder of ([A-Z][A-Za-z\s&]+)(?:\s|,|\.)/
      ]

      for (const pattern of companyPatterns) {
        const match = result.snippet.match(pattern)
        if (match) {
          candidate.extracted_company = match[1].trim()
          break
        }
      }

      candidates.push(candidate)
    })

    return candidates
  }
}

// Factory function to create search API instance
export const createPerplexitySearchAPI = (apiKey?: string): PerplexitySearchAPI => {
  const key = apiKey || process.env.Preplexity
  if (!key) {
    throw new Error('Perplexity API key not found')
  }
  return new PerplexitySearchAPI(key)
}

export type { SearchAPIParams, SearchResult, SearchAPIResponse }
export { PerplexitySearchAPI }