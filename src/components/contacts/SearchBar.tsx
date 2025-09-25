'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SearchBar() {
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement AI-powered search
    console.log('Searching for:', query)
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Search Your Network</h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Ask anything about your network... e.g. 'Who can help me with fundraising?'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>
    </Card>
  )
}