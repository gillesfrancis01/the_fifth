'use server'

import type { events, Ticket } from '@/types'

interface TicketEmailPayload {
  customerId: string
  reservationId: string
  fullName: string
  email: string
  phone: string
  event: events
  ticket: Ticket
  paymentIntent: string
}

const RESEND_API_URL = 'https://api.resend.com/emails'

function assertEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.TICKETING_EMAIL_FROM

  if (!apiKey) {
    throw new Error('RESEND_API_KEY est requis pour envoyer les courriels de confirmation.')
  }

  if (!fromEmail) {
    throw new Error('TICKETING_EMAIL_FROM est requis pour envoyer les courriels de confirmation.')
  }

  return { apiKey, fromEmail }
}

function buildQrCodeUrl(payload: string) {
  const configured = process.env.TICKETING_QR_BASE_URL
  const encodedPayload = encodeURIComponent(payload)
  const defaultBase = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data='

  if (!configured) {
    return `${defaultBase}${encodedPayload}`
  }

  if (configured.includes('{DATA}')) {
    return configured.replace('{DATA}', encodedPayload)
  }

  if (configured.endsWith('=')) {
    return `${configured}${encodedPayload}`
  }

  const hasQuery = configured.includes('?')
  const needsTrailingSeparator = configured.endsWith('?') || configured.endsWith('&')
  const separator = hasQuery ? (needsTrailingSeparator ? '' : '&') : '?'

  return `${configured}${separator}data=${encodedPayload}`
}

function buildEmailHtml({
  fullName,
  event,
  ticket,
  reservationId,
  qrCodeUrl,
}: {
  fullName: string
  event: events
  ticket: Ticket
  reservationId: string
  qrCodeUrl: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; background-color: #f8fafc; padding: 24px;">
      <h1 style="color: #9f7aea;">Bonjour ${fullName},</h1>
      <p>Merci pour votre réservation. Voici les détails de votre billet pour <strong>${event.name}</strong>.</p>
      <div style="margin: 24px 0; padding: 16px; background: #1e293b; color: #f8fafc; border-radius: 12px;">
        <p style="margin: 0; font-size: 16px;"><strong>Événement :</strong> ${event.name}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Date :</strong> ${event.date}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Adresse :</strong> ${event.adresse}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Billet :</strong> ${ticket.name}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Identifiant de réservation :</strong> ${reservationId}</p>
      </div>
      <p style="margin-bottom: 16px;">Présentez le code QR ci-dessous à l’entrée de l’événement pour valider votre billet :</p>
      <div style="text-align: center; margin-bottom: 16px;">
        <img src="${qrCodeUrl}" alt="Code QR du billet" style="width: 220px; height: 220px;" />
      </div>
      <p style="font-size: 14px; color: #475569;">Conservez ce courriel précieusement. Si vous avez des questions, répondez simplement à ce message.</p>
    </div>
  `
}

export async function sendTicketConfirmationEmail(payload: TicketEmailPayload) {
  const { apiKey, fromEmail } = assertEmailConfig()

  const qrPayload = JSON.stringify({
    reservationId: payload.reservationId,
    ticketId: payload.ticket.$id,
    eventId: payload.event.$id,
    customerId: payload.customerId,
    email: payload.email,
    paymentIntent: payload.paymentIntent,
  })

  const qrCodeUrl = buildQrCodeUrl(qrPayload)

  const html = buildEmailHtml({
    fullName: payload.fullName,
    event: payload.event,
    ticket: payload.ticket,
    reservationId: payload.reservationId,
    qrCodeUrl,
  })

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.email],
      subject: `Votre billet pour ${payload.event.name}`,
      html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Échec de l'envoi du courriel de confirmation: ${errorText}`)
  }
}
