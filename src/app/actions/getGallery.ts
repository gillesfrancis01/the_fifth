'use server'

import { Gallery } from "@/types";
import { createAdminClient } from "../../../config/appwrite"
import { Query } from "node-appwrite";

async function getGallery() {
    try {
        const { databases } = await createAdminClient();

        // TODO: User needs to add this to .env
        const galleryCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GALLERY;

        if (!galleryCollectionId) {
            console.error("NEXT_PUBLIC_APPWRITE_COLLECTION_GALLERY is not defined in .env");
            return [];
        }

        const { documents: galleries } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE!,
            galleryCollectionId,
            [Query.orderDesc('$createdAt')]
        );
        return galleries as unknown as Gallery[];
    } catch (error) {
        console.log('failed to get gallery', error);
        return [];
    }
}

export default getGallery;
