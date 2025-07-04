// app/actions/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, ticket } = body

    if (!name || !email || !phone || !ticket) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: ticket.price * 100,
            product_data: {
              name: ticket.name,
              description: `Ticket pour ${ticket.name}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        name,
        phone,
        ticketId: ticket.$id,
      },
      mode: 'payment',
      success_url: `${req.nextUrl.origin}`,
      cancel_url: `${req.nextUrl.origin}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
