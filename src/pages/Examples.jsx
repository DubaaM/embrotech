import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import getExamples from '../data/examples'
import ExamplesGrid from '../components/examples/ExamplesGrid'
import GarmentFilter from '../components/examples/GarmentFilter'

function Examples() {
  const { t } = useTranslation()
  const { language } = useParams()
  const examples = useMemo(() => getExamples(language), [language])
  const [searchParams, setSearchParams] = useSearchParams()
  const garments = [...new Set(examples.map((example) => example.garment))]
  const requestedGarment = searchParams.get('garment')
  const selectedGarment = garments.includes(requestedGarment)
    ? requestedGarment
    : 'all'
  const filteredExamples = useMemo(
    () =>
      selectedGarment === 'all'
        ? examples
        : examples.filter((example) => example.garment === selectedGarment),
    [examples, selectedGarment],
  )

  function changeGarment(garment) {
    const nextParams = new URLSearchParams(searchParams)
    if (garment === 'all') {
      nextParams.delete('garment')
    } else {
      nextParams.set('garment', garment)
    }
    setSearchParams(nextParams)
  }

  return (
    <>
      <section
        aria-labelledby="examples-title"
        className="bg-bg px-4 py-16 sm:py-20 lg:py-24 motion-safe:animate-fade-in-up motion-reduce:animate-none"
      >
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-2xl text-center">
            <h1
              className="text-4xl font-bold tracking-tight text-text sm:text-5xl"
              id="examples-title"
            >
              {t('examples.title')}
            </h1>
            <p className="mt-4 text-lg leading-7 text-muted">
              {t('examples.description')}
            </p>
          </header>

          <div className="mt-8">
            <GarmentFilter
              garments={garments}
              onChange={changeGarment}
              selectedGarment={selectedGarment}
            />
          </div>

          <div
            className="mt-10 motion-safe:animate-fade-in-up motion-reduce:animate-none"
            key={selectedGarment}
          >
            <ExamplesGrid
              examples={filteredExamples}
              isEmpty={filteredExamples.length === 0}
            />
          </div>

          <p className="mt-8 text-center text-sm leading-6 text-muted">
            {t('examples.priceDisclaimer')}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="examples-contact-title"
        className="bg-brand px-4 py-16 text-center text-on-brand sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            id="examples-contact-title"
          >
            {t('examples.contact.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7">
            {t('examples.contact.description')}
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 font-semibold text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            to={`/${language}/contact`}
          >
            {t('examples.contact.button')}
          </Link>
        </div>
      </section>
    </>
  )
}

export default Examples
