'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTracker(userId, date = new Date().toISOString().split('T')[0]) {
  const [log, setLog] = useState(null)
  const [foodEntries, setFoodEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLog = async () => {
    const [{ data: log }, { data: foodEntries }] = await Promise.all([
      supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)
        .single(),
      supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', date)
        .order('created_at', { ascending: true }),
    ])

    setLog(log)
    setFoodEntries(foodEntries || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) return
    fetchLog()
  }, [userId, date])

  const addFoodEntry = async (entry) => {
    const { data, error } = await supabase
      .from('food_entries')
      .insert({ ...entry, user_id: userId, log_date: date })
      .select()
      .single()

    if (!error) {
      setFoodEntries(prev => [...prev, data])
      await updateDailyLog()
    }
    return { data, error }
  }

  const updateDailyLog = async () => {
    // Recalcular totales desde food_entries
    const { data: entries } = await supabase
      .from('food_entries')
      .select('calories, protein, carbs, fat')
      .eq('user_id', userId)
      .eq('log_date', date)

    const totals = entries?.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fat: acc.fat + (e.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 }

    await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        log_date: date,
        calories_consumed: totals.calories,
        protein_consumed: totals.protein,
        carbs_consumed: totals.carbs,
        fat_consumed: totals.fat,
      })

    await fetchLog()
  }

  const logWorkout = async (workoutData) => {
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        log_date: date,
        workout_done: true,
        ...workoutData,
      })

    if (!error) await fetchLog()
    return { error }
  }

  return { log, foodEntries, loading, addFoodEntry, logWorkout, refetch: fetchLog }
}
