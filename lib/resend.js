import { Resend } from 'resend'

export async function sendWelcomeEmail(email, name, planSummary) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: '🔥 Tu plan FORJA está listo',
    html: `
      <div style="font-family: 'DM Sans', sans-serif; background: #0A0A0F; color: #F1F0ED; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
        <h1 style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: #FF4D1C; margin: 0 0 8px;">FORJA</h1>
        <h2 style="color: #F1F0ED; margin: 0 0 24px;">Tu plan está listo, ${name || 'campeón'} 💪</h2>
        <p style="color: #6B6B7B; line-height: 1.6;">${planSummary}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pro" style="display: inline-block; margin-top: 32px; background: #FF4D1C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Ver mi plan →
        </a>
      </div>
    `,
  })
}

export async function sendWeeklyReport(email, name, reportData) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: `📊 Tu resumen semanal FORJA — Semana del ${reportData.week_start}`,
    html: `
      <div style="font-family: 'DM Sans', sans-serif; background: #0A0A0F; color: #F1F0ED; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
        <h1 style="font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: #FF4D1C; margin: 0 0 8px;">FORJA</h1>
        <h2 style="color: #F1F0ED;">Tu semana en números, ${name || 'campeón'}</h2>
        <div style="margin: 24px 0; padding: 20px; background: #13131A; border-radius: 8px;">
          <p>🏋️ Entrenamientos: <strong>${reportData.total_workouts}/semana</strong></p>
          <p>📈 Adherencia: <strong>${reportData.adherence_percentage}%</strong></p>
          <p>⚖️ Cambio de peso: <strong>${reportData.weight_change > 0 ? '+' : ''}${reportData.weight_change}kg</strong></p>
        </div>
        <p style="color: #6B6B7B; line-height: 1.6;">${reportData.report_text}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pro" style="display: inline-block; margin-top: 32px; background: #FF4D1C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Ver dashboard →
        </a>
      </div>
    `,
  })
}
