'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  totalContacts: number
  recentContacts: number
  enrichedContacts: number
  thisWeekGrowth: number
}

export default function ContactStats() {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    recentContacts: 0,
    enrichedContacts: 0,
    thisWeekGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get recent contacts (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { count: recentContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString())

      // Get enriched contacts
      const { count: enrichedContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('enrichment_data', 'is', null)

      // Calculate growth percentage
      const thisWeekGrowth = totalContacts && totalContacts > 0
        ? Math.round((recentContacts! / totalContacts) * 100)
        : 0

      setStats({
        totalContacts: totalContacts || 0,
        recentContacts: recentContacts || 0,
        enrichedContacts: enrichedContacts || 0,
        thisWeekGrowth
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts,
      icon: Users,
      description: 'All contacts in your network'
    },
    {
      title: 'This Week',
      value: stats.recentContacts,
      icon: Activity,
      description: 'New contacts added'
    },
    {
      title: 'AI Enriched',
      value: stats.enrichedContacts,
      icon: UserPlus,
      description: 'Contacts with enhanced data'
    },
    {
      title: 'Growth',
      value: `${stats.thisWeekGrowth}%`,
      icon: TrendingUp,
      description: 'Weekly growth rate'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="w-8 h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}