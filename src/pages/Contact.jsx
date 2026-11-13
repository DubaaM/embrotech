import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

const endpoint = 'https://formspree.io/f/maeoyeno'

const initialFormValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  consent: false,
  _gotcha: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Contact() {
  const { t } = useTranslation()
  const { language } = useParams()
  const mapAddress = t('contact.info.addressValue')
  const mapUrl = `https://maps.google.com/maps?${new URLSearchParams({
    q: mapAddress,
    output: 'embed',
  })}`
  const [values, setValues] = useState(initialFormValues)
  const [errors, setErrors] = useState({})
  const [submitState, setSubmitState] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  function validateField(field, value) {
    if (field === 'consent') {
      return value ? '' : t('contact.form.errors.consent')
    }

    const trimmedValue = value.trim()

    if (['name', 'email', 'message'].includes(field) && !trimmedValue) {
      return t('contact.form.errors.required')
    }

    if (field === 'email' && trimmedValue && !emailPattern.test(trimmedValue)) {
      return t('contact.form.errors.email')
    }

    if (field === 'message' && trimmedValue.length < 10) {
      return t('contact.form.errors.messageLength')
    }

    return ''
  }

  function validateForm(formValues) {
    return ['name', 'email', 'message', 'consent'].reduce(
      (fieldErrors, field) => {
        const error = validateField(field, formValues[field])
        if (error) {
          fieldErrors[field] = error
        }
        return fieldErrors
      },
      {},
    )
  }

  function handleChange(event) {
    const { checked, name, type, value } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setValues((currentValues) => ({
      ...currentValues,
      [name]: nextValue,
    }))
    setSubmitState('')

    if (Object.hasOwn(errors, name)) {
      const error = validateField(name, nextValue)
      setErrors((currentErrors) => {
        if (!error) {
          const remainingErrors = { ...currentErrors }
          delete remainingErrors[name]
          return remainingErrors
        }
        return { ...currentErrors, [name]: error }
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (values._gotcha) {
      setValues(initialFormValues)
      setErrors({})
      setSubmitState('success')
      return
    }

    const formErrors = validateForm(values)
    setErrors(formErrors)

    const firstInvalidField = Object.keys(formErrors)[0]
    if (firstInvalidField) {
      event.currentTarget
        .querySelector(`[name="${firstInvalidField}"]`)
        ?.focus()
      return
    }

    setIsSubmitting(true)
    setSubmitState('')

    const submission = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      subject: values.subject,
      message: values.message,
      consent: values.consent,
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      })

      if (!response.ok) {
        setSubmitState('error')
        return
      }

      setValues(initialFormValues)
      setErrors({})
      setSubmitState('success')
    } catch {
      setSubmitState('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function fieldProps(name) {
    return {
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
      'aria-invalid': Boolean(errors[name]),
      className: `mt-2 block w-full rounded-lg border bg-bg px-4 py-3 text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        errors[name] ? 'border-brand' : 'border-border'
      }`,
      name,
      onChange: handleChange,
      required: ['name', 'email', 'message'].includes(name),
      value: values[name],
    }
  }

  function renderError(field) {
    return errors[field] ? (
      <p className="mt-1 text-sm text-brand" id={`${field}-error`}>
        {errors[field]}
      </p>
    ) : null
  }

  return (
    <div className="px-4 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
            {t('contact.title')}
          </h1>
          <p className="mt-4 text-lg leading-7 text-muted">
            {t('contact.description')}
          </p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <section
            aria-labelledby="contact-form-title"
            className="glass rounded-2xl border border-border p-6 sm:p-8"
          >
            <h2
              className="text-2xl font-semibold text-text"
              id="contact-form-title"
            >
              {t('contact.form.title')}
            </h2>
            <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] size-px overflow-hidden"
              >
                <input
                  autoComplete="off"
                  name="_gotcha"
                  onChange={handleChange}
                  tabIndex={-1}
                  type="text"
                  value={values._gotcha}
                />
              </div>

              <div>
                <label className="font-medium text-text" htmlFor="contact-name">
                  {t('contact.form.name')}
                </label>
                <input
                  autoComplete="name"
                  id="contact-name"
                  {...fieldProps('name')}
                />
                {renderError('name')}
              </div>

              <div>
                <label className="font-medium text-text" htmlFor="contact-email">
                  {t('contact.form.email')}
                </label>
                <input
                  autoComplete="email"
                  id="contact-email"
                  type="email"
                  {...fieldProps('email')}
                />
                {renderError('email')}
              </div>

              <div>
                <label className="font-medium text-text" htmlFor="contact-phone">
                  {t('contact.form.phone')}
                </label>
                <input
                  autoComplete="tel"
                  id="contact-phone"
                  type="tel"
                  {...fieldProps('phone')}
                />
              </div>

              <div>
                <label
                  className="font-medium text-text"
                  htmlFor="contact-subject"
                >
                  {t('contact.form.subject')}
                </label>
                <input
                  id="contact-subject"
                  {...fieldProps('subject')}
                />
              </div>

              <div>
                <label
                  className="font-medium text-text"
                  htmlFor="contact-message"
                >
                  {t('contact.form.message')}
                </label>
                <textarea
                  id="contact-message"
                  rows="5"
                  {...fieldProps('message')}
                />
                {renderError('message')}
              </div>

              <div>
                <div className="flex items-start gap-3">
                  <input
                    aria-describedby={
                      errors.consent ? 'consent-error' : undefined
                    }
                    aria-invalid={Boolean(errors.consent)}
                    checked={values.consent}
                    className="mt-1 size-4 rounded border-border accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    id="contact-consent"
                    name="consent"
                    onChange={handleChange}
                    required
                    type="checkbox"
                  />
                  <label className="text-sm leading-6 text-muted" htmlFor="contact-consent">
                    {t('contact.form.consentBefore')}{' '}
                    <Link
                      className="font-medium text-brand underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      to={`/${language}/privacy`}
                    >
                      {t('contact.form.privacyLink')}
                    </Link>
                    .
                  </label>
                </div>
                {renderError('consent')}
              </div>

              <button
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-lg motion-safe:active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {t(
                  isSubmitting
                    ? 'contact.form.submitting'
                    : 'contact.form.submit',
                )}
              </button>

              <p aria-live="polite" className="text-sm text-text" role="status">
                {submitState ? t(`contact.form.${submitState}Message`) : ''}
              </p>
            </form>
          </section>

          <section
            aria-labelledby="contact-info-title"
            className="glass rounded-2xl border border-border p-6 sm:p-8"
          >
            <h2
              className="text-2xl font-semibold text-text"
              id="contact-info-title"
            >
              {t('contact.info.title')}
            </h2>
            <dl className="mt-6 space-y-6">
              {['address', 'phone', 'email', 'hours'].map((item) => (
                <div key={item}>
                  <dt className="font-medium text-text">
                    {t(`contact.info.${item}Label`)}
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-muted">
                    {t(`contact.info.${item}Value`)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section
          aria-labelledby="contact-map-title"
          className="mt-12"
        >
          <h2
            className="text-center text-2xl font-semibold text-text"
            id="contact-map-title"
          >
            {t('contact.map.title')}
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
            <iframe
              allowFullScreen
              className="block h-72 w-full border-0 sm:h-96"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={mapUrl}
              title={t('contact.map.iframeTitle')}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default Contact
