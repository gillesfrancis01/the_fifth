'use server'

import { createAdminClient } from "../../../config/appwrite";
import { ID } from 'node-appwrite';

interface FormState {
  success?: boolean;
  error?: string;
}

async function addCustomer(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { databases } = await createAdminClient();

    const email = formData.get('email');

    if (!email || typeof email !== 'string') {
      return {
        error: 'Email invalide ou manquant.',
      };
    }

    await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS!,
      ID.unique(),
      { email }
    );

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l’ajout du client:', error);
    const errorMessage =
      error?.response?.message ?? 'Vous êtes déjà inscrit à la newsletter';

    return { error: errorMessage };
  }
}

export default addCustomer;
