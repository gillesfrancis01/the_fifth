export interface events{
    $id: string,
    name: string,
    description: string,
    date: string,
    adresse: string,
    image: string,
    teaser: string,
    description_sections: string[]
}
export interface Ticket {
    $id: string
    name: string
    advantages: string[]
    price: number
    available: boolean
    quantity: number
    event?: string
  }
export interface TicketWithAvailability extends Ticket {
    sold: number
    remaining: number
  }
export interface Customer {
    $id: string
    fullName: string
    email: string
    phone: string
}
export interface Reservation {
    $id: string
    customer_ID: string
    event_ID: string
    ticket_ID: string
    paymentIntent: string
    $createdAt?: string
}
export interface service {
    id: string,
    title: string,
    description: string,
}
export interface portfolio {
    id:number,
    name:string,
    image:string,
    client:string,
    description:string
}
export interface testimonial {
    id: number,
    userImg:string,
    userName: string,
    rate:string,
    userMessage:string,
}