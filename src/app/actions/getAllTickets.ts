'use server'
import { Reservation, Ticket, TicketWithAvailability } from "@/types";
import { createAdminClient } from "../../../config/appwrite"

import { Query } from "node-appwrite";

async function getAllTickets(id:string): Promise<TicketWithAvailability[]> {
    try{
        const {databases} = await createAdminClient();


        const {documents: tickets} = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_TICKET,
            [
                Query.equal('event', [id])

            ]

        );
        const {documents: reservations} = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_RESERVATION,
            [
                Query.equal('event_ID', [id])
            ]
        );

        const soldByTicket = new Map<string, number>();

        (reservations as unknown as Reservation[]).forEach((reservation) => {
            soldByTicket.set(
                reservation.ticket_ID,
                (soldByTicket.get(reservation.ticket_ID) ?? 0) + 1
            );
        });

        return (tickets as unknown as Ticket[]).map((ticket) => {
            const quantity = typeof ticket.quantity === 'number' ? ticket.quantity : Number(ticket.quantity ?? 0);
            const sold = soldByTicket.get(ticket.$id) ?? 0;
            const remaining = Math.max(quantity - sold, 0);

            return {
                ...ticket,
                quantity,
                sold,
                remaining,
            } satisfies TicketWithAvailability;
        });
    } catch(error) {
       console.log('failed to get evens', error);
       console.log(id);

       return [];
    }

}
export default getAllTickets;
