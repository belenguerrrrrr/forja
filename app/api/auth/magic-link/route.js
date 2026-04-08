import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const supabase = createServiceClient()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Generar OTP link con Supabase Admin
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      }
    })

    if (error) {
      console.error('Generate link error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const magicLink = data.properties?.action_link
    if (!magicLink) return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })

    // Enviar email con Resend
    const { error: emailError } = await resend.emails.send({
      from: 'FORJA <noreply@forjafit.es>',
      to: email,
      subject: 'Tu enlace de acceso a FORJA',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="margin-bottom: 32px;">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="22" fill="#0F172A"/>
              <polygon points="62,12 36,52 56,52 40,88 72,44 52,44 64,12" fill="white"/>
            </svg>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">Tu enlace de acceso</h1>
          <p style="color: #64748B; margin-bottom: 32px;">Haz clic en el botón para acceder a FORJA. El enlace es válido durante 1 hora.</p>
          <a href="${magicLink}" style="display: inline-block; background: #16A34A; color: white; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px;">
            Acceder a FORJA →
          </a>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 32px;">Si no solicitaste este acceso, ignora este email.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Magic link error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
