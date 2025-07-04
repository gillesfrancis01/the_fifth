import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, )

export async function POST(req: NextRequest) {
  const { ticket, name, email, phone } = await req.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: ticket.price * 100,
    currency: 'cad',
    metadata: { ticketId: ticket.$id, name, phone },
    receipt_email: email,
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
