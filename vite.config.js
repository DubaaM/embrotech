import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function serveAdminEntry(request, response, next) {
  const requestUrl = new URL(request.url || '/', 'http://localhost')

  if (requestUrl.pathname === '/admin') {
    response.statusCode = 302
    response.setHeader('Location', `/admin/${requestUrl.search}`)
    response.setHeader('Cache-Control', 'no-store')
    response.end()
    return
  }

  if (requestUrl.pathname === '/admin/') {
    request.url = `/admin/index.html${requestUrl.search}`
    response.setHeader('Cache-Control', 'no-store')
  }

  next()
}

function adminEntryPlugin() {
  return {
    name: 'admin-entry',
    configureServer(server) {
      server.middlewares.use(serveAdminEntry)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveAdminEntry)
    },
  }
}

export default defineConfig({
  plugins: [adminEntryPlugin(), react(), tailwindcss()],
})
