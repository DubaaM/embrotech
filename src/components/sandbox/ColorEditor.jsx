import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import threadColors, { ALLOW_CUSTOM_COLORS } from '../../data/threadColors.js'

function getThreadColorName(hex, language) {
  return threadColors.find((color) => color.hex.toLowerCase() === hex?.toLowerCase())
    ?.name[language] ?? ''
}

function ColorEditor({
  colors,
  hasMoreColors,
  hasUneditableColors,
  onChange,
  onReset,
  replacements,
}) {
  const { t, i18n } = useTranslation()
  const [activeColor, setActiveColor] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const activeSwatchRef = useRef(null)
  const language = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
  const locale = language === 'sk' ? 'sk' : 'en'

  if (!colors.length && !hasMoreColors && !hasUneditableColors) {
    return null
  }

  function closePalette(event) {
    if (event.key === 'Escape' && activeColor) {
      event.preventDefault()
      setActiveColor(null)
      activeSwatchRef.current?.focus()
    }
  }

  function chooseColor(sourceColor, replacement) {
    onChange(sourceColor, replacement)
    setActiveColor(null)
    activeSwatchRef.current?.focus()
  }

  const hasReplacements = Object.keys(replacements).length > 0

  return (
    <section
      aria-labelledby="sandbox-logo-colors-title"
      className="glass mt-6 rounded-xl p-4"
      onKeyDown={closePalette}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          aria-controls="sandbox-color-editor-content"
          aria-expanded={isExpanded}
          className="flex min-h-11 items-center gap-2 rounded-lg text-left font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => {
            if (isExpanded) {
              setActiveColor(null)
            }
            setIsExpanded(!isExpanded)
          }}
          type="button"
        >
          <span id="sandbox-logo-colors-title">
            {t('sandbox.colorEditor.title')}
          </span>
          <span
            aria-hidden="true"
            className={`transition-transform duration-200 motion-reduce:transition-none ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            ⌄
          </span>
        </button>
        <button
          className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasReplacements}
          onClick={onReset}
          type="button"
        >
          {t('sandbox.colorEditor.reset')}
        </button>
      </div>

      <div hidden={!isExpanded} id="sandbox-color-editor-content">
        {colors.length ? (
          <ul className="mt-3 space-y-3">
            {colors.map(({ hex }) => {
              const replacement = replacements[hex] ?? hex
              const replacementName = replacements[hex]
                ? getThreadColorName(replacement, locale)
                : ''
              const isOpen = activeColor === hex

              return (
                <li className="rounded-lg border border-border p-3" key={hex}>
                  <button
                    aria-expanded={isOpen}
                    aria-label={
                      replacementName
                        ? t('sandbox.colorEditor.changeColorNamed', {
                            color: hex.toUpperCase(),
                            name: replacementName,
                          })
                        : t('sandbox.colorEditor.changeColor', {
                            color: hex.toUpperCase(),
                          })
                    }
                    className="flex min-h-11 w-full flex-wrap items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    onClick={(event) => {
                      activeSwatchRef.current = event.currentTarget
                      setActiveColor(isOpen ? null : hex)
                    }}
                    ref={isOpen ? activeSwatchRef : undefined}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="size-6 rounded-full border border-border"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-sm text-text">{hex.toUpperCase()}</span>
                    <span aria-hidden="true" className="text-muted">
                      →
                    </span>
                    <span
                      aria-hidden="true"
                      className="size-6 rounded-full border border-border"
                      style={{ backgroundColor: replacement }}
                    />
                    <span className="text-sm font-medium text-text">
                      {replacementName || replacement.toUpperCase()}
                    </span>
                  </button>

                  {isOpen ? (
                    <div
                      aria-label={t('sandbox.colorEditor.palette')}
                      className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                      role="group"
                    >
                      {threadColors.map((threadColor) => {
                        const name = threadColor.name[locale]
                        return (
                          <button
                            aria-pressed={
                              replacement.toLowerCase() === threadColor.hex.toLowerCase()
                            }
                            className="flex min-h-12 items-center gap-2 rounded-lg border border-border px-2 py-2 text-left text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            key={threadColor.id}
                            onClick={() => chooseColor(hex, threadColor.hex)}
                            type="button"
                          >
                            <span
                              aria-hidden="true"
                              className="size-6 shrink-0 rounded-full border border-border"
                              style={{ backgroundColor: threadColor.hex }}
                            />
                            <span className="min-w-0">
                              <span className="block truncate">{name}</span>
                              <span className="block text-xs text-muted">
                                {threadColor.hex.toUpperCase()}
                              </span>
                            </span>
                          </button>
                        )
                      })}

                      {ALLOW_CUSTOM_COLORS ? (
                        <label className="flex min-h-12 items-center gap-2 rounded-lg border border-border px-2 py-2 text-sm font-medium text-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
                          <span>{t('sandbox.colorEditor.custom')}</span>
                          <input
                            aria-label={t('sandbox.colorEditor.custom')}
                            className="size-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                            onChange={(event) =>
                              onChange(hex, event.target.value.toLowerCase())
                            }
                            type="color"
                            value={replacement}
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">
            {t('sandbox.colorEditor.noEditableColors')}
          </p>
        )}

        {hasUneditableColors ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            {t('sandbox.colorEditor.uneditableNote')}
          </p>
        ) : null}
        {hasMoreColors ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            {t('sandbox.colorEditor.limitNote')}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default ColorEditor
