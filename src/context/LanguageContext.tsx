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
    JoinUs: 'Join as Artist'
  },
  fr: {
    Home: 'Accueil',
    Service: 'Service',
    Gallery: 'Galerie',
    Event: 'Evenement',
    Portfolio: 'Portfolio',
    contact: 'Contactez-nous',
    menu: 'Menu',
    heroTitle: 'VIVEZ DES \u00C9V\u00C9NEMENTS COMME JAMAIS.',
    heroSubtitle:
      "Bienvenue chez The Fifth Event Agency, o\u00F9 l\u2019innovation rencontre l\u2019excellence dans la planification d\u2019\u00E9v\u00E9nements. Nous cr\u00E9ons des moments extraordinaires adapt\u00E9s \u00E0 votre vision.",
    heroButton: 'Nos \u00E9v\u00E9nements',
    aboutTitle: '\u00C0 propos de nous',
    aboutSubtitle:
      'Des \u00E9v\u00E9nements inspirants, des impressions durables, \u00E9crivons votre histoire',
    aboutDescription:
      'Rejoignez-nous dans les coulisses de nos spectacles pour d\u00E9couvrir la magie que nous cr\u00E9ons du concept \u00E0 la r\u00E9alisation. Mariages \u00E9l\u00E9gants, galas d\u2019entreprise et bien plus encore : trouvez conseils et inspiration pour vos propres r\u00E9ceptions inoubliables.',
    learnMore: 'En savoir plus',
    subscribeTitle: 'Inscrivez-vous \u00E0 la newsletter',
    subscribePlaceholder: 'Votre email ici',
    subscribeButton: 'S\u2019abonner',
    craftingEvents: 'Cr\u00E9er ensemble des \u00E9v\u00E9nements extraordinaires',
    links: 'Liens',
    client: 'Client',
    description: 'Description',
    ourPortfolio: 'Notre portfolio',
    portfolioTagline: 'Du concept \u00E0 la c\u00E9l\u00E9bration, o\u00F9 vos r\u00EAves prennent le devant de la sc\u00E8ne',
    whatWeDo: 'Ce que nous faisons',
    fullServiceEventProduction: "Production d'\u00E9v\u00E9nements cl\u00E9s en main",
    nextEvent: 'Prochain \u00E9v\u00E9nement',
    noNextEvent: "Aucun \u00E9v\u00E9nement \u00E0 venir",
    JoinUs: 'Devenir Prestataire'
  },
  es: {
    Home: 'Inicio',
    Service: 'Servicio',
    Gallery: 'Galer\u00EDa',
    Event: 'Evento',
    Portfolio: 'Portafolio',
    contact: 'Cont\u00E1ctenos',
    menu: 'Men\u00FA',
    heroTitle: 'VIVE EVENTOS COMO NUNCA ANTES.',
    heroSubtitle:
      'Bienvenido a The Fifth Event Agency, donde la innovaci\u00F3n se une a la excelencia en la planificaci\u00F3n de eventos. Nos enorgullece crear momentos extraordinarios adaptados a su visi\u00F3n.',
    heroButton: 'Nuestros eventos',
    aboutTitle: 'Sobre nosotros',
    aboutSubtitle:
      'Eventos inspiradores, impresiones duraderas, escribamos su historia',
    aboutDescription:
      'Acomp\u00E1\u00F1anos tras bambalinas de nuestros espectaculares eventos y descubre la magia que creamos desde el concepto hasta la ejecuci\u00F3n. Desde bodas elegantes hasta galas corporativas, encuentra consejos e inspiraci\u00F3n para organizar tus propias celebraciones inolvidables.',
    learnMore: 'Aprender m\u00E1s',
    subscribeTitle: 'Suscr\u00EDbete al bolet\u00EDn',
    subscribePlaceholder: 'Tu correo aqu\u00ED',
    subscribeButton: 'Suscribirse',
    craftingEvents: 'Creando juntos eventos extraordinarios',
    links: 'Enlaces',
    client: 'Cliente',
    description: 'Descripci\u00F3n',
    ourPortfolio: 'Nuestro portafolio',
    portfolioTagline: 'Del concepto a la celebraci\u00F3n, donde tus sue\u00F1os toman el centro del escenario',
    whatWeDo: 'Lo que hacemos',
    fullServiceEventProduction: 'Producci\u00F3n de eventos integral',
    nextEvent: 'Pr\u00F3ximo evento',
    noNextEvent: 'No hay pr\u00F3ximo evento',
    JoinUs: 'Unirse como Artista'
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

