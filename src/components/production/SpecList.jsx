import { useTranslation } from 'react-i18next'

function SpecList({ specs }) {
  const { t } = useTranslation()

  return (
    <ul className="production-specs">
      {specs.map((spec) => (
        <li key={spec}>
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m5 12 4 4L19 6" />
          </svg>
          <span>{t(spec)}</span>
        </li>
      ))}
    </ul>
  )
}

export default SpecList
