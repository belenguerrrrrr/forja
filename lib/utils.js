import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

// Calcular BMR (Mifflin-St Jeor)
export function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5)
  }
  return Math.round(10 * weight + 6.25 * height - 5 * age - 161)
}

// Multiplicadores TDEE
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55))
}

// Calorías quemadas estimadas por actividad (kcal/min según peso)
export function estimateCaloriesBurned(activityType, durationMinutes, weightKg) {
  const MET_VALUES = {
    running: 9.8,
    cycling: 7.5,
    swimming: 8.0,
    strength: 5.0,
    hiit: 10.0,
    yoga: 2.5,
    walking: 3.5,
    other: 5.0,
  }
  const met = MET_VALUES[activityType] || 5.0
  return Math.round((met * weightKg * durationMinutes) / 60)
}

// Formatear fecha en español
export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Días de la semana en español
export const DAYS_ES = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

// Objetivos en español
export const GOALS_ES = {
  lose_weight: 'Perder peso',
  gain_muscle: 'Ganar músculo',
  run_marathon: 'Correr una maratón',
  get_fit: 'Ponerme en forma',
  custom: 'Objetivo personalizado',
}

// Nivel de actividad en español
export const ACTIVITY_ES = {
  sedentary: 'Sedentario (trabajo de escritorio, poco movimiento)',
  light: 'Ligero (camino algo, 1-2 días de ejercicio)',
  moderate: 'Moderado (3-4 días de ejercicio/semana)',
  active: 'Activo (5+ días de ejercicio/semana)',
  very_active: 'Muy activo (atleta, trabajo físico)',
}

// Colores para macros
export const MACRO_COLORS = {
  protein: '#FF4D1C',
  carbs: '#FF8A3D',
  fat: '#22C55E',
}
