-- Agary Database Setup
-- Copy and paste this entire script into your Supabase SQL Editor

-- Enable the pgvector extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
    location TEXT,
    company TEXT,
  linkedin_url TEXT,
  other_links TEXT,
  enrichment_data JSONB,
  notes TEXT,
  voice_notes TEXT[], -- Store voice note transcriptions
  embedding vector(1536), -- For AI search (OpenAI embedding size)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);

-- Try to create vector index (may fail if pgvector not fully enabled, that's OK for now)
DO $$
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS contacts_embedding_idx ON contacts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Vector index creation skipped - pgvector may not be fully configured';
  END;
END $$;

-- Helper function: semantic match over contacts per user (top-k)
CREATE OR REPLACE FUNCTION match_contacts(user_uuid uuid, query_embedding vector(1536), match_count int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  location text,
  company text,
  linkedin_url text,
  other_links text,
  enrichment_data jsonb,
  notes text,
  voice_notes text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
) AS $$
  SELECT c.id,
         c.user_id,
         c.first_name,
         c.last_name,
         c.location,
         c.company,
         c.linkedin_url,
         c.other_links,
         c.enrichment_data,
         c.notes,
         c.voice_notes,
         c.created_at,
         c.updated_at,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM contacts c
  WHERE c.user_id = user_uuid
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL STABLE;

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

-- Create RLS policies
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Database setup completed successfully!' as status;