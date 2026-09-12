import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import svgLoader from 'vite-svg-loader'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const version = process.env.UI_STYLE_VERSION || env.UI_STYLE_VERSION || 'v1';
    if (!['v1', 'v2'].includes(version)) {
        throw new Error('UI_STYLE_VERSION must be v1 or v2');
    }
    return {
    plugins: [
        vue(),
        svgLoader(),
    ],
    resolve: {
        alias: {
            '@mecorion-ui': path.resolve(__dirname, version === 'v1' ? 'src/styles/main.scss' : 'src/styles-v2/main.scss'),
            '@': path.resolve(__dirname, 'src'),
        }
    }
    };
})
