import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        const planKey = session.metadata?.plan_key

        if (!userId || !planKey) break

        await supabase.from('profiles').update({
          plan: planKey,
          stripe_subscription_id: session.subscription || null,
          subscription_status: 'active',
          subscription_end_date: planKey === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customer = await stripe.customers.retrieve(sub.customer)
        const userId = customer.metadata?.supabase_user_id
        if (!userId) break

        const isActive = ['active', 'trialing'].includes(sub.status)

        await supabase.from('profiles').update({
          subscription_status: sub.status,
          subscription_end_date: new Date(sub.current_period_end * 1000).toISOString(),
          plan: isActive ? (sub.items.data[0]?.price.id === process.env.STRIPE_PRICE_PRO_ANNUAL ? 'pro_annual' : 'pro_monthly') : 'free',
        }).eq('id', userId)

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customer = await stripe.customers.retrieve(sub.customer)
        const userId = customer.metadata?.supabase_user_id
        if (!userId) break

        await supabase.from('profiles').update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }).eq('id', userId)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customer = await stripe.customers.retrieve(invoice.customer)
        const userId = customer.metadata?.supabase_user_id
        if (!userId) break

        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('id', userId)

        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 })
  }
}
