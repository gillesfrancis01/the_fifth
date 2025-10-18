'use server'

import type { events, Ticket } from '@/types'

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function createPdfDocument(lines: string[]) {
  const header = '%PDF-1.4\n'
  const objects: Buffer[] = [Buffer.from(header, 'utf8')]
  const offsets: number[] = Array(6).fill(0)
  let currentOffset = Buffer.byteLength(header)

  const addObject = (index: number, body: string) => {
    offsets[index] = currentOffset
    const objectString = `${index} 0 obj\n${body}\nendobj\n`
    const buffer = Buffer.from(objectString, 'utf8')
    objects.push(buffer)
    currentOffset += buffer.length
  }

  const lineHeight = 18
  const marginLeft = 50
  let cursorY = 770
  const contentParts = lines.map((rawLine) => {
    const line = escapePdfText(rawLine)
    const part = `BT /F1 12 Tf 1 0 0 1 ${marginLeft} ${cursorY} Tm (${line}) Tj ET`
    cursorY -= lineHeight
    return part
  })
  const contentStream = contentParts.join('\n')
  const contentLength = Buffer.byteLength(contentStream, 'utf8')

  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>')
  addObject(2, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>')
  addObject(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  )
  offsets[4] = currentOffset
  const streamHeader = `4 0 obj\n<< /Length ${contentLength} >>\nstream\n`
  const streamFooter = '\nendstream\nendobj\n'
  const streamBuffers = [
    Buffer.from(streamHeader, 'utf8'),
    Buffer.from(contentStream, 'utf8'),
    Buffer.from(streamFooter, 'utf8'),
  ]
  streamBuffers.forEach((buffer) => {
    objects.push(buffer)
    currentOffset += buffer.length
  })

  addObject(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  const xrefOffset = currentOffset
  const xrefParts = [
    'xref\n',
    '0 6\n',
    '0000000000 65535 f \n',
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`),
    'trailer\n',
    '<< /Size 6 /Root 1 0 R >>\n',
    'startxref\n',
    `${xrefOffset}\n`,
    '%%EOF',
  ]

  objects.push(Buffer.from(xrefParts.join(''), 'utf8'))

  return Buffer.concat(objects)
}

function formatCurrency(amount: number) {
  try {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    return `${amount.toFixed(2)} CAD`
  }
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  try {
    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date)
  } catch (error) {
    return date.toISOString()
  }
}

function buildInvoiceLines({
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
  const lines: string[] = []

  lines.push('Facture et Billet')
  lines.push('-----------------------------')
  lines.push(`Numéro de réservation : ${reservationId}`)
  lines.push(`Référence de paiement : ${paymentIntent}`)
  lines.push('')
  lines.push('Client')
  lines.push(`  Nom : ${fullName}`)
  lines.push(`  Courriel : ${email}`)
  lines.push(`  Téléphone : ${phone}`)
  lines.push('')
  lines.push('Événement')
  lines.push(`  Nom : ${event.name}`)
  lines.push(`  Date : ${formatDateTime(event.date)}`)
  lines.push(`  Adresse : ${event.adresse}`)
  lines.push('')
  lines.push('Billet')
  lines.push(`  Type : ${ticket.name}`)
  lines.push(`  Prix : ${formatCurrency(ticket.price)}`)
  lines.push(`  QR Code : ${qrCodeUrl}`)

  return lines
}

async function buildInvoicePdf(payload: {
  fullName: string
  email: string
  phone: string
  event: events
  ticket: Ticket
  reservationId: string
  paymentIntent: string
  qrCodeUrl: string
}) {
  const lines = buildInvoiceLines(payload)

  return createPdfDocument(lines)
}

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
      <p style="margin-bottom: 16px;">Votre facture et votre billet sont également disponibles en pièce jointe au format PDF.</p>
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

  const invoicePdf = await buildInvoicePdf({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    event: payload.event,
    ticket: payload.ticket,
    reservationId: payload.reservationId,
    paymentIntent: payload.paymentIntent,
    qrCodeUrl,
  })

  const pdfBase64 = invoicePdf.toString('base64')

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
      attachments: [
        {
          filename: `facture-billet-${payload.reservationId}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf',
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Échec de l'envoi du courriel de confirmation: ${errorText}`)
  }
}
