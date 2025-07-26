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