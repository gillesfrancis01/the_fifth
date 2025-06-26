'use server'
import { createAdminClient } from "../../../config/appwrite"


async function getSingleEvent(id:string) {
    try{
        const {databases} = await createAdminClient();


        const event = await databases.getDocument(
            process.env.NEXT_PUBLIC_DATABASE,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_EVENTS,
            id
        );
        return event;
    } catch(error) {
       console.log('failed to get evens', error);
    }
    
} 
export default getSingleEvent;