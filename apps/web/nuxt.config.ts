import {fileURLToPath} from 'node:url'
import {createSvgIconsPlugin} from 'vite-plugin-svg-icons'

function svgIconsPlugin() {
  const plugin = createSvgIconsPlugin({
    iconDirs: [fileURLToPath(new URL('./src/assets/icons', import.meta.url))],
    symbolId: 'icon-[dir]-[name]',
  })
  const resolveConfig = plugin.configResolved.bind(plugin)
  // The plugin's build loader also supports Vite's current dev import analysis.
  plugin.configResolved = (config) => resolveConfig({...config, command: 'build'})
  return plugin
}

export default defineNuxtConfig({
  compatibilityDate: '2026-09-14',
  srcDir: 'src/',
  buildDir: '.nuxt',
  // Local media, player state and sessions currently live in browser APIs.
  ssr: false,
  devtools: {enabled: false},
  modules: ['@pinia/nuxt'],
  css: ['plyr/dist/plyr.css', '~/styles/fonts.scss', '~/styles/main.scss'],
  app: {
    head: {
      title: 'Mecorion',
      htmlAttrs: {lang: 'ru'},
    },
    pageTransition: false,
    layoutTransition: false,
  },
  runtimeConfig: {
    public: {
      // Browser requests stay on the current origin. In development Nuxt
      // proxies /api to Fastify; production must route /api the same way.
      mecorionApiUrl: '/',
    },
  },
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://127.0.0.1:4000/api',
        changeOrigin: true,
      },
    },
  },
  postcss: {
    plugins: {'@tailwindcss/postcss': {}, autoprefixer: {}},
  },
  vite: {
    plugins: [svgIconsPlugin()],
  },
})
