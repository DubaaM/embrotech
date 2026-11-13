import { useTranslation } from 'react-i18next'

function ThemeToggle({ theme, toggleTheme }) {
  const { t } = useTranslation()
  const isDark = theme === 'dark'

  return (
    <button
      aria-label={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
      aria-pressed={isDark}
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-2 py-2 text-sm font-medium text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:border-brand motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-3"
      onClick={toggleTheme}
      type="button"
    >
      <span className="hidden sm:inline">
        {t(isDark ? 'theme.dark' : 'theme.light')}
      </span>
    </button>
  )
}

export default ThemeToggle
