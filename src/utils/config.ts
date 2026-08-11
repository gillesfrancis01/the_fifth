export function getReservationConfig() {
    const databaseId = process.env.NEXT_PUBLIC_DATABASE
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION

    if (!databaseId || !collectionId) {
        return { error: "Configuration Appwrite manquante pour les réservations." }
    }

    return { databaseId, collectionId }
}

export function getScannerConfig() {
    const databaseId = process.env.NEXT_PUBLIC_DATABASE
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS

    if (!databaseId || !collectionId) {
        return { error: "Configuration Appwrite manquante pour les comptes scanner." }
    }

    return { databaseId, collectionId }
}
