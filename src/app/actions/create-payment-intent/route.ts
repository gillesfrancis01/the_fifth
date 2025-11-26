import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, )

export async function POST(req: NextRequest) {
  const { ticket, name, email, phone, quantity } = await req.json()
  const ticketQuantity = Math.max(1, Number(quantity ?? 1))

  const paymentIntent = await stripe.paymentIntents.create({
    amount: ticket.price * 100 * ticketQuantity,
    currency: 'cad',
    metadata: { ticketId: ticket.$id, name, phone, quantity: ticketQuantity },
    receipt_email: email,
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
