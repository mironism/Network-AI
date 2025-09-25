# Product Requirements Document (PRD)

## 1. Overview
- **Product**: Agary - Smart Networking CRM
- **Owner**:
- **Date**: 2025-09-25
- **Status**: Draft

## 2. Problem Statement
Professional networking requires managing hundreds or thousands of contacts, but existing solutions lack intelligent context and enrichment. Users struggle to:
- Remember context about contacts when needed
- Find relevant people in their network for specific needs (e.g., fundraising, hiring, partnerships)
- Keep contact information and professional updates current
- Prepare meaningful context before meetings

## 3. Goals
- Create an intelligent networking CRM that automatically enriches contact data
- Enable smart search across professional networks based on capabilities and context
- Provide AI-powered meeting preparation and relationship insights
- Scale to handle hundreds of thousands of contacts efficiently

## 4. Non-Goals
- Direct social media posting or engagement
- Complex sales pipeline management
- Email marketing campaigns
- Team collaboration features (v1)

## 5. Target Users & Personas
- **Primary**: Entrepreneurs, VCs, consultants, business developers
- **Secondary**: Sales professionals, recruiters, professional networkers
- Users who attend many networking events and need to manage large contact databases

## 6. Product Scope
- In scope:
  - Contact creation (name/surname + links entry)
  - CSV contact import/export
  - Perplexity API-based web data enrichment
  - AI-powered semantic search with reasoning
  - Voice message updates for contacts
  - Note-taking and relationship tracking
  - Vector-based semantic search
  - Responsive web interface
- Out of scope (MVP):
  - Calendar integration
  - Native mobile apps
  - Direct messaging/communication
  - Social media management
  - Complex CRM workflows
  - Team sharing

## 7. Requirements
### 7.1 Functional Requirements
- FR-1: Users can add contacts with name/surname and relevant links
- FR-2: System automatically enriches contacts using Perplexity API for web scraping
- FR-3: AI-powered search with reasoning to find contacts by any criteria
- FR-4: Voice message integration for contact updates after meetings
- FR-5: Add and manage notes about contacts and interactions
- FR-6: CSV bulk import/export for contact management
- FR-7: Vector search for semantic contact discovery across all enriched data
- FR-8: Weekly automatic data refresh + on-demand enrichment
- FR-9: Freemium model with enrichment limits for free tier

### 7.2 Non-Functional Requirements
- NFR-1: Performance: Support 100K+ contacts with sub-second search
- NFR-2: Reliability: 99.9% uptime, data backup and recovery
- NFR-3: Security/Privacy: Encrypted data storage, secure API access
- NFR-4: Scalability: Vector search using Supabase for fast retrieval

## 8. User Stories
- As a entrepreneur, I want to ask "who can help me with fundraising?" and get intelligent results based on all enriched data about my contacts
- As a professional, I want to add voice notes after meetings to update contact context quickly
- As a networker, I want to discover personal interests (like NBA) in my contacts so calls feel warm and personal
- As a user, I want to search using natural language and let AI reason through all contact data to find relevant people
- As a busy professional, I want to add contacts with just name and LinkedIn URL, then let the system enrich everything automatically
- As a power user, I want to import my existing contacts via CSV and have them all enriched in bulk

## 9. User Flows
- **Contact addition**: Name/surname + links → Perplexity enrichment → Save to database
- **Smart search**: Natural language query → AI reasoning → Vector search → Ranked results with explanations
- **Voice updates**: Select contact → Record voice note → AI transcription → Update contact context
- **CSV import**: Upload file → Validate contacts → Batch enrichment → Save to database
- **Network exploration**: Browse enriched profiles → Discover connections and insights

## 10. UX & Content
- Clean, minimal interface focused on search and contact cards
- Mobile-first design for on-the-go contact addition
- Rich contact profiles with AI-generated insights
- Search-centric navigation

## 11. Success Metrics
- North Star: Time to find the right contact in network
- KPIs:
  - Daily active users
  - Contacts added per user
  - Search queries per session
  - Meeting reports generated
  - Contact enrichment success rate

## 12. Analytics & Telemetry
- Contact addition events
- Search queries and results
- Meeting report generations
- Enrichment API success/failure rates
- User engagement patterns

## 13. Dependencies
### Technology Stack:
- **Backend**: Supabase (database, auth, real-time, vector search)
- **Frontend**: Vercel (hosting and deployment)
- **AI Services**:
  - ChatGPT API (search reasoning, voice transcription, contact insights)
  - Perplexity API (comprehensive web data enrichment)
- **Search**: Supabase Vector (semantic search across enriched data)
- **Data Sources**: Perplexity API for all web-accessible information

## 14. Risks & Mitigations
- Risk: Perplexity API rate limits/costs → Mitigation: Smart caching, batch processing, freemium limits
- Risk: Data privacy concerns → Mitigation: Strong encryption, minimal data collection, user control
- Risk: AI API costs scaling → Mitigation: Usage optimization, enrichment quotas, paid tiers
- Risk: Enrichment data quality → Mitigation: Perplexity's multi-source approach, user verification options
- Risk: Voice transcription accuracy → Mitigation: User editing capabilities, confidence scores

## 15. Assumptions & Constraints
- Users primarily network in English-speaking markets (v1)
- Perplexity API provides comprehensive web data access
- Users comfortable with AI-enhanced contact management and voice features
- Freemium model balances API costs with user acquisition
- Permanent data storage in Supabase (no retention limits)

## 16. Rollout Plan
- **MVP (Phase 1)**: Contact entry + Perplexity enrichment + basic search
- **Phase 2**: AI-powered semantic search with reasoning
- **Phase 3**: Voice message integration + CSV import/export
- **Phase 4**: Advanced insights + meeting preparation features
- **Future**: Calendar integration + mobile apps
- Launch criteria: 100+ contacts per user, <2s search response time, freemium model active

## 17. Open Questions
- What specific freemium limits should we set? (enrichments per month, contact storage, search queries?)
- How should voice message storage and transcription be priced in the model?
- What level of Perplexity API access do we need for comprehensive enrichment?
- Should we implement user feedback mechanisms to improve enrichment quality?
- How do we handle GDPR compliance for storing enriched public data about third parties?
- What's our backup strategy if Perplexity API becomes unavailable or too expensive? 
