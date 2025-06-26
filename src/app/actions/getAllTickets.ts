'use server'
import { events } from "@/types";
import { createAdminClient } from "../../../config/appwrite"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Query } from "node-appwrite";
import { log } from "console";

async function getAllTickets(id:string) {
    try{
        const {databases} = await createAdminClient();


        const {documents: tickets} = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET,
            [
                Query.equal('event', [id])

            ]

        );
        return tickets;
    } catch(error) {
       console.log('failed to get evens', error);
       console.log(id);
       
    }
    
} 
export default getAllTickets;