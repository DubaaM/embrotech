import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const location = useLocation()
  const indicatorRef = useRef(null)

  useLayoutEffect(() => {
    const indicator = indicatorRef.current
    const nav = indicator?.parentElement

    if (!nav || !indicator) {
      return undefined
    }

    const updateIndicator = () => {
      const activeLink = nav.querySelector('[aria-current="page"]')

      if (!activeLink) {
        indicator.style.opacity = '0'
        return
      }

      const navBounds = nav.getBoundingClientRect()
      const linkBounds = activeLink.getBoundingClientRect()

      indicator.style.width = `${linkBounds.width}px`
      indicator.style.height = `${linkBounds.height}px`
      indicator.style.transform = `translate3d(${linkBounds.left - navBounds.left}px, ${linkBounds.top - navBounds.top}px, 0)`
      indicator.style.opacity = '1'
    }

    updateIndicator()

    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(nav)
    window.addEventListener('resize', updateIndicator)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [language, location.pathname])

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-0 rounded-lg bg-brand opacity-0 transition-[transform,width,height,opacity] duration-300 ease-out motion-reduce:transition-none"
        ref={indicatorRef}
      />
      {navigationItems.map(({ key, path }) => {
        const localizedPath = typeof path === 'string' ? path : path[language]

        return (
          <NavLink
            end
            key={key}
            className={({ isActive }) =>
              `group relative z-10 inline-flex ${
                isMobile ? 'min-h-12 w-full' : 'min-h-10'
              } items-center justify-center overflow-hidden rounded-lg bg-transparent px-3 py-2 text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                isActive ? 'text-on-brand' : 'text-text hover:bg-surface'
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
      })}
    </>
  )
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
    <header className="site-header glass-strong sticky top-3 z-30 mx-3 mt-3 rounded-2xl border border-border shadow-md">
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
          className="relative hidden items-center justify-center gap-1 md:flex"
        >
          <NavigationLinks language={language} />
        </nav>

        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <div className="hidden items-center gap-2 md:flex sm:gap-3">
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
      </div>

      <nav
        aria-hidden={!isMenuOpen}
        aria-label={t('navigation.label')}
        className={`glass-strong absolute left-0 top-full z-50 flex max-h-[calc(100dvh-4rem)] w-full flex-col items-center gap-2 overflow-y-auto rounded-2xl border border-border px-4 py-4 shadow-lg md:hidden motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
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
