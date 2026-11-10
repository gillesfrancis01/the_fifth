// Legal texts. Spanish visitors see the English version (see LegalPage).
// Keep the EN and FR versions in sync when editing.

export type LegalLang = 'en' | 'fr'

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  items?: string[]
  /** Paragraphs shown after the list. */
  after?: string[]
}

export interface LegalDocument {
  title: string
  updatedLabel: string
  updated: string
  intro: string[]
  sections: LegalSection[]
}

export const CONTACT_EMAIL = 'info@thefifthevent.com'
export const CONTACT_ADDRESS = '738 Rue St-Paul O, Montréal (Québec) H3C 0N5'

export const privacyPolicy: Record<LegalLang, LegalDocument> = {
  en: {
    title: 'Privacy Policy',
    updatedLabel: 'Last updated',
    updated: 'November 9, 2026',
    intro: [
      'The Fifth Event (“The Fifth”, “we”, “us”) organizes events and sells tickets through this website. This policy explains what personal information we collect, why we collect it, who we share it with, and the choices and rights you have, in accordance with Québec’s Act respecting the protection of personal information in the private sector and Canada’s anti-spam legislation.',
      'By using this website, you acknowledge this policy. If you do not agree with it, please do not submit your personal information.',
    ],
    sections: [
      {
        heading: '1. Person responsible for personal information',
        paragraphs: [
          `The person in charge of the protection of personal information at The Fifth can be reached at ${CONTACT_EMAIL} or by mail at The Fifth Event, ${CONTACT_ADDRESS}. Send any question, access request or complaint about your personal information to this contact.`,
        ],
      },
      {
        heading: '2. Information we collect',
        paragraphs: ['We only collect the information needed for the purposes described below. Depending on how you use the site, this includes:'],
        items: [
          'Ticket purchases: your full name, email address, phone number, postal code (used only to calculate the applicable taxes), and the event, ticket type, quantity and promo code of your order. Your card details are entered directly with our payment processor, Stripe. We never see or store your card number.',
          'Contact form: your name, email address, phone number (optional), subject and message.',
          '“Join as a Provider” form: your name, email address, phone number, specialty, portfolio or social media link, the event you are interested in, and the message you write.',
          'Newsletter: your email address and, if you bought a ticket and chose to receive our news, your name.',
          'Event entry: when your ticket’s QR code is scanned at the door, we record that your ticket was used. Scanning is done by our authorized staff.',
          'Photos and videos: we photograph and film our events and publish some of them in our gallery and on our social media. If you appear in a picture and want it removed, contact us.',
          'Technical information: our website uses essential cookies only for the secure sessions of our administrators and door staff. Your browser may also store a small value to remember that you have already seen our newsletter pop-up. We do not use advertising or audience-tracking cookies. Videos from YouTube embedded in our gallery may set their own cookies once you play them.',
        ],
      },
      {
        heading: '3. Why we use your information',
        items: [
          'To process your order, issue your tickets and send them to you by email, including the confirmation and the QR code.',
          'To answer your messages and review provider applications.',
          'To manage entry at our events and prevent fraud or duplicate use of tickets.',
          'To send you our newsletter and offers, only if you agreed to receive them.',
          'To comply with our legal, tax and accounting obligations, and to protect our rights.',
          'To keep our website secure and working properly.',
        ],
      },
      {
        heading: '4. Your consent and electronic messages',
        paragraphs: [
          'We send transactional emails (such as your ticket and order confirmation) because they are needed to deliver what you bought.',
          'We send promotional emails only with your express consent: when you subscribe to our newsletter, or when you tick the optional box at checkout. This box is never ticked by default. Every promotional email contains a link to unsubscribe, and you can also withdraw your consent at any time by writing to us. Unsubscribing does not affect your tickets or the transactional emails related to your orders.',
        ],
      },
      {
        heading: '5. Who we share your information with',
        paragraphs: ['We do not sell your personal information. We share it only with the service providers that help us operate, and only what they need to do their job:'],
        items: [
          'Appwrite: hosting of our database and files (reservations, customers, messages, gallery).',
          'Stripe: secure payment processing.',
          'Resend: sending of our transactional emails (tickets, confirmations, replies).',
          'Brevo: management of our newsletter list, only for people who consented.',
          'Our website hosting provider.',
          'Google (YouTube): playback of videos embedded in our gallery.',
        ],
        after: [
          'We may also disclose information when required by law, a court or a public authority, or to protect the rights and safety of The Fifth, our guests and others.',
        ],
      },
      {
        heading: '6. Storage outside Québec',
        paragraphs: [
          'Our service providers may store or process information on servers located outside Québec and outside Canada. When this happens, we rely on providers that apply recognized security practices and we limit what is shared. Your information may then be subject to the laws of those jurisdictions.',
        ],
      },
      {
        heading: '7. How long we keep your information',
        paragraphs: [
          'We keep your personal information only as long as needed for the purposes above and to meet our legal, tax and accounting obligations. We then delete it or anonymize it. Newsletter data is kept until you unsubscribe.',
        ],
      },
      {
        heading: '8. Security',
        paragraphs: [
          'We protect your information with measures suited to its sensitivity: encrypted connections (HTTPS), restricted and password-protected administrator access, and trusted service providers. No system is perfectly secure, and we will notify you and the Commission d’accès à l’information if a confidentiality incident presents a risk of serious injury, as required by law.',
        ],
      },
      {
        heading: '9. Your rights',
        paragraphs: ['Under Québec law, you may at any time:'],
        items: [
          'ask to access the personal information we hold about you;',
          'ask us to correct inaccurate, incomplete or outdated information;',
          'withdraw your consent to the use or sharing of your information;',
          'ask us to stop sharing or delete your information, within the limits of our legal obligations;',
          'ask to receive your information in a structured, commonly used technological format.',
        ],
        after: [
          `To exercise these rights, write to ${CONTACT_EMAIL}. We will reply within 30 days. If you are not satisfied with our answer, you may file a complaint with the Commission d’accès à l’information du Québec (cai.gouv.qc.ca).`,
        ],
      },
      {
        heading: '10. Children',
        paragraphs: [
          'Our website is not intended for children under 14, and we do not knowingly collect their personal information without the consent of their parent or guardian. If you believe a child has given us information, contact us and we will delete it.',
        ],
      },
      {
        heading: '11. Changes to this policy',
        paragraphs: [
          'We may update this policy from time to time. The date at the top shows the latest version. If we make a significant change, we will inform you on this website or by email.',
        ],
      },
      {
        heading: '12. Contact us',
        paragraphs: [`The Fifth Event — ${CONTACT_ADDRESS} — ${CONTACT_EMAIL}`],
      },
    ],
  },
  fr: {
    title: 'Politique de confidentialité',
    updatedLabel: 'Dernière mise à jour',
    updated: '9 novembre 2026',
    intro: [
      'The Fifth Event (« The Fifth », « nous ») organise des événements et vend des billets par l’entremise de ce site Web. La présente politique explique quels renseignements personnels nous recueillons, pourquoi, avec qui nous les partageons, ainsi que vos choix et vos droits, conformément à la Loi sur la protection des renseignements personnels dans le secteur privé du Québec et à la législation canadienne anti-pourriel.',
      'En utilisant ce site, vous prenez connaissance de la présente politique. Si vous n’êtes pas d’accord, veuillez ne pas transmettre vos renseignements personnels.',
    ],
    sections: [
      {
        heading: '1. Responsable de la protection des renseignements personnels',
        paragraphs: [
          `La personne responsable de la protection des renseignements personnels chez The Fifth peut être jointe à ${CONTACT_EMAIL} ou par la poste à The Fifth Event, ${CONTACT_ADDRESS}. Adressez à cette personne toute question, demande d’accès ou plainte concernant vos renseignements personnels.`,
        ],
      },
      {
        heading: '2. Renseignements que nous recueillons',
        paragraphs: ['Nous ne recueillons que les renseignements nécessaires aux fins décrites ci-dessous. Selon l’usage que vous faites du site, il s’agit de :'],
        items: [
          'Achat de billets : votre nom complet, votre adresse courriel, votre numéro de téléphone, votre code postal (utilisé uniquement pour calculer les taxes applicables), ainsi que l’événement, le type de billet, la quantité et le code promo de votre commande. Les données de votre carte sont saisies directement auprès de notre processeur de paiement, Stripe. Nous ne voyons ni ne conservons jamais votre numéro de carte.',
          'Formulaire de contact : votre nom, votre adresse courriel, votre numéro de téléphone (facultatif), l’objet et votre message.',
          'Formulaire « Devenir prestataire » : votre nom, votre adresse courriel, votre numéro de téléphone, votre spécialité, votre lien de portfolio ou de réseau social, l’événement qui vous intéresse et le message que vous rédigez.',
          'Infolettre : votre adresse courriel et, si vous avez acheté un billet et choisi de recevoir nos nouvelles, votre nom.',
          'Entrée à l’événement : lorsque le code QR de votre billet est lu à l’entrée, nous enregistrons que votre billet a été utilisé. La lecture est effectuée par notre personnel autorisé.',
          'Photos et vidéos : nous photographions et filmons nos événements et en publions une partie dans notre galerie et sur nos réseaux sociaux. Si vous apparaissez sur une image et souhaitez qu’elle soit retirée, contactez-nous.',
          'Renseignements techniques : notre site n’utilise que des témoins (cookies) essentiels, pour les sessions sécurisées de nos administrateurs et du personnel à l’entrée. Votre navigateur peut aussi conserver une petite valeur indiquant que vous avez déjà vu la fenêtre d’inscription à l’infolettre. Nous n’utilisons pas de témoins publicitaires ni de mesure d’audience. Les vidéos YouTube intégrées à notre galerie peuvent déposer leurs propres témoins lorsque vous les lisez.',
        ],
      },
      {
        heading: '3. Pourquoi nous utilisons vos renseignements',
        items: [
          'Traiter votre commande, émettre vos billets et vous les envoyer par courriel, y compris la confirmation et le code QR.',
          'Répondre à vos messages et examiner les candidatures de prestataires.',
          'Gérer l’entrée à nos événements et prévenir la fraude ou l’utilisation multiple des billets.',
          'Vous envoyer notre infolettre et nos offres, uniquement si vous avez accepté de les recevoir.',
          'Respecter nos obligations légales, fiscales et comptables, et protéger nos droits.',
          'Assurer la sécurité et le bon fonctionnement de notre site.',
        ],
      },
      {
        heading: '4. Votre consentement et les messages électroniques',
        paragraphs: [
          'Nous envoyons des courriels transactionnels (comme votre billet et la confirmation de commande) parce qu’ils sont nécessaires à la livraison de ce que vous avez acheté.',
          'Nous n’envoyons des courriels promotionnels qu’avec votre consentement exprès : lorsque vous vous abonnez à notre infolettre ou lorsque vous cochez la case facultative au moment du paiement. Cette case n’est jamais cochée par défaut. Chaque courriel promotionnel comporte un lien de désabonnement, et vous pouvez aussi retirer votre consentement en tout temps en nous écrivant. Le désabonnement n’a aucune incidence sur vos billets ni sur les courriels transactionnels liés à vos commandes.',
        ],
      },
      {
        heading: '5. Avec qui nous partageons vos renseignements',
        paragraphs: ['Nous ne vendons pas vos renseignements personnels. Nous les communiquons uniquement aux fournisseurs de services qui nous aident à exploiter le site, et seulement ce dont ils ont besoin pour accomplir leur tâche :'],
        items: [
          'Appwrite : hébergement de notre base de données et de nos fichiers (réservations, clients, messages, galerie).',
          'Stripe : traitement sécurisé des paiements.',
          'Resend : envoi de nos courriels transactionnels (billets, confirmations, réponses).',
          'Brevo : gestion de notre liste d’infolettre, uniquement pour les personnes qui y ont consenti.',
          'Notre fournisseur d’hébergement du site Web.',
          'Google (YouTube) : lecture des vidéos intégrées à notre galerie.',
        ],
        after: [
          'Nous pouvons également communiquer des renseignements lorsque la loi, un tribunal ou une autorité publique l’exige, ou pour protéger les droits et la sécurité de The Fifth, de nos invités et d’autres personnes.',
        ],
      },
      {
        heading: '6. Conservation à l’extérieur du Québec',
        paragraphs: [
          'Nos fournisseurs de services peuvent conserver ou traiter des renseignements sur des serveurs situés à l’extérieur du Québec et du Canada. Le cas échéant, nous faisons appel à des fournisseurs qui appliquent des pratiques de sécurité reconnues et nous limitons les renseignements communiqués. Vos renseignements peuvent alors être assujettis aux lois de ces territoires.',
        ],
      },
      {
        heading: '7. Durée de conservation',
        paragraphs: [
          'Nous conservons vos renseignements personnels uniquement le temps nécessaire aux fins ci-dessus et pour respecter nos obligations légales, fiscales et comptables. Nous les détruisons ou les anonymisons ensuite. Les données de l’infolettre sont conservées jusqu’à votre désabonnement.',
        ],
      },
      {
        heading: '8. Sécurité',
        paragraphs: [
          'Nous protégeons vos renseignements par des mesures adaptées à leur sensibilité : connexions chiffrées (HTTPS), accès administrateur restreint et protégé par mot de passe, et fournisseurs de confiance. Aucun système n’est parfaitement sûr; si un incident de confidentialité présente un risque de préjudice sérieux, nous vous en aviserons ainsi que la Commission d’accès à l’information, comme l’exige la loi.',
        ],
      },
      {
        heading: '9. Vos droits',
        paragraphs: ['En vertu de la loi québécoise, vous pouvez en tout temps :'],
        items: [
          'demander l’accès aux renseignements personnels que nous détenons à votre sujet;',
          'demander la correction de renseignements inexacts, incomplets ou équivoques;',
          'retirer votre consentement à l’utilisation ou à la communication de vos renseignements;',
          'demander que nous cessions de diffuser vos renseignements ou que nous les supprimions, dans les limites de nos obligations légales;',
          'demander de recevoir vos renseignements dans un format technologique structuré et couramment utilisé.',
        ],
        after: [
          `Pour exercer ces droits, écrivez à ${CONTACT_EMAIL}. Nous répondrons dans un délai de 30 jours. Si notre réponse ne vous satisfait pas, vous pouvez déposer une plainte auprès de la Commission d’accès à l’information du Québec (cai.gouv.qc.ca).`,
        ],
      },
      {
        heading: '10. Enfants',
        paragraphs: [
          'Notre site ne s’adresse pas aux enfants de moins de 14 ans et nous ne recueillons pas sciemment leurs renseignements personnels sans le consentement de leur parent ou tuteur. Si vous croyez qu’un enfant nous a transmis des renseignements, contactez-nous et nous les supprimerons.',
        ],
      },
      {
        heading: '11. Modifications de la politique',
        paragraphs: [
          'Nous pouvons mettre à jour la présente politique de temps à autre. La date en haut de page indique la version la plus récente. En cas de changement important, nous vous en informerons sur ce site ou par courriel.',
        ],
      },
      {
        heading: '12. Nous joindre',
        paragraphs: [`The Fifth Event — ${CONTACT_ADDRESS} — ${CONTACT_EMAIL}`],
      },
    ],
  },
}

export const refundPolicy: Record<LegalLang, LegalDocument> = {
  en: {
    title: 'Refund Policy',
    updatedLabel: 'Last updated',
    updated: 'November 9, 2026',
    intro: [
      'This policy applies to all tickets bought on this website for events organized by The Fifth Event (“The Fifth”, “we”, “us”). Please read it before completing your purchase.',
    ],
    sections: [
      {
        heading: '1. All sales are final',
        paragraphs: [
          'Tickets are non-refundable and non-exchangeable. Once your payment is confirmed, we cannot refund it because you changed your mind, can no longer attend, bought the wrong ticket or quantity, or are unable to travel.',
        ],
      },
      {
        heading: '2. If we cancel an event',
        paragraphs: [
          'If we cancel an event, you will receive a full refund of the price you paid for your ticket, including taxes, to the original payment method. We will contact you by email. Your bank may take 5 to 10 business days to show the refund on your statement.',
        ],
      },
      {
        heading: '3. If we postpone or reschedule an event',
        paragraphs: [
          'If an event is postponed or its date changes, your ticket stays valid for the new date. If you cannot attend the new date, you may ask for a refund by writing to us within 14 days of the announcement of the new date.',
        ],
      },
      {
        heading: '4. Changes that do not give right to a refund',
        paragraphs: ['A refund is not available for the following reasons:'],
        items: [
          'a change in the program, lineup, performers, DJs, schedule or venue layout;',
          'an event that goes ahead as planned but that you did not enjoy;',
          'being late or missing the event;',
          'refused entry because of a failure to respect the event’s rules, the age requirement, the dress code, a valid ID check, or the safety instructions of our staff and the venue.',
        ],
      },
      {
        heading: '5. Technical errors and double charges',
        paragraphs: [
          'If you were charged twice for the same order, or you paid but did not receive your ticket email, contact us as soon as possible with the details below. After verification, we will correct the error or refund the amount charged in error. Please also check your spam folder before writing to us.',
        ],
      },
      {
        heading: '6. Transfers',
        paragraphs: [
          'If you cannot attend, you may ask whether the ticket can be transferred to another person. A transfer is not guaranteed and is at our discretion. Each ticket has a unique QR code that can be used only once, so please do not share or resell your ticket: a copy or a resold ticket may be refused at the entrance.',
        ],
      },
      {
        heading: '7. Promo codes',
        paragraphs: [
          'When a refund is granted for a ticket bought with a promo code, we refund the amount actually paid. The promo code itself is not reissued.',
        ],
      },
      {
        heading: '8. How to request a refund',
        paragraphs: [
          `Write to ${CONTACT_EMAIL} with the full name and email address used for the order, the event name, and the reason for your request. We will reply within 5 business days. Please contact us before disputing a charge with your bank, so that we can solve the issue quickly.`,
        ],
      },
      {
        heading: '9. Your legal rights',
        paragraphs: [
          'This policy does not limit any right you have under the consumer protection laws that apply to you and that cannot be waived.',
        ],
      },
      {
        heading: '10. Contact us',
        paragraphs: [`The Fifth Event — ${CONTACT_ADDRESS} — ${CONTACT_EMAIL}`],
      },
    ],
  },
  fr: {
    title: 'Politique de non-remboursement',
    updatedLabel: 'Dernière mise à jour',
    updated: '9 novembre 2026',
    intro: [
      'La présente politique s’applique à tous les billets achetés sur ce site pour des événements organisés par The Fifth Event (« The Fifth », « nous »). Veuillez la lire avant de finaliser votre achat.',
    ],
    sections: [
      {
        heading: '1. Toutes les ventes sont finales',
        paragraphs: [
          'Les billets ne sont ni remboursables ni échangeables. Une fois votre paiement confirmé, nous ne pouvons pas le rembourser parce que vous avez changé d’idée, que vous ne pouvez plus assister à l’événement, que vous vous êtes trompé de billet ou de quantité, ou que vous ne pouvez pas vous déplacer.',
        ],
      },
      {
        heading: '2. Si nous annulons un événement',
        paragraphs: [
          'Si nous annulons un événement, vous recevrez un remboursement complet du prix payé pour votre billet, taxes comprises, selon le mode de paiement initial. Nous vous contacterons par courriel. Votre institution financière peut prendre de 5 à 10 jours ouvrables pour faire apparaître le remboursement sur votre relevé.',
        ],
      },
      {
        heading: '3. Si nous reportons ou modifions la date d’un événement',
        paragraphs: [
          'Si un événement est reporté ou si sa date change, votre billet demeure valide pour la nouvelle date. Si vous ne pouvez pas assister à la nouvelle date, vous pouvez demander un remboursement en nous écrivant dans les 14 jours suivant l’annonce de la nouvelle date.',
        ],
      },
      {
        heading: '4. Changements ne donnant pas droit à un remboursement',
        paragraphs: ['Aucun remboursement n’est offert pour les motifs suivants :'],
        items: [
          'un changement de programmation, de distribution, d’artistes, de DJ, d’horaire ou d’aménagement du lieu;',
          'un événement qui a lieu comme prévu mais que vous n’avez pas apprécié;',
          'un retard ou une absence à l’événement;',
          'un refus d’entrée dû au non-respect des règles de l’événement, de l’âge requis, du code vestimentaire, de la vérification d’une pièce d’identité valide ou des consignes de sécurité de notre personnel et du lieu.',
        ],
      },
      {
        heading: '5. Erreurs techniques et double facturation',
        paragraphs: [
          'Si vous avez été facturé deux fois pour la même commande, ou si vous avez payé sans recevoir le courriel de votre billet, contactez-nous dès que possible avec les renseignements ci-dessous. Après vérification, nous corrigerons l’erreur ou rembourserons le montant facturé par erreur. Pensez aussi à vérifier votre dossier de courriels indésirables avant de nous écrire.',
        ],
      },
      {
        heading: '6. Transferts',
        paragraphs: [
          'Si vous ne pouvez pas assister à l’événement, vous pouvez demander si le billet peut être transféré à une autre personne. Un transfert n’est pas garanti et relève de notre discrétion. Chaque billet comporte un code QR unique, utilisable une seule fois : veuillez ne pas partager ni revendre votre billet, car une copie ou un billet revendu pourrait être refusé à l’entrée.',
        ],
      },
      {
        heading: '7. Codes promo',
        paragraphs: [
          'Lorsqu’un remboursement est accordé pour un billet acheté avec un code promo, nous remboursons le montant réellement payé. Le code promo lui-même n’est pas réémis.',
        ],
      },
      {
        heading: '8. Comment demander un remboursement',
        paragraphs: [
          `Écrivez à ${CONTACT_EMAIL} en indiquant le nom complet et l’adresse courriel utilisés pour la commande, le nom de l’événement et le motif de votre demande. Nous répondrons dans un délai de 5 jours ouvrables. Veuillez nous contacter avant de contester un débit auprès de votre institution financière, afin que nous puissions régler la situation rapidement.`,
        ],
      },
      {
        heading: '9. Vos droits légaux',
        paragraphs: [
          'La présente politique ne limite aucun des droits que vous confèrent les lois sur la protection du consommateur qui s’appliquent à vous et auxquels on ne peut renoncer.',
        ],
      },
      {
        heading: '10. Nous joindre',
        paragraphs: [`The Fifth Event — ${CONTACT_ADDRESS} — ${CONTACT_EMAIL}`],
      },
    ],
  },
}
