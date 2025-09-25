# Agary - Smart Networking CRM

Agary is an intelligent networking CRM that automatically enriches your contacts with AI-powered insights and enables smart search across your professional network.

## Features

- **Smart Contact Management**: Add contacts with just name and links
- **AI-Powered Enrichment**: Automatic data enhancement using Perplexity API
- **Intelligent Search**: Natural language queries to find relevant contacts
- **Voice Updates**: Add voice notes after meetings that get transcribed
- **Vector Search**: Semantic search across all enriched contact data

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Vector Search)
- **AI**: OpenAI ChatGPT + Perplexity API
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd agary
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the database schema in Supabase SQL Editor:

```bash
# Copy the contents of supabase-schema.sql and run in Supabase SQL Editor
```

### 3. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 4. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Database Schema

The app uses a simple `contacts` table with:
- User authentication via Supabase Auth
- Vector embeddings for AI search
- JSONB storage for enriched data
- RLS policies for data security

## MVP Roadmap

- [x] Authentication with Supabase
- [x] Basic contact CRUD operations
- [ ] Perplexity API integration for enrichment
- [ ] OpenAI integration for search and voice transcription
- [ ] Vector embeddings and semantic search
- [ ] CSV import/export
- [ ] Voice note recording and transcription

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-key
PERPLEXITY_API_KEY=your-perplexity-key
```