import { createApp } from 'vue'
import './styles/main.scss'
import router from "./router"
import App from './App.vue'
import { createPinia } from 'pinia'

// инициализация Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// инициализация Видеоплеера Plyr
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'

// инициализация Pinia
const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(ElementPlus)
app.use(pinia)
app.use(VuePlyr)

app.mount('#app')