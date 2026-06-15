import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import https from 'node:https'
import tls from 'node:tls'

// Local machines with TLS-intercepting antivirus (e.g. Avast Web/Mail Shield)
// re-sign HTTPS traffic with their own root CA, which Node doesn't trust by
// default. If that CA has been exported (see project memory), trust it in
// addition to Node's normal root store for the proxies below.
const EXTRA_CA_PATH = 'C:\\Users\\Dlle Latitude E5470\\.certs\\avast-root.pem'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const extraCaAgent = fs.existsSync(EXTRA_CA_PATH)
    ? new https.Agent({ ca: [...tls.rootCertificates, fs.readFileSync(EXTRA_CA_PATH, 'utf-8')] })
    : undefined

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Routes Groq API calls through the Vite dev server so the browser
        // never has to resolve api.groq.com directly (avoids ERR_NAME_NOT_RESOLVED
        // on networks that block that host for client-side requests). Mirrors
        // the api/groq.js Vercel function: src/lib/groq.js POSTs to the bare
        // /api/groq path in both dev and prod.
        '/api/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          agent: extraCaAgent,
          rewrite: () => '/openai/v1/chat/completions',
          headers: {
            Authorization: `Bearer ${env.VITE_GROQ_API_KEY}`,
          },
        },
        // Same deal for EmailJS — the browser can't resolve api.emailjs.com
        // directly on this network, so route it through the dev server too.
        '/api/emailjs': {
          target: 'https://api.emailjs.com',
          changeOrigin: true,
          agent: extraCaAgent,
          rewrite: (path) => path.replace(/^\/api\/emailjs/, ''),
        },
      },
    },
  }
})
