import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

function Hero() {
  const { t } = useTranslation()
  const { language } = useParams()
  const title = t('home.title')
  const titleAccent = t('home.titleAccent')
  const titleCharacters = Array.from(titleAccent)

  return (
    <section
      aria-labelledby="home-hero-title"
      className="flex min-h-[60vh] items-center justify-center px-4 text-center sm:px-6 md:min-h-[70vh]"
    >
      <div className="glass-strong my-8 w-full max-w-6xl rounded-3xl px-4 py-20 motion-safe:animate-fade-in-up motion-reduce:animate-none sm:px-8 sm:py-24">
        <h1
          aria-label={`${title} ${titleAccent}`}
          className="home-hero-title mx-auto max-w-4xl font-sans text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl lg:text-6xl"
          id="home-hero-title"
        >
          {title}{' '}
          <span className="sewn-word-wrap" key={language}>
            <span aria-hidden="true" className="sewn-word-outline">
              {titleCharacters.map((character, index) => (
                <span
                  className="sewn-outline-letter"
                  key={`${character}-${index}`}
                  style={{ '--letter-delay': `${index * 1.52}s` }}
                >
                  {character}
                </span>
              ))}
            </span>
            <span className="sewn-word" data-text={titleAccent}>
              {titleCharacters.map((character, index) => (
                <span
                  className="sewn-letter"
                  key={`${character}-${index}`}
                  style={{ '--letter-delay': `${index * 1.52}s` }}
                >
                  {character}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            to={`/${language}/examples`}
          >
            {t('home.hero.workLink')}
          </Link>
          <Link
            className="home-hero-contact inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-border px-6 py-3 font-semibold text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:bg-surface/20 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
            to={`/${language}/contact`}
          >
            {t('home.hero.contactLink')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
