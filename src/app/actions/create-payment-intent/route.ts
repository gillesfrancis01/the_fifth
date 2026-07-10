import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from "../../../../config/appwrite"
import { Query } from "node-appwrite"
import { PromoCode } from "@/types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string,)

const PROV_TAX_RATES: Record<string, number> = {
  QC: 0.14975,
  ON: 0.13,
  BC: 0.12,
  AB: 0.05,
  MB: 0.12,
  NB: 0.15,
  NL: 0.15,
  NS: 0.15,
  PE: 0.15,
  SK: 0.11,
  NT: 0.05,
  NU: 0.05,
  YT: 0.05,
}

export async function POST(req: NextRequest) {
  try {
    const { ticket, name, email, phone, quantity, promoCode, eventId, province } = await req.json()

    if (!ticket?.$id) {
      return NextResponse.json({ error: 'Ticket invalide' }, { status: 400 })
    }

    const ticketQuantity = Math.max(1, Number(quantity ?? 1))
    const { databases } = await createAdminClient()

    // Le prix vient toujours d'Appwrite, jamais du client, pour empêcher
    // la falsification du montant payé.
    const ticketDoc = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET!,
      ticket.$id
    )

    let finalAmount = ticketDoc.price * ticketQuantity

    // Server-side Promo Validation
    if (promoCode) {
      try {
        const { documents } = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROMO_CODES!,
          [
            Query.equal('code', promoCode),
            Query.equal('active', true)
          ]
        )

        if (documents.length > 0) {
          const promo = documents[0] as unknown as PromoCode
          if (promo.type === 'percentage') {
            finalAmount = finalAmount - (finalAmount * (promo.value / 100))
          } else if (promo.type === 'fixed') {
            finalAmount = Math.max(0, finalAmount - promo.value)
          }
        }
      } catch (error) {
        console.error("Promo validation error in payment intent", error)
      }
    }

    // Calculate and apply taxes
    const taxRate = PROV_TAX_RATES[province as string] ?? 0.0
    const taxAmount = finalAmount * taxRate
    finalAmount = finalAmount + taxAmount

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Stripe expects integers
      currency: 'cad',
      metadata: {
        ticketId: ticket.$id,
        eventId,
        name,
        phone,
        quantity: ticketQuantity,
        promoCode: promoCode || null
      },
      receipt_email: email,
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Payment intent error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
