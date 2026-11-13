import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import i18n from './i18n'
import Layout from './components/Layout'
import AboutPage from './pages/AboutPage'
import Contact from './pages/Contact'
import Examples from './pages/Examples'
import Home from './pages/Home'
import NewsPage from './pages/NewsPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPage from './pages/PrivacyPage'
import ProductionPage from './pages/ProductionPage'
import Sandbox from './pages/Sandbox'

function LocaleGate() {
  const { language } = useParams()
  const isSupportedLanguage = language === 'sk' || language === 'en'

  useEffect(() => {
    if (isSupportedLanguage) {
      i18n.changeLanguage(language)
      document.documentElement.lang = language
    }
  }, [isSupportedLanguage, language])

  if (!isSupportedLanguage) {
    return <Navigate to="/sk" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sk" replace />} />
        <Route path="/:language" element={<LocaleGate />}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="examples" element={<Examples />} />
            <Route path="skusobna" element={<Sandbox />} />
            <Route path="try-it" element={<Sandbox />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/sk" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
