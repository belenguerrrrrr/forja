'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTracker(userId, date = new Date().toISOString().split('T')[0]) {
  const [log, setLog] = useState(null)
  const [foodEntries, setFoodEntries] = useState([])
  const [workoutEntries, setWorkoutEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLog = async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const [{ data: logData }, { data: foods }, { data: workouts }] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('user_id', userId).eq('log_date', date).single(),
      supabase.from('food_entries').select('*').eq('user_id', userId).eq('log_date', date).order('created_at', { ascending: true }),
      supabase.from('workout_entries').select('*').eq('user_id', userId).eq('log_date', date).order('created_at', { ascending: true }),
    ])
    setLog(logData)
    setFoodEntries(foods || [])
    setWorkoutEntries(workouts || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchLog()
  }, [userId, date])

  // ─── Check-in matutino ────────────────────────────────────
  const morningCheckin = async ({ weight, sleepHours, sleepQuality, energyLevel }) => {
    const { error } = await supabase.from('daily_logs').upsert({
      user_id: userId,
      log_date: date,
      weight_morning: weight ? parseFloat(weight) : null,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      sleep_quality: sleepQuality || null,
      energy_level: energyLevel || null,
    })
    if (!error) await fetchLog()
    return { error }
  }

  // ─── Food entries ─────────────────────────────────────────
  const addFoodEntry = async (entry) => {
    const { data, error } = await supabase
      .from('food_entries')
      .insert({ ...entry, user_id: userId, log_date: date })
      .select()
      .single()

    if (!error && data) {
      const updated = [...foodEntries, data]
      setFoodEntries(updated)
      await recalculateFoodTotals(updated)
    }
    return { data, error }
  }

  // Insertar varios alimentos de golpe (evita stale closure al añadir desde IA)
  const addFoodEntries = async (entries) => {
    const { data, error } = await supabase
      .from('food_entries')
      .insert(entries.map(e => ({ ...e, user_id: userId, log_date: date })))
      .select()

    if (!error && data) {
      const updated = [...foodEntries, ...data]
      setFoodEntries(updated)
      await recalculateFoodTotals(updated)
    }
    return { data, error }
  }

  const removeFoodEntry = async (id) => {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) {
      const updated = foodEntries.filter(f => f.id !== id)
      setFoodEntries(updated)
      await recalculateFoodTotals(updated)
    }
    return { error }
  }

  const recalculateFoodTotals = async (entries) => {
    const totals = (entries || []).reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (parseFloat(e.protein) || 0),
        carbs: acc.carbs + (parseFloat(e.carbs) || 0),
        fat: acc.fat + (parseFloat(e.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    const { data: updatedLog } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        log_date: date,
        calories_consumed: totals.calories,
        protein_consumed: parseFloat(totals.protein.toFixed(1)),
        carbs_consumed: parseFloat(totals.carbs.toFixed(1)),
        fat_consumed: parseFloat(totals.fat.toFixed(1)),
      })
      .select()
      .single()

    if (updatedLog) setLog(updatedLog)
    else setLog(prev => prev ? {
      ...prev,
      calories_consumed: totals.calories,
      protein_consumed: totals.protein,
      carbs_consumed: totals.carbs,
      fat_consumed: totals.fat,
    } : null)
  }

  // ─── Workout entries ──────────────────────────────────────
  const addWorkoutEntry = async (entry) => {
    const { data, error } = await supabase
      .from('workout_entries')
      .insert({ ...entry, user_id: userId, log_date: date })
      .select()
      .single()

    if (!error && data) {
      const updated = [...workoutEntries, data]
      setWorkoutEntries(updated)
      await recalculateWorkoutCalories(updated)
    }
    return { data, error }
  }

  const removeWorkoutEntry = async (id) => {
    const { error } = await supabase
      .from('workout_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) {
      const updated = workoutEntries.filter(w => w.id !== id)
      setWorkoutEntries(updated)
      await recalculateWorkoutCalories(updated)
    }
    return { error }
  }

  const recalculateWorkoutCalories = async (entries) => {
    const totalBurned = (entries || []).reduce((s, w) => s + (w.calories_burned || 0), 0)
    await supabase.from('daily_logs').upsert({
      user_id: userId,
      log_date: date,
      calories_burned: totalBurned,
    })
    setLog(prev => prev ? { ...prev, calories_burned: totalBurned } : null)
  }

  return {
    log,
    foodEntries,
    workoutEntries,
    loading,
    morningCheckin,
    addFoodEntry,
    addFoodEntries,
    removeFoodEntry,
    addWorkoutEntry,
    removeWorkoutEntry,
    refetch: fetchLog,
  }
}
