'use server'

import { createAdminClient } from "../../../config/appwrite";
import { ID, Query } from 'node-appwrite';
import { syncContactToBrevo } from '@/utils/brevo';

interface FormState {
  success?: boolean;
  error?: string;
}

async function addCustomer(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const email = formData.get('email');

    // Explicit consent is required before storing the address or adding it to
    // the newsletter list (checked here too: the form's checkbox can be bypassed).
    if (formData.get('consent') !== 'on') {
      return { error: 'Le consentement est requis pour s’inscrire à la newsletter.' };
    }

    const { databases } = await createAdminClient();

    if (!email || typeof email !== 'string') {
      return {
        error: 'Email invalide ou manquant.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const databaseId = process.env.NEXT_PUBLIC_DATABASE!;
    const customerCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS!;

    const existingCustomers = await databases.listDocuments(
      databaseId,
      customerCollectionId,
      [Query.equal('email', normalizedEmail), Query.limit(1)]
    );

    if (existingCustomers.documents.length === 0) {
      await databases.createDocument(
        databaseId,
        customerCollectionId,
        ID.unique(),
        { email: normalizedEmail }
      );
    }

    await syncContactToBrevo({ email: normalizedEmail });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l’ajout du client:', error);
    const errorMessage =
      error?.response?.message ?? 'L’inscription n’a pas pu être complétée. Veuillez réessayer.';

    return { error: errorMessage };
  }
}

export default addCustomer;
