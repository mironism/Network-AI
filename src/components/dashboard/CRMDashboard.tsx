'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, Users, Activity, Settings, LogOut, Filter, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ContactsGrid from './ContactsGrid'
import ContactForm from './ContactForm'
import ContactStats from './ContactStats'
import SearchBar from './SearchBar'
import NetworkChat from './NetworkChat'

interface User {
  id: string
  email?: string
}

interface CRMDashboardProps {
  user: User
}

export default function CRMDashboard({ user }: CRMDashboardProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Agary</h1>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span>Welcome,</span>
                <span className="font-medium">{user.email}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(true)}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Ask Network</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="mb-6">
          <ContactStats />
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <SearchBar onSearch={setSearchQuery} />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>

            <Sheet open={showAddContact} onOpenChange={setShowAddContact}>
              <SheetTrigger asChild>
                <Button size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Contact</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto">
                <div className="h-full py-4 px-4 sm:px-6">
                  <ContactForm
                    onSuccess={() => setShowAddContact(false)}
                    onCancel={() => setShowAddContact(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Contact Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>All Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Recent</span>
            </TabsTrigger>
            <TabsTrigger value="starred" className="flex items-center space-x-2">
              <span>Starred</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ContactsGrid searchQuery={searchQuery} filter="all" />
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <ContactsGrid searchQuery={searchQuery} filter="recent" />
          </TabsContent>

          

          <TabsContent value="starred" className="space-y-4">
            <ContactsGrid searchQuery={searchQuery} filter="starred" />
          </TabsContent>
        </Tabs>
      </main>
      <NetworkChat open={showChat} onOpenChange={setShowChat} />
    </div>
  )
}