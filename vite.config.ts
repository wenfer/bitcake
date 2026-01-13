import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend =
    (env.VITE_TORRENT_BACKEND || mode || 'transmission').toLowerCase()
  const isQbittorrent = backend === 'qbittorrent'

  console.log('🚀 Vite Config:')
  console.log('  Mode:', mode)
  console.log('  Backend:', backend)
  console.log('  API Base:', env.VITE_TORRENT_API_BASE || (isQbittorrent ? '/api/v2' : '/transmission/rpc'))

  // 配置开发代理
  const proxy: Record<string, any> = {}
  if (isQbittorrent) {
    const target = env.VITE_PROXY_QB_URL || 'http://localhost:8080'
    proxy['/api/v2'] = {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path
    }
    console.log('  Proxy /api/v2 →', target)
  } else {
    const target = env.VITE_PROXY_TRANSMISSION_URL || 'http://localhost:9091'
    proxy['/transmission'] = {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path
    }
    console.log('  Proxy /transmission →', target)
  }

  return {
    base: './',
    plugins: [
      vue(),
      {
        name: 'bitcake-favicon',
        enforce: 'pre',
        transformIndexHtml(html: string) {
          const iconPath = isQbittorrent ? 'icons/qbittorrent.svg' : 'icons/Transmission.png'
          const typeAttr = isQbittorrent ? 'image/svg+xml' : 'image/png'
          const linkTag = `<link rel="icon" type="${typeAttr}" href="${iconPath}" />`
          const hasFavicon = /<link\s+rel=["']icon["'][^>]*>/i.test(html)
          if (hasFavicon) {
            return html.replace(/<link\s+rel=["']icon["'][^>]*>/i, linkTag)
          }
          return html.replace('</head>', `  ${linkTag}\n  </head>`)
        }
      }
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __TORRENT_BACKEND__: JSON.stringify(backend),
    },
    build: {
      outDir: isQbittorrent ? `dist-${backend}/public` : `dist-${backend}`,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('element-plus') || id.includes('@element-plus/icons-vue')) {
              return 'element-plus'
            }
            if (id.includes('echarts') || id.includes('vue-echarts')) {
              return 'echarts'
            }
          },
        },
      },
    },
    server: {
      port: 3003,
      proxy,
    },
  }
})
