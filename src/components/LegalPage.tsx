'use client'

import React from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import type { LegalDocument, LegalLang } from '@/constants/legal'

interface LegalPageProps {
  documents: Record<LegalLang, LegalDocument>
}

// Legal texts exist in English and French; Spanish visitors read the English version.
export default function LegalPage({ documents }: LegalPageProps) {
  const { lang } = useLanguage()
  const doc = documents[lang === 'fr' ? 'fr' : 'en']

  return (
    <div className="font-Poppins px-6 pb-16 pt-6">
      <div className="text-center">
        <h1 className="text-main font-Josefin text-3xl font-bold uppercase">{doc.title}</h1>
        <Image src="/arrows.svg" className="m-auto mt-3" width={300} height={18} alt="" />
        <p className="mt-4 text-xs tracking-widest text-white/50">
          {doc.updatedLabel} : {doc.updated}
        </p>
      </div>

      <article className="mx-auto mt-10 max-w-3xl space-y-10 leading-7 text-white/80">
        <div className="space-y-4">
          {doc.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {doc.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-main font-Josefin text-xl font-bold">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul className="list-disc space-y-2 pl-6 marker:text-[#E6C55D]">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.after?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  )
}
