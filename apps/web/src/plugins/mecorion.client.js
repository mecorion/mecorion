import VuePlyr from 'vue-plyr';
import 'virtual:svg-icons-register';
import {configureAuthApi} from '~/auth/session.js';
import {useAppStore} from '~/stores/app.js';
import {initializeUiVersion} from '~/styles/uiVersion.js';

export default defineNuxtPlugin({
  name: 'mecorion',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    configureAuthApi(useRuntimeConfig().public.mecorionApiUrl);
    nuxtApp.vueApp.use(VuePlyr);
    const app = useAppStore(nuxtApp.$pinia);
    await initializeUiVersion();
    await app.initializeTheme();
  },
});
