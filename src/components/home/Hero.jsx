import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

const THREAD_HUES = [22, 45, 170, 205, 22, 45, 170, 205, 22]
const LETTER_STITCH_INTERVAL = 1.5

function Hero() {
  const { t } = useTranslation()
  const { language } = useParams()
  const title = t('home.title')
  const titleAccent = t('home.titleAccent')
  const titleCharacters = Array.from(titleAccent)

  return (
    <section
      aria-labelledby="home-hero-title"
      className="home-hero mx-3 mt-4 flex min-h-[60vh] items-start px-6 sm:px-10 md:min-h-[70vh] lg:px-12"
    >
      <div className="w-full max-w-xl py-10 motion-safe:animate-fade-in-up motion-reduce:animate-none sm:py-12">
        <div>
          <h1
            aria-label={`${title} ${titleAccent}`}
            className="home-hero-title max-w-3xl text-text"
            id="home-hero-title"
          >
            {title}{' '}
            <span className="sewn-word-wrap" key={language}>
              <span aria-hidden="true" className="sewn-word-outline">
                {titleCharacters.map((character, index) => (
                  <span
                    className="sewn-outline-letter"
                    key={`${character}-${index}`}
                    style={{
                      '--letter-delay': `${index * LETTER_STITCH_INTERVAL}s`,
                      '--thread-hue': `${THREAD_HUES[index % THREAD_HUES.length]}deg`,
                    }}
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
                    style={{
                      '--letter-delay': `${index * LETTER_STITCH_INTERVAL}s`,
                      '--thread-hue': `${THREAD_HUES[index % THREAD_HUES.length]}deg`,
                    }}
                  >
                    {character}
                  </span>
                ))}
              </span>
            </span>
          </h1>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <Link
              className="glass home-hero-primary inline-flex min-h-12 w-full items-center justify-center rounded-lg px-6 py-3 font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              to={`/${language}/examples`}
            >
              {t('home.hero.workLink')}
            </Link>
            <Link
              className="glass home-hero-contact inline-flex min-h-12 w-full items-center justify-center rounded-lg px-6 py-3 font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
              to={`/${language}/contact`}
            >
              {t('home.hero.contactLink')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
