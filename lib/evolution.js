// ─── Helpers de fecha ─────────────────────────────────────────────────────────
function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function daysBetween(startISO, endISO) {
  const a = new Date(startISO + 'T12:00:00')
  const b = new Date(endISO + 'T12:00:00')
  return Math.round((b - a) / 86400000)
}

function isoWeekLabel(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  const weekDay = d.getDay() || 7
  d.setDate(d.getDate() + 4 - weekDay)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `S${week}`
}

function mondayOf(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return d.toISOString().split('T')[0]
}

// ─── Rangos de fechas ─────────────────────────────────────────────────────────
export function getWeekRange(refDate) {
  const mon = mondayOf(refDate)
  return [mon, addDays(mon, 6)]
}

export function getMonthRange(refDate) {
  const d = new Date(refDate + 'T12:00:00')
  const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return [first, `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`]
}

export function getYearRange(refDate) {
  const year = refDate.slice(0, 4)
  return [`${year}-01-01`, `${year}-12-31`]
}

// ─── Cargar rango de días desde localStorage ──────────────────────────────────
export function loadRange(startISO, endISO) {
  const today = localToday()
  const end = endISO > today ? today : endISO
  const count = daysBetween(startISO, end) + 1
  const snapshots = []

  for (let i = 0; i < count; i++) {
    const date = addDays(startISO, i)
    let raw = null
    try {
      const stored = localStorage.getItem(`forja_tracker_${date}`)
      if (stored) raw = JSON.parse(stored)
    } catch {}

    const meals = raw?.meals || {}
    const allItems = Object.values(meals).flat()
    const kcal = allItems.reduce((a, it) => a + (it.calories || 0), 0)
    const protein = allItems.reduce((a, it) => a + (it.protein || 0), 0)
    const carbs = allItems.reduce((a, it) => a + (it.carbs || 0), 0)
    const fat = allItems.reduce((a, it) => a + (it.fat || 0), 0)
    const burned = (raw?.workouts || []).reduce((a, w) => a + (w.calories_burned || 0), 0)
    const weightRaw = raw?.checkin?.weight
    const weight = weightRaw && Number(weightRaw) > 0 ? Number(weightRaw) : null

    snapshots.push({
      date,
      kcal: Math.round(kcal),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      burned: Math.round(burned),
      net: Math.round(kcal - burned),
      weight,
      sleep_hours: raw?.checkin?.sleep_hours || null,
      hasData: allItems.length > 0 || (raw?.workouts || []).length > 0,
    })
  }

  return snapshots
}

// ─── Agrupar en semanas ───────────────────────────────────────────────────────
export function aggregateToWeeks(snapshots) {
  const weeks = {}
  for (const snap of snapshots) {
    const mon = mondayOf(snap.date)
    if (!weeks[mon]) weeks[mon] = { monday: mon, label: isoWeekLabel(snap.date), days: [] }
    weeks[mon].days.push(snap)
  }
  return Object.values(weeks)
    .sort((a, b) => a.monday.localeCompare(b.monday))
    .map(w => {
      const activeDays = w.days.filter(d => d.hasData)
      const weights = w.days.map(d => d.weight).filter(Boolean)
      return {
        monday: w.monday,
        label: w.label,
        avgKcal: activeDays.length ? Math.round(activeDays.reduce((a, d) => a + d.kcal, 0) / activeDays.length) : 0,
        totalKcal: activeDays.reduce((a, d) => a + d.kcal, 0),
        avgWeight: weights.length ? Math.round((weights.reduce((a, w) => a + w, 0) / weights.length) * 10) / 10 : null,
        activeDays: activeDays.length,
        days: w.days,
      }
    })
}

// ─── Proyección de peso ───────────────────────────────────────────────────────
export function computeProjection(snapshots, targetCal) {
  // Usar los últimos 30 días con datos para la proyección
  const active = snapshots.filter(d => d.hasData).slice(-30)
  if (active.length < 3) return null

  const avgNet = active.reduce((a, d) => a + d.net, 0) / active.length
  const avgDailyBalance = avgNet - targetCal  // positivo = superávit, negativo = déficit
  const kgPerWeek = (avgDailyBalance * 7) / 7700

  // Peso más reciente
  const withWeight = snapshots.filter(d => d.weight !== null)
  const latestWeight = withWeight.length ? withWeight[withWeight.length - 1].weight : null

  return {
    avgDailyBalance: Math.round(avgDailyBalance),
    kgPerWeek: Math.round(kgPerWeek * 100) / 100,
    projectedWeight4w:  latestWeight !== null ? Math.round((latestWeight + kgPerWeek * 4) * 10) / 10 : null,
    projectedWeight12w: latestWeight !== null ? Math.round((latestWeight + kgPerWeek * 12) * 10) / 10 : null,
    latestWeight,
    dataPoints: active.length,
  }
}
