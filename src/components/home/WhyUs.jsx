import { useTranslation } from 'react-i18next'

const factIndexes = [0, 1, 2]

function WhyUs() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="why-embrotech-title"
      className="px-4 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-center text-3xl font-bold tracking-tight text-text sm:text-4xl"
          data-reveal
          id="why-embrotech-title"
        >
          {t('home.why.title')}
        </h2>
        <div className="mt-10 grid gap-8 text-center md:grid-cols-3 lg:mt-12">
          {factIndexes.map((index) => (
            <div className="glass rounded-2xl px-4 py-6" data-reveal key={index} style={{ '--reveal-order': index }}>
              <p className="text-4xl font-bold tracking-tight text-brand sm:text-5xl">
                {t(`home.why.facts.${index}.value`)}
              </p>
              <p className="mx-auto mt-3 max-w-xs leading-7 text-muted">
                {t(`home.why.facts.${index}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyUs
