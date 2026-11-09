interface BrevoContactInput {
  email: string
  fullName?: string
}

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts'

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY
  const rawListId = process.env.BREVO_NEWSLETTER_LIST_ID
  const listId = Number(rawListId)

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured.')
  }

  if (!rawListId || !Number.isInteger(listId) || listId <= 0) {
    throw new Error('BREVO_NEWSLETTER_LIST_ID must be a positive integer.')
  }

  return { apiKey, listId }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getNameAttributes(fullName?: string) {
  const normalizedName = fullName?.trim().replace(/\s+/g, ' ')
  if (!normalizedName) return undefined

  const [firstName, ...lastNameParts] = normalizedName.split(' ')
  const attributes: Record<string, string> = { FIRSTNAME: firstName }

  if (lastNameParts.length > 0) {
    attributes.LASTNAME = lastNameParts.join(' ')
  }

  return attributes
}

export async function syncContactToBrevo({ email, fullName }: BrevoContactInput) {
  const { apiKey, listId } = getBrevoConfig()
  const normalizedEmail = normalizeEmail(email)

  const response = await fetch(BREVO_CONTACTS_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: normalizedEmail,
      attributes: getNameAttributes(fullName),
      listIds: [listId],
      updateEnabled: true,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Brevo contact sync failed (${response.status}): ${details}`)
  }
}
