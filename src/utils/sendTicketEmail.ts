'use server'

import type { events, Ticket } from '@/types'
import { formatEventDateTime } from './eventDate'

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

function ensureJpegFormat(url: string) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('format', 'jpg')
    return parsed.toString()
  } catch {
    if (url.includes('format=')) {
      return url.replace(/format=[^&]*/i, 'format=jpg')
    }

    const separator = url.includes('?') ? (url.endsWith('?') || url.endsWith('&') ? '' : '&') : '?'
    return `${url}${separator}format=jpg`
  }
}

function buildQrCodeUrl(payload: string) {
  const configured = process.env.TICKETING_QR_BASE_URL
  const encodedPayload = encodeURIComponent(payload)
  const defaultBase = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=jpg&data='

  if (!configured) {
    return `${defaultBase}${encodedPayload}`
  }

  if (configured.includes('{DATA}')) {
    return ensureJpegFormat(configured.replace('{DATA}', encodedPayload))
  }

  if (configured.endsWith('=')) {
    return ensureJpegFormat(`${configured}${encodedPayload}`)
  }

  const hasQuery = configured.includes('?')
  const needsTrailingSeparator = configured.endsWith('?') || configured.endsWith('&')
  const separator = hasQuery ? (needsTrailingSeparator ? '' : '&') : '?'

  return ensureJpegFormat(`${configured}${separator}data=${encodedPayload}`)
}

function formatCurrency(amount: number) {
  try {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} CAD`
  }
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdfBuffer(lines: string[]) {
  const startX = 72
  const startY = 720
  const header = 'Event Ticket'
  const contentLines = lines.map((line) => escapePdfText(line))

  const streamParts = [
    'BT',
    '/F1 20 Tf',
    `${startX} ${startY} Td`,
    `(${escapePdfText(header)}) Tj`,
    '/F1 12 Tf',
  ]

  contentLines.forEach((line, index) => {
    const offset = index === 0 ? -32 : -18
    streamParts.push(`0 ${offset} Td`, `(${line}) Tj`)
  })

  streamParts.push('ET')

  const stream = streamParts.join('\n')
  const streamLength = Buffer.byteLength(stream, 'utf8')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdfContent = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdfContent, 'utf8'))
    pdfContent += object
  }

  const xrefPosition = Buffer.byteLength(pdfContent, 'utf8')
  const xrefEntries = offsets
    .slice(0, 6)
    .map((offset) => String(offset).padStart(10, '0'))
    .map((offset, index) => `${offset} 00000 ${index === 0 ? 'f' : 'n'} `)
    .join('\n')

  pdfContent += `xref\n0 6\n${xrefEntries}\ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${xrefPosition}\n%%EOF`

  return Buffer.from(pdfContent, 'utf8')
}

function generateTicketPdf({
  fullName,
  email,
  phone,
  event,
  ticket,
  reservationId,
  paymentIntent,
  qrCodeUrl,
}: {
  fullName: string
  email: string
  phone: string
  event: events
  ticket: Ticket
  reservationId: string
  paymentIntent: string
  qrCodeUrl: string
}) {
  const formattedDate = formatEventDateTime(event.date, 'en-CA')
  const formattedPrice = formatCurrency(ticket.price)

  const lines = [
    `Event: ${event.name}`,
    `Date: ${formattedDate}`,
    `Location: ${event.adresse}`,
    `Ticket: ${ticket.name}`,
    `Price: ${formattedPrice}`,
    `Reservation ID: ${reservationId}`,
    `Payment reference: ${paymentIntent}`,
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `QR code: ${qrCodeUrl}`,
  ]

  return buildPdfBuffer(lines)
}

function buildEmailHtml({
  fullName,
  event,
  ticket,
  reservationId,
  paymentIntent,
  qrCodeUrl,
}: {
  fullName: string
  event: events
  ticket: Ticket
  reservationId: string
  paymentIntent: string
  qrCodeUrl: string
}) {
  const formattedDate = formatEventDateTime(event.date, 'en-CA')
  const formattedPrice = formatCurrency(ticket.price)

  return `
   <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; padding:24px; font-family:Arial, sans-serif; color:#0f172a;">
  <tr>
    <td>

      <h1 style="color:#4f46e5; margin:0 0 16px 0;">Hello ${fullName},</h1>

      <p style="margin:0 0 16px 0;">
        Thank you for your reservation. Your ticket for 
        <strong>${event.name}</strong> is attached to this email as a PDF.
      </p>

      <p style="margin:0 0 16px 0;">
        You can also find the key details below for quick reference:
      </p>

      <!-- Ticket Info Box -->
      <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background-color:#1e293b; color:#f8fafc; margin-bottom:24px;">
        <tr>
          <td style="font-size:16px;">
            <p style="margin:0 0 8px 0;"><strong>Event:</strong> ${event.name}</p>
            <p style="margin:0 0 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:0 0 8px 0;"><strong>Location:</strong> ${event.adresse}</p>
            <p style="margin:0 0 8px 0;"><strong>Ticket:</strong> ${ticket.name}</p>
            <p style="margin:0 0 8px 0;"><strong>Price:</strong> ${formattedPrice}</p>
            <p style="margin:0 0 8px 0;"><strong>Reservation ID:</strong> ${reservationId}</p>
            <p style="margin:0;"><strong>Payment reference:</strong> ${paymentIntent}</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px 0;">
        Present the QR code below at the event entrance to validate your ticket.
      </p>

      <!-- QR Code -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align:center; margin-bottom:16px;">
        <tr>
          <td>
            <img src="${qrCodeUrl}" alt="Ticket QR code" width="220" height="220" style="display:block; margin:auto;" />
          </td>
        </tr>
      </table>

      <p style="font-size:14px; color:#475569; margin:0;">
        Keep this email for your records. If you have any questions, reply directly to this message.
      </p>

    </td>
  </tr>
</table>

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
    paymentIntent: payload.paymentIntent,
    qrCodeUrl,
  })

  const pdfBuffer = await generateTicketPdf({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    event: payload.event,
    ticket: payload.ticket,
    reservationId: payload.reservationId,
    paymentIntent: payload.paymentIntent,
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
      subject: `Your ticket for ${payload.event.name}`,
      html,
      attachments: [
        {
          filename: `${payload.event.name}-ticket.pdf`,
          content: pdfBuffer.toString('base64'),
          type: 'application/pdf',
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Échec de l'envoi du courriel de confirmation: ${errorText}`)
  }
}
