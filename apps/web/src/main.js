import { createApp } from 'vue'
import router from "./router"
import App from './App.vue'
import { createPinia } from 'pinia'
import 'virtual:svg-icons-register'

// инициализация Видеоплеера Plyr
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'
import {initializeUiVersion} from '@/styles/uiVersion.js'

// Vendor defaults load first; the active Mecorion library owns theme tokens.
await initializeUiVersion()

// инициализация Pinia
const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(VuePlyr)

app.mount('#app')
