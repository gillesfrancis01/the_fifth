'use server'

import type { events, Ticket } from '@/types'

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

type PdfColor = [number, number, number]

interface PdfImage {
  name: string
  data: Buffer
  width: number
  height: number
}

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

function wrapText(text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    if (!word) {
      return
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (approximateTextWidth(candidate, size) <= maxWidth || !currentLine) {
      currentLine = candidate
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function createPdfDocument({
  pageWidth,
  pageHeight,
  contentParts,
  images,
}: {
  pageWidth: number
  pageHeight: number
  contentParts: string[]
  images?: PdfImage[]
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

  if (images && images.length > 0) {
    const xObjectEntries = images
      .map((image, index) => `/${image.name} ${7 + index} 0 R`)
      .join(' ')
    resourceParts.push(`/XObject << ${xObjectEntries} >>`)
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

  if (images && images.length > 0) {
    images.forEach((image) => {
      addStreamObject(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>`,
        image.data,
      )
    })
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

async function fetchImageAsJpeg(originalUrl: string) {
  const tried = new Set<string>()
  const candidateUrls: string[] = []

  try {
    candidateUrls.push(ensureJpegFormat(originalUrl))
  } catch {
    candidateUrls.push(originalUrl)
  }

  if (!candidateUrls.includes(originalUrl)) {
    candidateUrls.push(originalUrl)
  }

  for (const requestUrl of candidateUrls) {
    if (tried.has(requestUrl)) {
      continue
    }

    tried.add(requestUrl)

    try {
      const response = await fetch(requestUrl)

      if (!response.ok) {
        continue
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (!isJpeg(buffer)) {
        continue
      }

      const dimensions = parseJpegDimensions(buffer)

      if (!dimensions) {
        continue
      }

      return { data: buffer, width: dimensions.width, height: dimensions.height }
    } catch {
      // Try the next candidate URL
    }
  }

  return null
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

  const titleColor = hexToPdfColor('#111827')
  const accentColor = hexToPdfColor('#dc2626')
  const mutedTextColor = hexToPdfColor('#64748b')
  const panelColor = hexToPdfColor('#f8fafc')
  const panelBorderColor = hexToPdfColor('#cbd5f5')
  const dividerColor = hexToPdfColor('#e2e8f0')
  const whiteColor = hexToPdfColor('#ffffff')

  const contentParts: string[] = []

  const images: PdfImage[] = []
  const registerImage = (imageData: { data: Buffer; width: number; height: number }) => {
    const image: PdfImage = { name: `Im${images.length + 1}`, ...imageData }
    images.push(image)
    return image
  }

  const qrImageData = await fetchImageAsJpeg(payload.qrCodeUrl)
  const qrPdfImage = qrImageData ? registerImage(qrImageData) : null

  let eventPdfImage: PdfImage | null = null
  if (payload.event.image) {
    const eventImageData = await fetchImageAsJpeg(payload.event.image)
    if (eventImageData) {
      eventPdfImage = registerImage(eventImageData)
    }
  }

  const formattedDate = formatDateTime(payload.event.date)
  const formattedPrice = formatCurrency(payload.ticket.price)
  const eventDate = new Date(payload.event.date)
  const timeFormatter = new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' })
  const formattedTime = Number.isNaN(eventDate.getTime()) ? '' : timeFormatter.format(eventDate)

  let cursorY = pageHeight - margin

  contentParts.push(
    drawText({
      text: 'Ceci est votre billet',
      x: margin,
      y: cursorY,
      font: 'F2',
      size: 26,
      color: titleColor,
    }),
  )

  const topNote = 'Pas de revente'
  const topNoteWidth = approximateTextWidth(topNote, 10)
  contentParts.push(
    drawText({
      text: topNote,
      x: pageWidth - margin - topNoteWidth,
      y: cursorY,
      font: 'F1',
      size: 10,
      color: mutedTextColor,
    }),
  )

  cursorY -= 32

  contentParts.push(
    drawText({
      text: 'Presentez cette page à l evenement pour acceder a votre billet.',
      x: margin,
      y: cursorY,
      font: 'F1',
      size: 12,
      color: mutedTextColor,
    }),
  )

  cursorY -= 24

  contentParts.push(
    drawRectangle({
      x: margin,
      y: cursorY,
      width: pageWidth - margin * 2,
      height: 1.2,
      color: dividerColor,
    }),
  )

  cursorY -= 24

  const qrSize = 200
  const qrX = margin
  const qrY = cursorY - qrSize

  if (qrPdfImage) {
    drawImage({ x: qrX, y: qrY, width: qrSize, height: qrSize, name: qrPdfImage.name }).forEach((command) => {
      contentParts.push(command)
    })
  } else {
    contentParts.push(
      drawText({
        text: `Code QR : ${payload.qrCodeUrl}`,
        x: qrX,
        y: cursorY,
        font: 'F1',
        size: 10,
        color: mutedTextColor,
      }),
    )
  }

  const infoX = qrX + qrSize + 28
  const infoWidth = pageWidth - margin - infoX
  let infoBaseline = cursorY + qrSize - 10

  const eventNameLines = wrapText(payload.event.name, 18, infoWidth)
  eventNameLines.forEach((line) => {
    contentParts.push(
      drawText({
        text: line,
        x: infoX,
        y: infoBaseline,
        font: 'F2',
        size: 18,
        color: titleColor,
      }),
    )
    infoBaseline -= 22
  })

  const infoLines: string[] = [
    formattedDate,
    payload.event.adresse,
    `Billet : ${payload.ticket.name}`,
    `Prix : ${formattedPrice}`,
  ]

  if (formattedTime) {
    infoLines.splice(1, 0, `Heure d’entrée : ${formattedTime}`)
  }

  const panelLineHeight = 18
  const panelPadding = 14
  const panelHeight = panelPadding * 2 + infoLines.length * panelLineHeight
  const panelY = infoBaseline - panelHeight + panelLineHeight + panelPadding

  contentParts.push(
    drawRectangle({ x: infoX, y: panelY, width: infoWidth, height: panelHeight, color: panelColor }),
  )
  contentParts.push(
    drawRectangle({ x: infoX, y: panelY, width: infoWidth, height: 1.2, color: panelBorderColor }),
  )
  contentParts.push(
    drawRectangle({ x: infoX, y: panelY + panelHeight - 1.2, width: infoWidth, height: 1.2, color: panelBorderColor }),
  )
  contentParts.push(
    drawRectangle({ x: infoX, y: panelY, width: 1.2, height: panelHeight, color: panelBorderColor }),
  )
  contentParts.push(
    drawRectangle({ x: infoX + infoWidth - 1.2, y: panelY, width: 1.2, height: panelHeight, color: panelBorderColor }),
  )

  let panelBaseline = panelY + panelHeight - panelPadding
  infoLines.forEach((line) => {
    contentParts.push(
      drawText({
        text: `• ${line}`,
        x: infoX + 10,
        y: panelBaseline,
        font: 'F1',
        size: 12,
        color: titleColor,
      }),
    )
    panelBaseline -= panelLineHeight
  })

  const ticketCode = `${payload.reservationId}${payload.ticket.$id}`.replace(/[^0-9a-z]/gi, '').toUpperCase()
  const qrLabelY = qrY - 18

  contentParts.push(
    drawText({
      text: `Référence billet : ${ticketCode}`,
      x: qrX,
      y: qrLabelY,
      font: 'F1',
      size: 12,
      color: titleColor,
    }),
  )

  contentParts.push(
    drawText({
      text: `Paiement : ${payload.paymentIntent}`,
      x: qrX,
      y: qrLabelY - 18,
      font: 'F1',
      size: 12,
      color: titleColor,
    }),
  )

  contentParts.push(
    drawText({
      text: `Client : ${payload.fullName}`,
      x: qrX,
      y: qrLabelY - 36,
      font: 'F1',
      size: 12,
      color: titleColor,
    }),
  )

  let sectionBottom = qrLabelY - 54

  contentParts.push(
    drawRectangle({
      x: margin,
      y: sectionBottom,
      width: pageWidth - margin * 2,
      height: 1.2,
      color: dividerColor,
    }),
  )

  sectionBottom -= 32

  if (eventPdfImage) {
    const gutter = 16
    const stubWidth = (pageWidth - margin * 2 - gutter) / 2
    const maxStubHeight = 220
    const computeDimensions = () => {
      let displayWidth = stubWidth
      let displayHeight = (eventPdfImage.height / eventPdfImage.width) * displayWidth

      if (displayHeight > maxStubHeight) {
        displayHeight = maxStubHeight
        displayWidth = (eventPdfImage.width / eventPdfImage.height) * displayHeight
      }

      return { displayWidth, displayHeight }
    }

    const { displayWidth, displayHeight } = computeDimensions()
    const leftX = margin + (stubWidth - displayWidth) / 2
    const rightX = margin + stubWidth + gutter + (stubWidth - displayWidth) / 2
    const imageY = sectionBottom - displayHeight

    drawImage({ x: leftX, y: imageY, width: displayWidth, height: displayHeight, name: eventPdfImage.name }).forEach((command) => {
      contentParts.push(command)
    })
    drawImage({ x: rightX, y: imageY, width: displayWidth, height: displayHeight, name: eventPdfImage.name }).forEach((command) => {
      contentParts.push(command)
    })

    const overlayHeight = Math.min(64, displayHeight)
    const leftOverlayX = leftX
    const rightOverlayX = rightX

    contentParts.push(
      drawRectangle({ x: leftOverlayX, y: imageY, width: displayWidth, height: overlayHeight, color: accentColor }),
    )
    contentParts.push(
      drawRectangle({ x: rightOverlayX, y: imageY, width: displayWidth, height: overlayHeight, color: accentColor }),
    )

    const ticketInfoLines = wrapText(`${payload.event.name} – ${formattedDate}`, 10, displayWidth - 16)
    const locationLines = wrapText(payload.event.adresse, 10, displayWidth - 16)

    let overlayBaseline = imageY + overlayHeight - 16
    ticketInfoLines.forEach((line) => {
      contentParts.push(
        drawText({
          text: line,
          x: leftOverlayX + 8,
          y: overlayBaseline,
          font: 'F2',
          size: 10,
          color: whiteColor,
        }),
      )
      contentParts.push(
        drawText({
          text: line,
          x: rightOverlayX + 8,
          y: overlayBaseline,
          font: 'F2',
          size: 10,
          color: whiteColor,
        }),
      )
      overlayBaseline -= 14
    })

    locationLines.forEach((line) => {
      contentParts.push(
        drawText({
          text: line,
          x: leftOverlayX + 8,
          y: overlayBaseline,
          font: 'F1',
          size: 10,
          color: whiteColor,
        }),
      )
      contentParts.push(
        drawText({
          text: line,
          x: rightOverlayX + 8,
          y: overlayBaseline,
          font: 'F1',
          size: 10,
          color: whiteColor,
        }),
      )
      overlayBaseline -= 14
    })

    sectionBottom = imageY - 28
  }

  contentParts.push(
    drawText({
      text: 'Merci de faire confiance a notre equipe. Pour toute question, répondez simplement à ce courriel.',
      x: margin,
      y: sectionBottom,
      font: 'F1',
      size: 11,
      color: mutedTextColor,
    }),
  )

  contentParts.push(
    drawText({
      text: `Adresse de l evenement : ${payload.event.adresse}`,
      x: margin,
      y: sectionBottom - 18,
      font: 'F1',
      size: 10,
      color: mutedTextColor,
    }),
  )

  return createPdfDocument({
    pageWidth,
    pageHeight,
    contentParts,
    images,
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
