import { useTranslation } from 'react-i18next'

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="glass-strong border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  )
}

export default Footer
