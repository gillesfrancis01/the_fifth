'use server'

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

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

  if (!process.env.NEXT_PUBLIC_URL) {
    throw new Error('NEXT_PUBLIC_URL est requis pour générer le lien du code QR.')
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

// Réseau non borné dans une Server Action = risque de faire dépasser le
// temps limite de la fonction serverless, qui tue tout le process sans
// laisser d'erreur ni atteindre l'appel Resend qui suit. On échoue vite
// à la place, ce que les appelants gèrent déjà (image ignorée, envoi
// du courriel poursuivi sans elle).
export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
}

async function generateQrCodeDataUrl(payload: string) {
  try {
    return await QRCode.toDataURL(payload)
  } catch (err) {
    console.error('Error generating QR code', err)
    return ''
  }
}

function formatCurrency(amount: number) {
  if (amount === 0) return 'Gratuit'
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

interface TicketTemplateData {
  qrCodeUrl: string
  serialNumber: string
  reservationId: string
  formattedDate: string
  openingTime: string
  eventName: string
  fullName: string
  eventAddress: string
  formattedPrice: string
  locationName: string
  locationFullAddress: string
  phone: string
  ticketName: string
}

function buildTicketTemplate(data: TicketTemplateData) {
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
                        <img src="${data.qrCodeUrl}" alt="QR Code" width="190" height="190"
                          style="display:block; border:1px solid #ddd; padding:4px;" />
                      </td>
                    </tr>

                    <!-- SERIAL + ORDER -->
                    <tr>
                      <td align="center" style="font-size:12px; color:#444; line-height:1.4;">
                        <span style="font-size:11px; color:#666;">EN SÉRIE</span><br>
                        ${data.serialNumber}<br><br>
                        <span style="font-size:11px; color:#666;">NUMÉRO DE COMMANDE</span><br>
                        <span style="font-size:17px; font-weight:bold; color:#111;">
                          ${data.reservationId}
                        </span>
                      </td>
                    </tr>
                  </table>

                </td>

                <!-- RIGHT SIDE -->
                <td width="62%" valign="top" style="padding:24px;">

                  <!-- DATE -->
                  <p style="margin:0 0 14px 0; font-size:14px; color:#000; line-height:1.5;">
                    📅 <strong>${data.formattedDate}</strong><br>
                    Les portes ouvrent à ${data.openingTime}
                  </p>

                  <!-- EVENT NAME -->
                  <p style="margin:0 0 18px 0; font-size:22px; line-height:1.25; font-weight:bold; color:#000;">
                    ${data.eventName}
                  </p>

                  <!-- INFO BLOCK -->
                  <p style="margin:0; font-size:15px; color:#000; line-height:1.6;">
                    <strong>${data.ticketName}</strong><br>
                    👤 Délivré à : <strong>${data.fullName}</strong><br>
                    📍 ${data.eventAddress}<br>
                    💵 ${data.formattedPrice}
                  </p>

                  <br>

                  <!-- TICKET TYPE -->
                  <p style="margin:0; font-size:15px; color:#000;">
                    <strong>TYPE DE BILLET</strong><br>
                    <strong>${data.ticketName}</strong><br>
                  </p>

                </td>

              </tr>
            </table>

          </td>
        </tr>

        <!-- LOCATION FOOTER -->
        <tr>
          <td style="padding:24px; font-size:14px; color:#111; border-top:1px solid #e5e5e5;">
            <strong>${data.locationName}</strong><br>
            ${data.locationFullAddress}<br><br>
            📞 ${data.phone}
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
            Sous réserve des termes et conditions trouvés sur www.thefifthevent.com.
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

function prepareTicketTemplateData({
  fullName,
  phone,
  event,
  ticket,
  reservationId,
  qrCodeUrl,
}: {
  fullName: string
  phone: string
  event: events
  ticket: Ticket
  reservationId: string
  qrCodeUrl: string
}): TicketTemplateData {
  const formattedDate = formatEventDateTime(event.date, 'fr-CA')
  const formattedPrice = formatCurrency(ticket.price)

  return {
    qrCodeUrl,
    serialNumber: ticket.$id ?? reservationId,
    reservationId,
    formattedDate,
    openingTime: event.openingTime ?? "Heure d'ouverture à confirmer",
    eventName: event.name,
    fullName,
    eventAddress: event.adresse,
    formattedPrice,
    locationName: event.locationName ?? event.name,
    locationFullAddress: event.locationFullAddress ?? event.adresse,
    phone: event.phone ?? phone,
    ticketName: ticket.name,
  }
}

/**
 * VERSION 2 PDF : layout premium, colonne QR + infos, bloc lieu + bloc légal,
 * et ajout de la référence de paiement + email dans la zone "coordonnées".
 */
async function generateTicketPdf(params: {
  fullName: string
  phone: string
  event: events
  ticket: Ticket
  reservationId: string
  qrCodeUrl: string
}): Promise<Buffer> {
  const { fullName, phone, event, ticket, reservationId, qrCodeUrl } = params

  const formattedDate = formatEventDateTime(event.date, 'fr-CA')
  const formattedPrice = formatCurrency(ticket.price)
  const serialNumber = ticket.$id ?? reservationId

  const locationName = event.locationName ?? event.name
  const locationAddress = event.locationFullAddress ?? event.adresse
  const locationPhone = event.phone ?? phone

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 portrait (approx. comme le PDF TIXR)
  const { width, height } = page.getSize()

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const margin = 10

  // ---------- HEADER (haut de page) ----------
  const headerY = height - margin - 10

  // "Ceci est votre billet"
  page.drawText('Ceci est votre billet', {
    x: margin,
    y: headerY,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  })

  // Sous-texte
  page.drawText("Présentez cette page entière à l'événement", {
    x: margin,
    y: headerY - 20,
    size: 11,
    font: regularFont,
    color: rgb(0.35, 0.35, 0.35),
  })

  // "Pas de rentrée" centré
  const noReEntry = 'Pass de rentrée'
  const noReEntryWidth = boldFont.widthOfTextAtSize(noReEntry, 11)
  page.drawText(noReEntry, {
    x: width / 2 - noReEntryWidth / 2,
    y: headerY - 5,
    size: 11,
    font: regularFont,
    color: rgb(0.35, 0.35, 0.35),
  })

  // "TIXR" en haut à droite
  const thefifthLabel = 'THE FIFTH'
  const thefifthWidth = boldFont.widthOfTextAtSize(thefifthLabel, 16)
  page.drawText(thefifthLabel, {
    x: width - margin - thefifthWidth,
    y: headerY,
    size: 16,
    font: boldFont,
    color: rgb(0.08, 0.08, 0.08),
  })

  // ---------- BILLET PRINCIPAL (bloc supérieur) ----------
  const ticketWidth = width - margin * 2
  const ticketHeight = 230
  const ticketX = margin
  const ticketTopY = headerY - 40
  const ticketY = ticketTopY - ticketHeight

  // Contour du billet
  page.drawRectangle({
    x: ticketX,
    y: ticketY,
    width: ticketWidth,
    height: ticketHeight,
    borderWidth: 1.2,
    borderColor: rgb(0.75, 0.75, 0.78),
    color: rgb(1, 1, 1),
  })

  // Colonnes gauche / droite
  const leftWidth = ticketWidth * 0.35
  const leftX = ticketX
  const rightX = ticketX + leftWidth

  // Ligne verticale pointillée (séparation)
  const dashHeight = 6
  const dashGap = 4
  for (let y = ticketY + 10; y < ticketY + ticketHeight - 10; y += dashHeight + dashGap) {
    page.drawLine({
      start: { x: rightX, y },
      end: { x: rightX, y: y + dashHeight },
      thickness: 0.8,
      color: rgb(0.7, 0.7, 0.7),
    })
  }

  // Demi-cercles (effet découpe) haut / bas
  const notchRadius = 12
  page.drawCircle({
    x: rightX,
    y: ticketY + ticketHeight - notchRadius,
    size: notchRadius,
    color: rgb(1, 1, 1),
    borderWidth: 1.2,
    borderColor: rgb(0.75, 0.75, 0.78),
  })
  page.drawCircle({
    x: rightX,
    y: ticketY + notchRadius,
    size: notchRadius,
    color: rgb(1, 1, 1),
    borderWidth: 1.2,
    borderColor: rgb(0.75, 0.75, 0.78),
  })

  // ---------- QR CODE (colonne gauche) ----------
  let qrImage
  try {
    if (qrCodeUrl.startsWith('data:')) {
      qrImage = await pdfDoc.embedPng(qrCodeUrl)
    } else {
      const qrResponse = await fetchWithTimeout(qrCodeUrl, 8000)
      if (!qrResponse.ok) {
        throw new Error(`QR fetch failed with status ${qrResponse.status}`)
      }
      const qrBytes = new Uint8Array(await qrResponse.arrayBuffer())
      // On essaye JPG puis PNG au cas où
      try {
        qrImage = await pdfDoc.embedJpg(qrBytes)
      } catch {
        qrImage = await pdfDoc.embedPng(qrBytes)
      }
    }
  } catch (e) {
    console.warn('Impossible de charger le QR code pour le billet PDF', e)
  }

  const qrZoneSize = leftWidth - 40
  if (qrImage) {
    const { width: qrW, height: qrH } = qrImage
    const scale = Math.min(qrZoneSize / qrW, qrZoneSize / qrH)
    const finalWidth = qrW * scale
    const finalHeight = qrH * scale
    const qrX = leftX + (leftWidth - finalWidth) / 2
    const qrY = ticketY + ticketHeight - finalHeight - 30

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: finalWidth,
      height: finalHeight,
    })
  }

  // Texte sous QR (EN SÉRIE, NUMÉRO COMMANDE)
  const leftTextY = ticketY + 40

  page.drawText('EN SÉRIE', {
    x: leftX + 20,
    y: leftTextY + 24,
    size: 9,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  })

  page.drawText(serialNumber, {
    x: leftX + 20,
    y: leftTextY + 10,
    size: 9,
    font: regularFont,
    color: rgb(0.25, 0.25, 0.25),
  })

  page.drawText('NUMÉRO DE COMMANDE', {
    x: leftX + 20,
    y: leftTextY - 8,
    size: 9,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  })

  page.drawText(reservationId, {
    x: leftX + 20,
    y: leftTextY - 24,
    size: 14,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.12),
  })

  // ---------- COLONNE DROITE : infos billet ----------
  let infoY = ticketY + ticketHeight - 40

  const drawRightLine = (
    text: string,
    options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; gap?: number } = {}
  ) => {
    const size = options.size ?? 11
    const gap = options.gap ?? 14
    const font = options.bold ? boldFont : regularFont
    const color = options.color ?? rgb(0.1, 0.1, 0.1)

    page.drawText(text, {
      x: rightX + 18,
      y: infoY,
      size,
      font,
      color,
    })
    infoY -= gap
  }

  // Date + heure
  drawRightLine(` ${formattedDate}`, { size: 11 })


  infoY -= 6

  // Nom de l’événement
  drawRightLine(event.name, { size: 16, bold: true, gap: 20 })

  infoY -= 4

  // Bloc "Billet régulier"
  drawRightLine(ticket.name, { size: 11, bold: true, gap: 16 })
  drawRightLine(`Délivré à : ${fullName}`, { size: 10 })
  drawRightLine(locationName, { size: 10 })
  drawRightLine(locationAddress, { size: 10 })
  drawRightLine(formattedPrice, { size: 10, gap: 18 })

  // ---------- BAS DE PAGE : affiches + infos lieu + QR ----------
  // Zone des affiches
  const posterTopY = ticketY - 40
  const posterHeight = 220
  const posterWidth = 180
  const posterY = posterTopY - posterHeight

  // Charger l'image d'événement (event.image)
  let eventImage
  if (event.image) {
    try {
      const imgRes = await fetchWithTimeout(event.image, 8000)
      if (!imgRes.ok) {
        throw new Error(`Impossible de charger event.image (statut ${imgRes.status})`)
      }
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer())
      try {
        eventImage = await pdfDoc.embedJpg(imgBytes)
      } catch {
        eventImage = await pdfDoc.embedPng(imgBytes)
      }
    } catch (e) {
      console.warn('Erreur lors du chargement de event.image pour le billet PDF', e)
    }
  }

  if (eventImage) {
    const { width: imgW, height: imgH } = eventImage
    const scale = Math.min(posterWidth / imgW, posterHeight / imgH)
    const finalW = imgW * scale
    const finalH = imgH * scale

    const poster1X = margin
    const poster2X = margin + posterWidth + 40

    page.drawImage(eventImage, {
      x: poster1X,
      y: posterY,
      width: finalW,
      height: finalH,
    })

    page.drawImage(eventImage, {
      x: poster2X,
      y: posterY,
      width: finalW,
      height: finalH,
    })
  }

  // Bloc texte lieu à droite des affiches
  const infoRightX = margin + posterWidth * 2 + 32
  let venueY = posterY + posterHeight - 10

  page.drawText(locationName, {
    x: infoRightX,
    y: venueY,
    size: 12,
    font: boldFont,
    color: rgb(0.08, 0.08, 0.08),
  })
  venueY -= 16


  if (locationPhone) {
    page.drawText(locationPhone, {
      x: infoRightX,
      y: venueY,
      size: 10,
      font: regularFont,
      color: rgb(0.18, 0.18, 0.18),
    })
    venueY -= 16
  }

  // QR en bas à droite (réutilise le même qrImage si disponible)
  if (qrImage) {
    const qrSizeBottom = 90
    const { width: qrW2, height: qrH2 } = qrImage
    const scale2 = Math.min(qrSizeBottom / qrW2, qrSizeBottom / qrH2)
    const finalW2 = qrW2 * scale2
    const finalH2 = qrH2 * scale2
    const qrBottomX = width - margin - finalW2
    const qrBottomY = margin + 40

    page.drawImage(qrImage, {
      x: qrBottomX,
      y: qrBottomY,
      width: finalW2,
      height: finalH2,
    })
  }

  // ---------- TEXTE LÉGAL ----------
  const wrapText = (text: string, maxChars: number) => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    for (const word of words) {
      if ((currentLine + word).length > maxChars) {
        lines.push(currentLine.trim())
        currentLine = `${word} `
      } else {
        currentLine += `${word} `
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim())
    return lines
  }

  const legalText =
    "NOS CONDITIONS JURIDIQUES ET SERVICES - Tous les billets sont en vente finale et ne peuvent être ni échangés ni remboursés. Dans le cas d'une annulation d'événement sans date de report, un remboursement complet sera automatiquement émis à chaque client sur la carte de crédit utilisée pour l'achat. En achetant un billet pour cet événement, vous acceptez cette politique d'achat. Avant d'acheter vos billets, nous vous invitons à confirmer le titre, l'heure et le lieu de l'événement."
  const legalLines = wrapText(legalText, 115)

  let legalY = posterY - 26
  legalLines.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y: legalY,
      size: 8.5,
      font: regularFont,
      color: rgb(0.35, 0.35, 0.35),
    })
    legalY -= 10
  })

  // (Facultatif) message de page vide en bas de page
  // page.drawText('==== Cette page est intentionnellement laissée vide ====', {
  //   x: margin,
  //   y: 28,
  //   size: 8,
  //   font: regularFont,
  //   color: rgb(0.6, 0.6, 0.6),
  // })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}


function buildEmailHtml(params: {
  fullName: string
  phone: string
  event: events
  ticket: Ticket
  reservationId: string
  qrCodeUrl: string
}) {
  const templateData = prepareTicketTemplateData(params)
  return buildTicketTemplate(templateData)
}

export async function sendTicketConfirmationEmail(payload: TicketEmailPayload) {
  const { apiKey, fromEmail } = assertEmailConfig()

  const checkInUrl = `${process.env.NEXT_PUBLIC_URL}/check-in?id=${payload.reservationId}`

  const qrCodeUrl = await generateQrCodeDataUrl(checkInUrl)

  const html = buildEmailHtml({
    fullName: payload.fullName,
    phone: payload.phone,
    event: payload.event,
    ticket: payload.ticket,
    reservationId: payload.reservationId,
    qrCodeUrl,
  })

  const pdfBuffer = await generateTicketPdf({
    fullName: payload.fullName,
    phone: payload.phone,
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
