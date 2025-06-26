'use server'
import { createAdminClient } from "../../../config/appwrite"
import { ID } from 'node-appwrite'


async function addCustomer(previousState:any, formData:any) {
    try{
        const {databases} = await createAdminClient();


        const newCustomer = await databases.createDocument(
            process.env.NEXT_PUBLIC_DATABASE,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CUSTOMERS,
            ID.unique(),
            {
                email: formData.get('email')
            }

        )
        console.log(newCustomer)

        return {
            success: true,
        };
    } catch(error) {
       console.log('failed to add Customer', error);
       const errorMessage = error.response.message || 'an unexpected error has occured'
       return {
        error: errorMessage
       }
    }
    
} 
export default addCustomer;