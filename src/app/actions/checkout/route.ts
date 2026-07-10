// app/actions/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '../../../../config/appwrite'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, ticket } = body

    if (!name || !email || !phone || !ticket?.$id) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Le prix et le nom viennent toujours d'Appwrite, jamais du client,
    // pour empêcher la falsification du montant payé.
    const { databases } = await createAdminClient()
    const ticketDoc = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET!,
      ticket.$id
    )

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(ticketDoc.price * 100),
            product_data: {
              name: ticketDoc.name,
              description: `Ticket pour ${ticketDoc.name}`,
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
  } catch (error) {
    console.error('Stripe error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
