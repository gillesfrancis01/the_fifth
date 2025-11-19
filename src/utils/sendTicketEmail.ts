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
<table width="100%" cellpadding="0" cellspacing="0" border="0" 
  style="background-color:#e5e7eb; padding:24px; font-family:Arial, sans-serif; color:#000;">
  <tr>
    <td align="center">

      <!-- OUTER WRAPPER -->
      <table width="720" cellpadding="0" cellspacing="0" border="0" 
        style="background:#ffffff; border:1px solid #cfcfcf; border-radius:12px; overflow:hidden;">

        <!-- TOP CUT EFFECT -->
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" height="20" 
                  style="border-bottom:1px dashed #ccc; border-right:1px dashed #ccc;">
                </td>
                <td width="50%" height="20" style="border-bottom:1px dashed #ccc;"></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- HEADER -->
        <tr>
          <td style="padding:12px 20px; font-size:14px; color:#444; border-bottom:1px solid #e5e5e5;">
            Ceci est votre billet
          </td>
        </tr>

        <!-- MAIN TICKET BODY -->
        <tr>
          <td style="padding:0;">

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>

                <!-- LEFT SIDE -->
                <td width="38%" valign="top" 
                  style="padding:24px; border-right:2px dashed #cccccc;">

                  <!-- QR -->
                  <table width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:16px;">
                        <img src="${qrCodeUrl}" alt="QR Code" width="190" height="190"
                          style="display:block; border:1px solid #ddd; padding:4px;" />
                      </td>
                    </tr>

                    <!-- SERIAL + ORDER -->
                    <tr>
                      <td align="center" style="font-size:12px; color:#444; line-height:1.4;">
                        <span style="font-size:11px; color:#666;">Numero de Paiement</span><br>
                        ${paymentIntent}<br><br>
                        <span style="font-size:11px; color:#666;">NUMÉRO DE COMMANDE</span><br>
                        <span style="font-size:17px; font-weight:bold; color:#111;">
                          ${reservationId}
                        </span>
                      </td>
                    </tr>
                  </table>

                </td>

                <!-- RIGHT SIDE -->
                <td width="62%" valign="top" style="padding:24px;">

                  <!-- DATE -->
                  <p style="margin:0 0 14px 0; font-size:14px; color:#000; line-height:1.5;">
                    📅 <strong>${formattedDate}</strong><br>
                  </p>

                  <!-- EVENT NAME -->
                  <p style="margin:0 0 18px 0; font-size:22px; line-height:1.25; font-weight:bold; color:#000;">
                    ${event.name}
                  </p>

                  <!-- INFO BLOCK -->
                  <p style="margin:0; font-size:15px; color:#000; line-height:1.6;">
                    <strong>BILLET RÉGULIER</strong><br>
                    👤 Délivré à : <strong>${fullName}</strong><br>
                    📍 ${event.adresse}<br>
                    💵 ${formattedPrice}
                  </p>

                  <br>

                  <!-- TICKET TYPE -->
                  <p style="margin:0; font-size:15px; color:#000;">
                    <strong>TYPE DE BILLET</strong><br>
                    ADMISSION GÉNÉRALE
                  </p>

                </td>

              </tr>
            </table>

          </td>
        </tr>

        <!-- LOCATION FOOTER -->
        <tr>
          <td style="padding:24px; font-size:14px; color:#111; border-top:1px solid #e5e5e5;">
            <strong>${event.adresse}</strong><br>
            ${event.adresse}<br><br>
            
          </td>
        </tr>

        <!-- LEGAL -->
        <tr>
          <td style="padding:22px; background:#f7f7f7; font-size:12px; color:#555; line-height:1.5;">
            Tous les billets sont en vente finale et ne peuvent être ni échangés ni remboursés.
            Dans le cas d'une annulation d'événement sans date de report, un remboursement complet 
            sera automatiquement émis à chaque client sur la carte de crédit utilisée pour l'achat.
            En achetant un billet pour cet événement, vous acceptez cette politique d'achat.
            <br><br>
            Avant d'acheter vos billets, veuillez confirmer titre, heure et lieu de l'événement.
            Sous réserve des termes et conditions trouvés sur www.tixr.com.
          </td>
        </tr>

        <!-- BOTTOM CUT EFFECT -->
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" height="20" 
                  style="border-top:1px dashed #ccc; border-right:1px dashed #ccc;">
                </td>
                <td width="50%" height="20" style="border-top:1px dashed #ccc;"></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <!-- WHITE PAGE NOTE -->
      <p style="margin-top:20px; font-size:12px; color:#999;">
        ==== Cette page est intentionnellement laissée vide ====
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
