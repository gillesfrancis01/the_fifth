'use server'

import type { events, Ticket } from '@/types'

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

type PdfColor = [number, number, number]

function hexToPdfColor(hex: string): PdfColor {
  const normalized = hex.replace('#', '')

  if (normalized.length !== 6) {
    throw new Error(`Couleur hexadécimale invalide: ${hex}`)
  }

  const numeric = parseInt(normalized, 16)
  const r = ((numeric >> 16) & 0xff) / 255
  const g = ((numeric >> 8) & 0xff) / 255
  const b = (numeric & 0xff) / 255

  return [r, g, b]
}

function colorCommand(color: PdfColor) {
  return `${color.map((value) => value.toFixed(3)).join(' ')} rg`
}

function drawRectangle({
  x,
  y,
  width,
  height,
  color,
}: {
  x: number
  y: number
  width: number
  height: number
  color: PdfColor
}) {
  return `${colorCommand(color)} ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`
}

function drawText({
  text,
  x,
  y,
  font,
  size,
  color,
}: {
  text: string
  x: number
  y: number
  font: 'F1' | 'F2'
  size: number
  color: PdfColor
}) {
  const escaped = escapePdfText(text)

  return `${colorCommand(color)} BT /${font} ${size.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET`
}

function approximateTextWidth(text: string, size: number) {
  return text.length * size * 0.55
}

function createPdfDocument({
  pageWidth,
  pageHeight,
  contentParts,
  image,
}: {
  pageWidth: number
  pageHeight: number
  contentParts: string[]
  image?: { data: Buffer; width: number; height: number }
}) {
  const header = '%PDF-1.4\n'
  const objects: Buffer[] = [Buffer.from(header, 'utf8')]
  const offsets: number[] = [0]
  let currentOffset = Buffer.byteLength(header)

  const addPlainObject = (body: string) => {
    const objectNumber = offsets.length
    offsets[objectNumber] = currentOffset
    const objectString = `${objectNumber} 0 obj\n${body}\nendobj\n`
    const buffer = Buffer.from(objectString, 'utf8')
    objects.push(buffer)
    currentOffset += buffer.length
    return objectNumber
  }

  const addStreamObject = (dictionary: string, stream: Buffer) => {
    const objectNumber = offsets.length
    offsets[objectNumber] = currentOffset
    const headerString = `${objectNumber} 0 obj\n${dictionary}\nstream\n`
    const footerString = '\nendstream\nendobj\n'
    const headerBuffer = Buffer.from(headerString, 'utf8')
    const footerBuffer = Buffer.from(footerString, 'utf8')
    objects.push(headerBuffer, stream, footerBuffer)
    currentOffset += headerBuffer.length + stream.length + footerBuffer.length
    return objectNumber
  }

  addPlainObject('<< /Type /Catalog /Pages 2 0 R >>')
  addPlainObject('<< /Type /Pages /Count 1 /Kids [3 0 R] >>')

  const resourceParts = [`/Font << /F1 5 0 R /F2 6 0 R >>`]

  if (image) {
    resourceParts.push('/XObject << /Im1 7 0 R >>')
  }

  const resourceString = resourceParts.join(' ')

  addPlainObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents 4 0 R /Resources << ${resourceString} >> >>`,
  )

  const contentStream = `${contentParts.join('\n')}\n`
  const contentBuffer = Buffer.from(contentStream, 'utf8')
  addStreamObject(`<< /Length ${contentBuffer.length} >>`, contentBuffer)

  addPlainObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  addPlainObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

  if (image) {
    const { data, width, height } = image
    addStreamObject(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>`,
      data,
    )
  }

  const xrefOffset = currentOffset
  const objectCount = offsets.length
  const xrefParts = [
    'xref\n',
    `0 ${objectCount}\n`,
    '0000000000 65535 f \n',
  ]

  for (let index = 1; index < objectCount; index += 1) {
    xrefParts.push(`${offsets[index].toString().padStart(10, '0')} 00000 n \n`)
  }

  xrefParts.push('trailer\n')
  xrefParts.push(`<< /Size ${objectCount} /Root 1 0 R >>\n`)
  xrefParts.push('startxref\n')
  xrefParts.push(`${xrefOffset}\n`)
  xrefParts.push('%%EOF')

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
  } catch {
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
  } catch {
    return date.toISOString()
  }
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

function isJpeg(buffer: Buffer) {
  return buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9
}

function parseJpegDimensions(buffer: Buffer) {
  let offset = 2

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return null
    }

    const marker = buffer[offset + 1]
    offset += 2

    if (marker === 0xd8 || marker === 0xd9 || marker === 0xda) {
      continue
    }

    if (offset + 1 >= buffer.length) {
      return null
    }

    const length = buffer.readUInt16BE(offset)

    if (marker >= 0xc0 && marker <= 0xc3) {
      if (offset + 7 >= buffer.length) {
        return null
      }

      const height = buffer.readUInt16BE(offset + 3)
      const width = buffer.readUInt16BE(offset + 5)

      return { width, height }
    }

    offset += length
  }

  return null
}

async function fetchQrImageData(qrCodeUrl: string) {
  let requestUrl = ensureJpegFormat(qrCodeUrl)

  try {
    const parsed = new URL(qrCodeUrl)
    if (!parsed.searchParams.has('format') || parsed.searchParams.get('format')?.toLowerCase() !== 'jpg') {
      parsed.searchParams.set('format', 'jpg')
      requestUrl = parsed.toString()
    } else {
      requestUrl = parsed.toString()
    }
  } catch {
    requestUrl = ensureJpegFormat(qrCodeUrl)
  }

  try {
    const response = await fetch(requestUrl)

    if (!response.ok) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!isJpeg(buffer)) {
      return null
    }

    const dimensions = parseJpegDimensions(buffer)

    if (!dimensions) {
      return null
    }

    return { data: buffer, width: dimensions.width, height: dimensions.height }
  } catch {
    return null
  }
}

function drawImage({
  x,
  y,
  width,
  height,
  name,
}: {
  x: number
  y: number
  width: number
  height: number
  name: string
}) {
  return [`q`, `${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm`, `/${name} Do`, 'Q']
}

async function buildInvoicePdf(payload: {
  fullName: string
  event: events
  ticket: Ticket
  reservationId: string
  paymentIntent: string
  qrCodeUrl: string
}) {
  const pageWidth = 612
  const pageHeight = 792
  const margin = 48

  const backgroundColor = hexToPdfColor('#f8fafc')
  const primaryTextColor = hexToPdfColor('#0f172a')
  const accentColor = hexToPdfColor('#9f7aea')
  const cardColor = hexToPdfColor('#1e293b')
  const cardTextColor = hexToPdfColor('#f8fafc')
  const mutedTextColor = hexToPdfColor('#475569')

  const contentParts: string[] = []
  contentParts.push(drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: backgroundColor }))

  let cursorY = pageHeight - margin

  contentParts.push(
    drawText({
      text: `Bonjour ${payload.fullName},`,
      x: margin,
      y: cursorY,
      font: 'F2',
      size: 26,
      color: accentColor,
    }),
  )

  cursorY -= 38

  contentParts.push(
    drawText({
      text: `Merci pour votre réservation. Voici les détails de votre billet pour ${payload.event.name}.`,
      x: margin,
      y: cursorY,
      font: 'F1',
      size: 12,
      color: primaryTextColor,
    }),
  )

  cursorY -= 28

  const formattedDate = formatDateTime(payload.event.date)
  const formattedPrice = formatCurrency(payload.ticket.price)

  const cardLines = [
    { label: 'Événement :', value: payload.event.name },
    { label: 'Date :', value: formattedDate },
    { label: 'Adresse :', value: payload.event.adresse },
    { label: 'Billet :', value: payload.ticket.name },
    { label: 'Prix :', value: formattedPrice },
    { label: 'Identifiant de réservation :', value: payload.reservationId },
    { label: 'Référence de paiement :', value: payload.paymentIntent },
  ]

  const cardPaddingX = 24
  const cardPaddingY = 28
  const cardLineHeight = 22
  const cardWidth = pageWidth - margin * 2
  const cardHeight = cardPaddingY * 2 + cardLines.length * cardLineHeight
  const cardX = margin
  const cardY = cursorY - cardHeight

  contentParts.push(drawRectangle({ x: cardX, y: cardY, width: cardWidth, height: cardHeight, color: cardColor }))

  let cardBaseline = cardY + cardHeight - cardPaddingY

  cardLines.forEach((line) => {
    const labelBaseline = cardBaseline

    contentParts.push(
      drawText({
        text: line.label,
        x: cardX + cardPaddingX,
        y: labelBaseline,
        font: 'F2',
        size: 14,
        color: cardTextColor,
      }),
    )

    const labelWidth = approximateTextWidth(line.label, 14)
    const valueX = cardX + cardPaddingX + labelWidth + 6

    contentParts.push(
      drawText({
        text: line.value,
        x: valueX,
        y: labelBaseline,
        font: 'F1',
        size: 14,
        color: cardTextColor,
      }),
    )

    cardBaseline -= cardLineHeight
  })

  cursorY = cardY - 32

  contentParts.push(
    drawText({
      text: 'Présentez le code QR ci-dessous à l’entrée de l’événement pour valider votre billet :',
      x: margin,
      y: cursorY,
      font: 'F1',
      size: 12,
      color: primaryTextColor,
    }),
  )

  cursorY -= 30

  const qrImage = await fetchQrImageData(payload.qrCodeUrl)
  const qrDisplaySize = 220

  if (qrImage) {
    const qrX = (pageWidth - qrDisplaySize) / 2
    const qrY = cursorY - qrDisplaySize

    drawImage({ x: qrX, y: qrY, width: qrDisplaySize, height: qrDisplaySize, name: 'Im1' }).forEach((command) => {
      contentParts.push(command)
    })

    cursorY = qrY - 32
  } else {
    contentParts.push(
      drawText({
        text: `QR Code : ${payload.qrCodeUrl}`,
        x: margin,
        y: cursorY,
        font: 'F1',
        size: 12,
        color: primaryTextColor,
      }),
    )

    cursorY -= 32
  }

  contentParts.push(
    drawText({
      text: 'Votre facture et votre billet sont également disponibles en pièce jointe au format PDF.',
      x: margin,
      y: cursorY,
      font: 'F1',
      size: 12,
      color: primaryTextColor,
    }),
  )

  cursorY -= 26

  contentParts.push(
    drawText({
      text: 'Conservez ce courriel précieusement. Si vous avez des questions, répondez simplement à ce message.',
      x: margin,
      y: cursorY,
      font: 'F1',
      size: 10,
      color: mutedTextColor,
    }),
  )

  return createPdfDocument({
    pageWidth,
    pageHeight,
    contentParts,
    image: qrImage ?? undefined,
  })
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
  const formattedDate = formatDateTime(event.date)
  const formattedPrice = formatCurrency(ticket.price)

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; background-color: #f8fafc; padding: 24px;">
      <h1 style="color: #9f7aea;">Bonjour ${fullName},</h1>
      <p>Merci pour votre réservation. Voici les détails de votre billet pour <strong>${event.name}</strong>.</p>
      <div style="margin: 24px 0; padding: 16px; background: #1e293b; color: #f8fafc; border-radius: 12px;">
        <p style="margin: 0; font-size: 16px;"><strong>Événement :</strong> ${event.name}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Date :</strong> ${formattedDate}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Adresse :</strong> ${event.adresse}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Billet :</strong> ${ticket.name}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Prix :</strong> ${formattedPrice}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Identifiant de réservation :</strong> ${reservationId}</p>
        <p style="margin: 4px 0; font-size: 16px;"><strong>Référence de paiement :</strong> ${paymentIntent}</p>
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
    paymentIntent: payload.paymentIntent,
    qrCodeUrl,
  })

  const invoicePdf = await buildInvoicePdf({
    fullName: payload.fullName,
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
