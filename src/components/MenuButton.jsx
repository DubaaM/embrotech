import { useTranslation } from 'react-i18next'

function MenuButton({ isOpen, menuId, onClick, buttonRef }) {
  const { t } = useTranslation()

  return (
    <button
      aria-controls={menuId}
      aria-expanded={isOpen}
      aria-label={t(isOpen ? 'navigation.closeMenu' : 'navigation.openMenu')}
      className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:hidden"
      onClick={onClick}
      ref={buttonRef}
      type="button"
    >
      <span aria-hidden="true" className="flex flex-col gap-1.5">
        <span
          className={`h-0.5 w-5 bg-current motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
            isOpen ? 'translate-y-2 rotate-45' : ''
          }`}
        />
        <span
          className={`h-0.5 w-5 bg-current motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`h-0.5 w-5 bg-current motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none ${
            isOpen ? '-translate-y-2 -rotate-45' : ''
          }`}
        />
      </span>
    </button>
  )
}

export default MenuButton
