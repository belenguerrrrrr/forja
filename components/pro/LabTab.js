'use client'

import { useState } from 'react'

export default function LabTab({ plan, userData }) {
  const [scenario, setScenario] = useState({
    dailyCalories:  plan?.daily_calories || 2000,
    weeklyWorkouts: userData?.training_days_per_week || 3,
    currentWeight:  userData?.current_weight || 80,
    targetWeight:   userData?.target_weight || 70,
  })

  const deficit           = scenario.dailyCalories < (plan?.daily_calories || 2000)
    ? (plan?.daily_calories || 2000) - scenario.dailyCalories : 0
  const weeklyCalorieBurn = scenario.weeklyWorkouts * 350
  const totalWeeklyDef    = deficit * 7 + weeklyCalorieBurn
  const kgPerWeek         = totalWeeklyDef / 7700
  const weightDiff        = Math.abs(scenario.currentWeight - scenario.targetWeight)
  const weeksNeeded       = kgPerWeek > 0 ? Math.ceil(weightDiff / kgPerWeek) : null
  const estimatedDate     = weeksNeeded
    ? new Date(Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-[#0F172A] mb-1">Simulador de escenarios</h3>
        <p className="text-xs text-[#64748B]">Ajusta las variables y ve cuándo alcanzarías tu objetivo.</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-5">
        {[
          { label: 'Calorías diarias',         key: 'dailyCalories',  min: 1200, max: 4000, unit: 'kcal', step: 50 },
          { label: 'Entrenamientos/semana',     key: 'weeklyWorkouts', min: 0,    max: 7,    unit: 'días', step: 1 },
          { label: 'Peso actual',               key: 'currentWeight',  min: 40,   max: 200,  unit: 'kg',   step: 0.5 },
          { label: 'Peso objetivo',             key: 'targetWeight',   min: 40,   max: 200,  unit: 'kg',   step: 0.5 },
        ].map(s => (
          <div key={s.key}>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#64748B]">{s.label}</label>
              <span className="text-xs font-semibold text-[#0F172A]">{scenario[s.key]} {s.unit}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={scenario[s.key]}
              onChange={e => setScenario(prev => ({ ...prev, [s.key]: Number(e.target.value) }))}
              style={{ accentColor: '#16A34A' }} className="w-full h-5 cursor-pointer"/>
          </div>
        ))}
      </div>

      <div className={`rounded-xl p-5 border ${weeksNeeded ? 'bg-[#16A34A]/10 border-[#16A34A]/30' : 'bg-white border-[#E2E8F0]'}`}>
        <h4 className="text-sm font-semibold text-[#0F172A] mb-4">Proyección estimada</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#16A34A]">{kgPerWeek > 0 ? kgPerWeek.toFixed(2) : '0'}</div>
            <div className="text-xs text-[#64748B] mt-1">kg/semana</div>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#16A34A]">{weeksNeeded || '∞'}</div>
            <div className="text-xs text-[#64748B] mt-1">semanas</div>
          </div>
        </div>
        {estimatedDate && (
          <div className="text-center">
            <div className="text-xs text-[#64748B] mb-1">Fecha estimada</div>
            <div className="text-lg font-semibold text-[#22C55E]">{estimatedDate}</div>
          </div>
        )}
        {!weeksNeeded && (
          <p className="text-sm text-[#64748B] text-center">Aumenta el déficit calórico o añade más entrenamientos.</p>
        )}
        <p className="mt-4 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
          ⚠️ Estimación basada en 7.700 kcal = 1kg. Los resultados reales varían.
        </p>
      </div>
    </div>
  )
}
