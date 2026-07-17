import {defineStore} from "pinia";
import {getTheme, setTheme} from "@/utils/cookies/JsCookies.js";
import {ElMessage} from "element-plus";


export const useAppStore = defineStore('app', {
    state: () => ({
        mode: 'dark',
        themeIcon: 'moon',
    }),
    actions: {
        async initializeTheme() {
            const savedTheme = await getTheme(); // может быть 'light', 'dark' или null/undefined
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            let initialMode;
            if (savedTheme === 'light' || savedTheme === 'dark') {
                initialMode = savedTheme;
            } else {
                initialMode = systemPrefersDark ? 'dark' : 'light';
            }

            this.mode = initialMode;
            this.themeIcon = initialMode === 'dark' ? 'moon' : 'sun';

            // Применяем к <html>
            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            html.classList.add(initialMode);
        },

        async toggleTheme() {
            // Переключаем на противоположную от ТЕКУЩЕГО состояния в сторе
            const newMode = this.mode === 'dark' ? 'light' : 'dark';

            this.mode = newMode;
            this.themeIcon = newMode === 'dark' ? 'moon' : 'sun';

            // Обновляем DOM
            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            html.classList.add(newMode);

            // Сохраняем в cookies
            await setTheme(newMode);
        },

        async methodLogout() {
            try {
                ElMessage({
                    message: 'Вы успешно вышли из аккаунта!',
                    type: 'success'
                })
            } catch (e) {
                console.error('Не удалось выйти из аккаунта')
            }
        }
    }
})
