'use server'

interface ProviderEmailPayload {
  name: string
  email: string
  specialty: string
  eventName: string // name of the event or "Candidature spontanée"
  status: 'accepted' | 'rejected'
}

const RESEND_API_URL = 'https://api.resend.com/emails'

export async function sendProviderStatusEmail(payload: ProviderEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.TICKETING_EMAIL_FROM

  if (!apiKey) {
    throw new Error("La clé d'API Resend (RESEND_API_KEY) n'est pas configurée dans les variables d'environnement.")
  }

  if (!fromEmail) {
    throw new Error("L'adresse e-mail d'expédition (TICKETING_EMAIL_FROM) n'est pas configurée dans les variables d'environnement.")
  }

  const isAccepted = payload.status === 'accepted'
  const subject = isAccepted 
    ? `Votre candidature artistique a été acceptée - The Fifth`
    : `Votre candidature artistique - The Fifth`

  const htmlContent = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" 
      style="background-color:#0a0a0a; padding:40px; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:#f8f5f0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" 
            style="background:#121212; border:1px solid #c9a14d; border-radius:16px; overflow:hidden; padding:32px; text-align:left;">
            
            <!-- HEADER -->
            <tr>
              <td align="center" style="padding-bottom:24px; border-b:1px solid rgba(255,255,255,0.1);">
                <h1 style="color:#c9a14d; font-size:26px; margin:0; letter-spacing: 0.15em; text-transform: uppercase;">
                  The Fifth
                </h1>
                <p style="color:#ffffff; opacity:0.6; font-size:11px; margin:4px 0 0 0; letter-spacing: 0.3em; text-transform: uppercase;">
                  Direction Artistique
                </p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding-top:24px;">
                <p style="font-size:16px; line-height:1.6; margin:0 0 16px 0;">
                  Bonjour <strong>${payload.name}</strong>,
                </p>
                
                ${isAccepted ? `
                  <p style="font-size:15px; line-height:1.6; margin:0 0 16px 0; color:#e2e8f0;">
                    Nous avons le plaisir de vous informer que votre candidature en tant que 
                    <span style="color:#c9a14d; font-weight:bold;">${payload.specialty}</span> pour l'événement 
                    <strong>${payload.eventName}</strong> a été <span style="color:#10b981; font-weight:bold;">acceptée</span> 
                    par notre direction artistique.
                  </p>
                  <p style="font-size:15px; line-height:1.6; margin:0 0 24px 0; color:#e2e8f0;">
                    Un membre de notre équipe de production prendra contact avec vous dans les plus brefs délais 
                    pour finaliser les aspects techniques et contractuels de votre prestation.
                  </p>
                ` : `
                  <p style="font-size:15px; line-height:1.6; margin:0 0 16px 0; color:#e2e8f0;">
                    Nous tenons à vous remercier chaleureusement pour l'intérêt que vous portez à <strong>The Fifth</strong> 
                    et pour nous avoir soumis votre candidature en tant que <strong>${payload.specialty}</strong>.
                  </p>
                  <p style="font-size:15px; line-height:1.6; margin:0 0 16px 0; color:#e2e8f0;">
                    Après étude attentive de votre portfolio et de vos références artistiques, nous avons le regret de vous informer 
                    que nous ne pourrons pas donner de suite favorable à votre demande pour cette session.
                  </p>
                  <p style="font-size:15px; line-height:1.6; margin:0 0 24px 0; color:#e2e8f0;">
                    Cependant, nous conservons précieusement votre profil dans nos bases de talents pour nos futurs projets d'exception.
                  </p>
                `}

                <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:20px; font-size:14px; color:#a3a3a3; line-height:1.5;">
                  Cordialement,<br>
                  <strong>L’équipe de direction artistique</strong><br>
                  <span style="color:#c9a14d;">The Fifth Event Agency</span>
                </div>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding-top:32px; font-size:11px; color:#555555; text-align:center;">
                © ${new Date().getFullYear()} The Fifth Event Agency. Tous droits réservés.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  `

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.email],
        subject,
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur Resend (${response.status}): ${errorText}`)
    } else {
      console.log(`E-mail de notification (${payload.status}) envoyé avec succès à ${payload.email}`)
    }
  } catch (error: any) {
    console.error(`Exception lors de l'envoi de l'e-mail Resend`, error)
    throw new Error(error.message || "Erreur de connexion au serveur d'envoi d'e-mail (Resend).")
  }
}

interface ProviderSubmissionEmailPayload {
  name: string
  email: string
  phone: string
  specialty: string
  portfolio: string
  eventName: string
  message?: string | null
}

export async function sendProviderSubmissionEmails(payload: ProviderSubmissionEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.TICKETING_EMAIL_FROM

  if (!apiKey) {
    throw new Error("La clé d'API Resend (RESEND_API_KEY) n'est pas configurée dans les variables d'environnement.")
  }

  if (!fromEmail) {
    throw new Error("L'adresse e-mail d'expédition (TICKETING_EMAIL_FROM) n'est pas configurée dans les variables d'environnement.")
  }

  // 1. Send confirmation email to the applicant
  const applicantSubject = `Confirmation de réception de votre candidature - The Fifth`
  const applicantHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" 
      style="background-color:#0a0a0a; padding:40px; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:#f8f5f0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" 
            style="background:#121212; border:1px solid #c9a14d; border-radius:16px; overflow:hidden; padding:32px; text-align:left;">
            <tr>
              <td align="center" style="padding-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <h1 style="color:#c9a14d; font-size:26px; margin:0; letter-spacing: 0.15em; text-transform: uppercase;">
                  The Fifth
                </h1>
                <p style="color:#ffffff; opacity:0.6; font-size:11px; margin:4px 0 0 0; letter-spacing: 0.3em; text-transform: uppercase;">
                  Candidature Partenaire
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <p style="font-size:16px; line-height:1.6; margin:0 0 16px 0;">
                  Bonjour <strong>${payload.name}</strong>,
                </p>
                <p style="font-size:15px; line-height:1.6; margin:0 0 16px 0; color:#e2e8f0;">
                  Nous vous remercions pour l'intérêt que vous portez à <strong>The Fifth</strong>. Nous avons bien reçu votre candidature en tant que <strong>${payload.specialty}</strong> pour l'événement <strong>${payload.eventName}</strong>.
                </p>
                <p style="font-size:15px; line-height:1.6; margin:0 0 24px 0; color:#e2e8f0;">
                  Notre direction artistique et notre équipe de production vont étudier attentivement votre profil et votre portfolio. Si votre profil correspond à nos besoins, nous vous recontacterons dans les plus brefs délais.
                </p>
                <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:20px; font-size:14px; color:#a3a3a3; line-height:1.5;">
                  Cordialement,<br>
                  <strong>L’équipe de direction artistique</strong><br>
                  <span style="color:#c9a14d;">The Fifth Event Agency</span>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:32px; font-size:11px; color:#555555; text-align:center;">
                © ${new Date().getFullYear()} The Fifth Event Agency. Tous droits réservés.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `

  // 2. Send notification email to the administrator
  const adminSubject = `Nouvelle candidature prestataire : ${payload.name} (${payload.specialty})`
  const adminHtml = `
    <div style="background-color:#0f0f0f; color:#f8f5f0; padding:30px; font-family:Arial, sans-serif; border-radius:12px; border:1px solid #c9a14d; max-width:600px; margin:auto;">
      <h2 style="color:#c9a14d; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-top:0;">
        Nouvelle Candidature Partenaire
      </h2>
      <table style="width:100%; font-size:14px; border-collapse:collapse; margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0; color:#a3a3a3; width:150px;"><strong>Nom / Compagnie :</strong></td>
          <td style="padding:6px 0; color:#ffffff;">${payload.name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#a3a3a3;"><strong>E-mail :</strong></td>
          <td style="padding:6px 0; color:#ffffff;"><a href="mailto:${payload.email}" style="color:#c9a14d;">${payload.email}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#a3a3a3;"><strong>Téléphone :</strong></td>
          <td style="padding:6px 0; color:#ffffff;">${payload.phone}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#a3a3a3;"><strong>Spécialité :</strong></td>
          <td style="padding:6px 0; color:#ffffff;">${payload.specialty}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#a3a3a3;"><strong>Portfolio / Site :</strong></td>
          <td style="padding:6px 0; color:#ffffff;"><a href="${payload.portfolio}" target="_blank" style="color:#c9a14d;">${payload.portfolio}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#a3a3a3;"><strong>Événement ciblé :</strong></td>
          <td style="padding:6px 0; color:#ffffff;">${payload.eventName}</td>
        </tr>
      </table>
      ${payload.message ? `
        <div style="background-color:rgba(255,255,255,0.05); padding:16px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:20px;">
          <p style="margin:0 0 8px 0; font-size:12px; color:#a3a3a3; text-transform:uppercase; font-weight:bold;">Message :</p>
          <p style="margin:0; font-size:14px; line-height:1.6; white-space:pre-wrap; color:#ffffff;">${payload.message}</p>
        </div>
      ` : ''}
      <p style="font-size:11px; color:#555555; text-align:center; margin:0;">
        Cette candidature a été soumise depuis le formulaire du site. Vous pouvez la gérer depuis votre tableau de bord admin.
      </p>
    </div>
  `

  // Execute both send calls
  try {
    await Promise.all([
      fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.email],
          subject: applicantSubject,
          html: applicantHtml,
        }),
      }),
      fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [fromEmail], // Notification to admin
          subject: adminSubject,
          html: adminHtml,
        }),
      }),
    ])
    console.log(`Emails de candidature envoyés avec succès pour ${payload.email}`)
  } catch (error: any) {
    console.error("Erreur lors de l'envoi des e-mails de candidature", error)
    // Non-blocking but throws to be handled in the action
    throw error
  }
}

