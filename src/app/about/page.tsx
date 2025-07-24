'use client'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className='text-center font-Poppins p-6'>
      <h2 className='text-main text-center text-2xl font-Josefin'>F-JAY\'S EVENTS</h2>
      <Image src="/arrows.svg" className="m-auto" width={300} height={100} alt='arrows' />
      <p className='mt-10 leading-8 max-w-3xl mx-auto'>
        F-JAY\'S EVENTS : Une plateforme de promotions d'artistes variés et des soirées exceptionnelles hors du commun !
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Chers amateurs d'arts et d'expériences uniques,
        Nous sommes ravis de vous présenter F-JAY\'S EVENTS, une plateforme dédiée à la promotion d'artistes variés et à la création de soirées inoubliables. Chez F-JAY\'S EVENTS, nous croyons fermement que la diversité artistique est une richesse à célébrer, et nous nous efforçons de vous offrir des expériences uniques et hors du commun.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Notre objectif est de mettre en lumière la diversité des talents artistiques du monde entier, qu'il s'agisse de musiciens, danseurs, chanteurs, magiciens, acrobates ou tout autre artiste à la recherche d'une plateforme pour exprimer leur créativité. Nous recherchons constamment de nouveaux talents et nous les accompagnons tout au long de leur parcours artistique pour les aider à atteindre de nouveaux sommets.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Les soirées organisées par F-JAY\'S EVENTS sont bien plus que de simples spectacles. Elles sont conçues pour vous faire voyager à travers une multitude de performances artistiques captivantes. Des musiciens prodiges qui vous plongent dans une symphonie envoûtante aux danseurs qui repoussent les limites de leur corps avec grâce et souplesse, en passant par les artistes de cirque qui défient la gravité, nous vous promettons un mélange éclectique de talents.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Mais nos soirées ne se limitent pas aux performances sur scène. Nous créons des expériences immersives en ajoutant des éléments visuels époustouflants, des décors créatifs et une ambiance unique pour vous faire vivre un moment exceptionnel. Laissez-vous emporter par la magie, l'énergie débordante et l'atmosphère électrisante de nos soirées.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Nous travaillons en partenariat avec des lieux prestigieux, des organisateurs d'événements renommés et des entreprises visionnaires pour garantir que chaque soirée soit une expérience exceptionnelle du début à la fin. Notre équipe passionnée met tout en œuvre pour créer une atmosphère accueillante et inclusive où chaque personne se sente à l'aise et prête à profiter de l'art sous toutes ses formes.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        Restez à l'affût de nos prochains événements en visitant notre site web [à venir] et en nous suivant sur les réseaux sociaux [@f_jaysevents_official]. Ne manquez pas l'occasion d'explorer, de découvrir et de célébrer la variété des talents artistiques au sein des soirées F-JAY\'S EVENTS.
      </p>
      <p className='mt-6 leading-8 text-justify max-w-3xl mx-auto'>
        F-JAY\'S EVENTS : Ressentez, appréciez et laissez-vous inspirer par l'extraordinaire palette d'artistes qui illuminent nos soirées !
      </p>
    </div>
  )
}
