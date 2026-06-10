export interface events {
    $id: string,
    name: string,
    description: string,
    date: string,
    adresse: string,
    openingTime?: string,
    locationName?: string,
    locationFullAddress?: string,
    phone?: string,
    image: string,
    teaser: string,
    description_sections: string[]
}
export interface Ticket {
    $id: string
    name: string
    advantages: string[]
    price: number
    available: boolean | null
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
    $createdAt: string
}
export interface Reservation {
    status: string
    $id: string
    customer_ID: string
    event_ID: string
    ticket_ID: string
    paymentIntent: string
    available?: boolean
    $createdAt?: string
}
export interface service {
    id: string,
    title: string,
    description: string,
}
export interface portfolio {
    id: number,
    name: string,
    image: string,
    client: string,
    description: string
}
export interface testimonial {
    id: number,
    userImg: string,
    userName: string,
    rate: string,
    userMessage: string,
}

export interface Gallery {
    $id: string
    event: string
    images: string[]
    video?: string | null
}

export interface PromoCode {
    $id: string
    code: string
    type: 'percentage' | 'fixed'
    value: number
    active: boolean
}

export interface Provider {
    $id: string
    name: string
    email: string
    phone: string
    specialty: string
    portfolio: string
    eventId?: string | null
    message?: string | null
    status: 'pending' | 'accepted' | 'rejected'
    $createdAt?: string
}