'use server'

import { ID } from 'node-appwrite'
import { createAdminClient } from '../../../config/appwrite'

interface ContactPayload {
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
}

interface ActionResult {
  success: boolean
  error?: string
}

function getContactsConfig() {
  const databaseId = process.env.NEXT_PUBLIC_DATABASE
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CONTACTS || 'contacts'

  if (!databaseId || !collectionId) {
    return { error: "Configuration d'Appwrite manquante pour le formulaire de contact." }
  }

  return { databaseId, collectionId }
}

const RESEND_API_URL = 'https://api.resend.com/emails'

export async function createContactMessage(payload: ContactPayload): Promise<ActionResult> {
  const config = getContactsConfig()
  if ('error' in config) {
    return { success: false, error: config.error }
  }

  try {
    const { databases } = await createAdminClient()

    // 1. Save message to Appwrite database
    await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      subject: payload.subject || null,
      message: payload.message,
    })

    // 2. Send notification email to the admin using Resend
    const apiKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.TICKETING_EMAIL_FROM || 'info@thefifthevent.com'
    
    if (apiKey) {
      const subject = `Nouveau message de contact : ${payload.subject || 'Sans objet'}`
      const htmlContent = `
        <div style="background-color:#0f0f0f; color:#f8f5f0; padding:30px; font-family:Arial, sans-serif; border-radius:12px; border:1px solid #c9a14d; max-width:600px; margin:auto;">
          <h2 style="color:#c9a14d; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-top:0;">
            Nouveau message reçu
          </h2>
          <table style="width:100%; font-size:14px; border-collapse:collapse; margin-bottom:20px;">
            <tr>
              <td style="padding:6px 0; color:#a3a3a3; width:120px;"><strong>Nom complet :</strong></td>
              <td style="padding:6px 0; color:#ffffff;">${payload.name}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#a3a3a3;"><strong>E-mail :</strong></td>
              <td style="padding:6px 0; color:#ffffff;"><a href="mailto:${payload.email}" style="color:#c9a14d;">${payload.email}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#a3a3a3;"><strong>Téléphone :</strong></td>
              <td style="padding:6px 0; color:#ffffff;">${payload.phone || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; color:#a3a3a3;"><strong>Sujet :</strong></td>
              <td style="padding:6px 0; color:#ffffff;">${payload.subject || 'Non renseigné'}</td>
            </tr>
          </table>
          <div style="background-color:rgba(255,255,255,0.05); padding:16px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:20px;">
            <p style="margin:0 0 8px 0; font-size:12px; color:#a3a3a3; text-transform:uppercase; font-weight:bold;">Message :</p>
            <p style="margin:0; font-size:14px; line-height:1.6; white-space:pre-wrap; color:#ffffff;">${payload.message}</p>
          </div>
          <p style="font-size:11px; color:#555555; text-align:center; margin:0;">
            Ce message a été envoyé automatiquement depuis le formulaire de contact du site.
          </p>
        </div>
      `

      try {
        await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: adminEmail,
            to: [adminEmail], // Send email notification to ourselves (admin)
            subject,
            html: htmlContent,
          }),
        })
      } catch (emailErr) {
        console.error("Failed to send admin notification email", emailErr)
      }
    } else {
      console.warn("RESEND_API_KEY is not defined. Skipping admin notification email.")
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to create contact message', error)
    return { success: false, error: "Impossible d'envoyer votre message. Veuillez réessayer." }
  }
}
