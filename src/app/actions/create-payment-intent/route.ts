import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from "../../../../config/appwrite"
import { Query } from "node-appwrite"
import { PromoCode } from "@/types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string,)

export async function POST(req: NextRequest) {
  const { ticket, name, email, phone, quantity, promoCode } = await req.json()
  const ticketQuantity = Math.max(1, Number(quantity ?? 1))

  let finalAmount = ticket.price * ticketQuantity

  // Server-side Promo Validation
  if (promoCode) {
    try {
      const { databases } = await createAdminClient()
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

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(finalAmount * 100), // Stripe expects integers
    currency: 'cad',
    metadata: {
      ticketId: ticket.$id,
      name,
      phone,
      quantity: ticketQuantity,
      promoCode: promoCode || null
    },
    receipt_email: email,
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
