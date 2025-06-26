'use server'
import { events } from "@/types";
import { createAdminClient } from "../../../config/appwrite"

import { Query } from "node-appwrite";

async function getNextEvent() {
    try {
        const { databases } = await createAdminClient();
    
        const { documents } = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS!,
          [
            // Filtrer les événements à venir
            Query.greaterThanEqual("date", new Date().toISOString()),
            // Trier par date croissante
            Query.orderAsc("date"),
            // Limiter au prochain
            Query.limit(1)
          ]
        );
    
        if (documents.length === 0) return null;
    
        return documents[0] as events;
      } catch (error) {
        console.error('Failed to fetch next event:', error);
        return null;
      }
    
} 
export default getNextEvent;