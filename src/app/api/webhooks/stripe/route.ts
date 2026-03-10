import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { upsertAppwriteCustomer } from '@/app/actions/upsertAppwriteCustomer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string

    let event: Stripe.Event

    try {
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not set')
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { metadata, receipt_email } = paymentIntent

        if (metadata && metadata.ticketId && metadata.eventId) {
            try {
                await upsertAppwriteCustomer({
                    fullName: metadata.name,
                    email: receipt_email || (metadata.email as string),
                    phone: metadata.phone,
                    eventId: metadata.eventId,
                    ticketId: metadata.ticketId,
                    paymentIntent: paymentIntent.id,
                    quantity: Number(metadata.quantity || 1),
                })
                console.log(`Successfully processed ticket for PI: ${paymentIntent.id}`)
            } catch (error) {
                console.error('Error in upsertAppwriteCustomer:', error)
                return NextResponse.json({ error: 'Error processing ticket' }, { status: 500 })
            }
        } else {
            console.warn('Missing metadata in payment intent', paymentIntent.id)
        }
    }

    return NextResponse.json({ received: true })
}
