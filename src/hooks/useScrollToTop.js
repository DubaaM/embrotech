import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

function useScrollToTop() {
  const { pathname, hash } = useLocation()
  const path = pathname.split('/').slice(2).filter(Boolean).join('/')
  const page = path === 'skusobna' ? 'try-it' : path
  const previousPage = useRef(page)

  useLayoutEffect(() => {
    if (previousPage.current !== page) {
      previousPage.current = page
      if (!hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }
  }, [page, hash])
}

export default useScrollToTop
