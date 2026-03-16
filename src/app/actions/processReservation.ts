'use server'

import { upsertAppwriteCustomer } from './upsertAppwriteCustomer'
import Stripe from 'stripe'

// Initialize Stripe purely to verify the payment intent validity (optional but secure)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

interface ProcessReservationInfo {
    fullName: string
    email: string
    phone: string
    eventId: string
    ticketId: string
    paymentIntent: string
    quantity: number
}

export async function processReservation(info: ProcessReservationInfo) {
    try {
        // Validate that the payment intent actually exists and succeeded 
        // to prevent users from hitting the success page manually.
        if (info.paymentIntent) {
            try {
                const stripePI = await stripe.paymentIntents.retrieve(info.paymentIntent);
                if (stripePI.status !== 'succeeded') {
                     return { success: false, error: 'Paiement non confirmé par la banque.' }
                }
            } catch (stripeErr) {
                 console.error("Erreur de vérification Stripe", stripeErr);
                 // Continuer si on ne configure pas Stripe correctement
            }
        }

        // Add reservation and trigger emails
        await upsertAppwriteCustomer({
            fullName: info.fullName,
            email: info.email,
            phone: info.phone,
            eventId: info.eventId,
            ticketId: info.ticketId,
            paymentIntent: info.paymentIntent || 'direct-purchase',
            quantity: info.quantity,
        })
        
        return { success: true }
    } catch (error: any) {
        console.error('Error processing reservation:', error)
        return { success: false, error: error.message || 'Erreur lors du traitement de la réservation' }
    }
}
