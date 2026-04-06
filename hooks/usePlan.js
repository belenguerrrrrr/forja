'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePlan(userId) {
  const [plan, setPlan] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const fetchPlan = async () => {
      const [{ data: plan }, { data: userData }] = await Promise.all([
        supabase
          .from('plans')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('user_data')
          .select('*')
          .eq('user_id', userId)
          .single(),
      ])

      setPlan(plan)
      setUserData(userData)
      setLoading(false)
    }

    fetchPlan()
  }, [userId])

  return { plan, userData, loading }
}
