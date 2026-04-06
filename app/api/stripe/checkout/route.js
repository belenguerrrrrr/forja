import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { planKey } = await request.json()
    const plan = PLANS[planKey]
    if (!plan) return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    // Crear o recuperar customer de Stripe
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const isOneTime = plan.interval === 'once'

    // Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: isOneTime ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#precios`,
      metadata: {
        supabase_user_id: user.id,
        plan_key: planKey,
      },
      locale: 'es',
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Error creando sesión de pago' }, { status: 500 })
  }
}
