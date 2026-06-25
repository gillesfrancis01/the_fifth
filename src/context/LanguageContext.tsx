'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type Language = 'en' | 'fr' | 'es'

interface LanguageContextProps {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    Home: 'Home',
    Service: 'Service',
    Gallery: 'Gallery',
    Event: 'Event',
    Portfolio: 'Portfolio',
    contact: 'Contact Us',
    menu: 'Menu',
    heroTitle: 'EXPERIENCE EVENTS LIKE NEVER BEFORE.',
    heroSubtitle:
      'Welcome to The Fifth Event Agency, where innovation meets excellence in event planning. We take pride in crafting extraordinary moments tailored to your vision.',
    heroButton: 'Our Events',
    aboutTitle: 'About Us',
    aboutSubtitle:
      "Inspiring Events, Lasting Impressions, Let\u2019s Write Your Story",
    aboutDescription:
      'Join us as we take you behind the scenes of our spectacular events, showcasing the magic we create from concept to execution. From elegant weddings to corporate galas and everything in between, our channel offers expert tips, creative inspiration, and captivating event recaps that will leave you inspired to host your own unforgettable gatherings.',
    learnMore: 'Learn More',
    subscribeTitle: 'Subscribe for the Newsletter',
    subscribePlaceholder: 'Your email here',
    subscribeButton: 'Subscribe',
    craftingEvents: 'Crafting Extraordinary Events Together',
    links: 'Links',
    client: 'Client',
    description: 'Description',
    ourPortfolio: 'Our Portfolio',
    portfolioTagline: 'From Concept to Celebration, Where Your\u00A0Dreams Take Center Stage',
    whatWeDo: 'What we do',
    fullServiceEventProduction: 'Full-service event production',
    nextEvent: 'Next Event',
    noNextEvent: 'No next event',
    JoinUs: 'Join as a Provider',
    free: 'Free',
    price: 'Price'
  },
  fr: {
    Home: 'Accueil',
    Service: 'Service',
    Gallery: 'Galerie',
    Event: 'Evenement',
    Portfolio: 'Portfolio',
    contact: 'Contactez-nous',
    menu: 'Menu',
    heroTitle: 'VIVEZ DES ÉVÉNEMENTS COMME JAMAIS.',
    heroSubtitle:
      "Bienvenue chez The Fifth Event Agency, où l’innovation rencontre l’excellence dans la planification d’événements. Nous créons des moments extraordinaires adaptés à votre vision.",
    heroButton: 'Nos événements',
    aboutTitle: 'À propos de nous',
    aboutSubtitle:
      'Des événements inspirants, des impressions durables, écrivons votre histoire',
    aboutDescription:
      'Rejoignez-nous dans les coulisses de nos spectacles pour découvrir la magie que nous créons du concept à la réalisation. Mariages élégants, galas d’entreprise et bien plus encore : trouvez conseils et inspiration pour vos propres réceptions inoubliables.',
    learnMore: 'En savoir plus',
    subscribeTitle: 'Inscrivez-vous à la newsletter',
    subscribePlaceholder: 'Votre email ici',
    subscribeButton: 'S’abonner',
    craftingEvents: 'Créer ensemble des événements extraordinaires',
    links: 'Liens',
    client: 'Client',
    description: 'Description',
    ourPortfolio: 'Notre portfolio',
    portfolioTagline: 'Du concept à la célébration, où vos rêves prennent le devant de la scène',
    whatWeDo: 'Ce que nous faisons',
    fullServiceEventProduction: "Production d'événements clés en main",
    nextEvent: 'Prochain événement',
    noNextEvent: "Aucun événement à venir",
    JoinUs: 'Devenir Prestataire',
    free: 'Gratuit',
    price: 'Prix'
  },
  es: {
    Home: 'Inicio',
    Service: 'Servicio',
    Gallery: 'Galería',
    Event: 'Evento',
    Portfolio: 'Portafolio',
    contact: 'Contáctenos',
    menu: 'Menú',
    heroTitle: 'VIVE EVENTOS COMO NUNCA ANTES.',
    heroSubtitle:
      'Bienvenido a The Fifth Event Agency, donde la innovación se une a la excelencia en la planificación de eventos. Nos enorgullece crear momentos extraordinarios adaptados a su visión.',
    heroButton: 'Nuestros eventos',
    aboutTitle: 'Sobre nosotros',
    aboutSubtitle:
      'Eventos inspiradores, impresiones duraderas, escribamos su historia',
    aboutDescription:
      'Acompáñanos tras bambalinas de nuestros espectaculares eventos y descubre la magia que creamos desde el concept hasta la ejecución. Desde bodas elegantes hasta galas corporativas, encuentra consejos e inspiración para organizar tus propias celebraciones inolvidables.',
    learnMore: 'Aprender más',
    subscribeTitle: 'Suscríbete al boletín',
    subscribePlaceholder: 'Tu correo aquí',
    subscribeButton: 'Suscribirse',
    craftingEvents: 'Creando juntos eventos extraordinarios',
    links: 'Enlaces',
    client: 'Cliente',
    description: 'Descripción',
    ourPortfolio: 'Nuestro portafolio',
    portfolioTagline: 'Del concepto a la celebración, donde tus sueños toman el centro del escenario',
    whatWeDo: 'Lo que hacemos',
    fullServiceEventProduction: 'Producción de eventos integral',
    nextEvent: 'Próximo evento',
    noNextEvent: 'No hay próximo evento',
    JoinUs: 'Unirse como Colaborador',
    free: 'Gratis',
    price: 'Precio'
  }
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key
})

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('en')

  const t = (key: string): string => {
    return translations[lang][key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

