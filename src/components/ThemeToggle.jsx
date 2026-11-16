import { useTranslation } from 'react-i18next'

function ThemeToggle({ theme, toggleTheme }) {
  const { t } = useTranslation()
  const isDark = theme === 'dark'

  return (
    <button
      aria-label={t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')}
      aria-pressed={isDark}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface p-2 text-text motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:border-brand motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      onClick={toggleTheme}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <g
          className={`origin-center motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-in-out motion-reduce:transition-none ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </g>
        <g
          className={`origin-center motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-in-out motion-reduce:transition-none ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        >
          <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.463.402.807a6.5 6.5 0 0 0 8.268 8.268c.344-.215.829-.003.803.397Z" />
        </g>
      </svg>
    </button>
  )
}

export default ThemeToggle
