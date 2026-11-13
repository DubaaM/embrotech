import { useTranslation } from 'react-i18next'
import ExampleCard from './ExampleCard'

function ExamplesGrid({ examples, isEmpty }) {
  const { t } = useTranslation()

  if (isEmpty) {
    return (
      <p className="py-16 text-center text-muted" role="status">
        {t('examples.empty')}
      </p>
    )
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0">
      {examples.map((example) => (
        <li key={example.id}>
          <ExampleCard example={example} />
        </li>
      ))}
    </ul>
  )
}

export default ExamplesGrid
