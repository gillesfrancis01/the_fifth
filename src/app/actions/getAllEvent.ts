'use server'
import { events } from "@/types";
import { createAdminClient } from "../../../config/appwrite"


async function getAllEvents() {
    try{
        const {databases} = await createAdminClient();


        const {documents: events } = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS,
        );
        return events as unknown as events[]
    } catch(error) {
       console.log('failed to get evens', error);
    }
    
} 
export default getAllEvents;