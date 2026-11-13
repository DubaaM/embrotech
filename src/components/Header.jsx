import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'
import logo from '../assets/logo/Logo.jpg'
import useTheme from '../hooks/useTheme'
import MenuButton from './MenuButton'
import ThemeToggle from './ThemeToggle'

const MOBILE_MENU_ID = 'mobile-navigation'

const navigationItems = [
  { key: 'home', path: '' },
  { key: 'about', path: 'about' },
  { key: 'production', path: 'production' },
  { key: 'examples', path: 'examples' },
  { key: 'sandbox', path: { sk: 'skusobna', en: 'try-it' } },
  { key: 'news', path: 'news' },
  { key: 'contact', path: 'contact' },
]

function NavigationLinks({ language, isMobile = false, onNavigate }) {
  const { t } = useTranslation()

  return navigationItems.map(({ key, path }) => {
    const localizedPath = typeof path === 'string' ? path : path[language]

    return (
      <NavLink
        end
        key={key}
        className={({ isActive }) =>
          `group relative inline-flex ${
            isMobile ? 'min-h-12 w-full' : 'min-h-10'
          } items-center justify-center overflow-hidden rounded-lg px-3 py-2 text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
            isActive
              ? 'bg-brand text-on-brand'
              : 'bg-transparent text-text hover:bg-surface'
          }`
        }
        onClick={onNavigate}
        to={`/${language}${localizedPath ? `/${localizedPath}` : ''}`}
      >
        <span className="relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-current motion-safe:after:transition-transform motion-safe:after:duration-200 motion-safe:after:ease-out motion-safe:group-hover:after:scale-x-100 motion-reduce:after:transition-none">
          {key === 'sandbox' ? t('sandbox.navLabel') : t(`navigation.${key}`)}
        </span>
      </NavLink>
    )
  })
}

function LanguageSwitch({ language, getLanguagePath, onNavigate }) {
  const { t } = useTranslation()

  return (
    <div
      aria-label={t('language.label')}
      className="flex items-center gap-1 text-sm font-semibold"
      role="group"
    >
      <Link
        aria-current={language === 'sk' ? 'page' : undefined}
        className="rounded px-1 py-2 text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={onNavigate}
        to={getLanguagePath('sk')}
      >
        {t('language.slovakShort')}
      </Link>
      <span aria-hidden="true" className="text-muted">
        |
      </span>
      <Link
        aria-current={language === 'en' ? 'page' : undefined}
        className="rounded px-1 py-2 text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={onNavigate}
        to={getLanguagePath('en')}
      >
        {t('language.englishShort')}
      </Link>
    </div>
  )
}

function Header() {
  const { t } = useTranslation()
  const { language } = useParams()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const pagePath = location.pathname.split('/').slice(2).join('/')
  const getLanguagePath = (targetLanguage) => {
    const targetPagePath =
      pagePath === 'skusobna' || pagePath === 'try-it'
        ? targetLanguage === 'sk'
          ? 'skusobna'
          : 'try-it'
        : pagePath

    return `/${targetLanguage}${targetPagePath ? `/${targetPagePath}` : ''}${location.search}${location.hash}`
  }

  function closeMenu() {
    setIsMenuOpen(false)
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      const clickedInsideMenu = menuRef.current?.contains(event.target)
      const clickedMenuButton = menuButtonRef.current?.contains(event.target)

      if (!clickedInsideMenu && !clickedMenuButton) {
        closeMenu()
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeMenu()
        menuButtonRef.current?.focus()
      }
    }

    function handleResize() {
      if (window.matchMedia('(min-width: 768px)').matches) {
        closeMenu()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMenuOpen])

  return (
    <header className="glass-strong sticky top-0 z-30 border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-3 px-4 py-4 md:grid-cols-[1fr_auto_1fr]">
        <Link
          className="inline-flex items-center gap-2 justify-self-start text-lg font-bold tracking-wide text-text sm:text-xl"
          to={`/${language}`}
        >
          <img
            alt=""
            aria-hidden="true"
            className="size-10 rounded-md object-cover"
            height="40"
            src={logo}
            width="40"
          />
          {t('common.companyName')}
        </Link>

        <nav
          aria-label={t('navigation.label')}
          className="hidden items-center justify-center gap-1 md:flex"
        >
          <NavigationLinks language={language} />
        </nav>

        <div className="hidden items-center justify-self-end gap-2 sm:gap-3 md:flex">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <LanguageSwitch
            getLanguagePath={getLanguagePath}
            language={language}
            onNavigate={closeMenu}
          />
        </div>

        <MenuButton
          buttonRef={menuButtonRef}
          isOpen={isMenuOpen}
          menuId={MOBILE_MENU_ID}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        />
      </div>

      <nav
        aria-hidden={!isMenuOpen}
        aria-label={t('navigation.label')}
        className={`glass-strong absolute left-0 top-full z-50 flex max-h-[calc(100dvh-4rem)] w-full flex-col items-center gap-2 overflow-y-auto border-b border-border px-4 py-4 shadow-lg md:hidden motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
          isMenuOpen
            ? 'visible translate-y-0 pointer-events-auto opacity-100'
            : 'invisible -translate-y-2 pointer-events-none opacity-0'
        }`}
        id={MOBILE_MENU_ID}
        inert={!isMenuOpen}
        ref={menuRef}
      >
        <NavigationLinks
          isMobile
          language={language}
          onNavigate={closeMenu}
        />
        <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-4 border-t border-border pt-4">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <LanguageSwitch
            getLanguagePath={getLanguagePath}
            language={language}
          />
        </div>
      </nav>
    </header>
  )
}

export default Header
