export interface events{
    $id: string,
    name: string,
    description: string,
    date: string,
    adresse: string,
    image: string,
    teaser: string,
    
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