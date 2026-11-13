import Footer from './Footer'
import Header from './Header'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col text-text motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none">
      <Header />
      <main className="page-content flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
