import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import {createSvgIconsPlugin} from 'vite-plugin-svg-icons'

function createVite7SvgIconsPlugin(options) {
    const plugin = createSvgIconsPlugin(options)
    const resolveConfig = plugin.configResolved.bind(plugin)

    // vite-plugin-svg-icons 2.0.1 returns null from load() in serve mode and
    // relies on middleware behavior that Vite 7 import-analysis no longer uses.
    // Its build loader generates the same virtual module and works in both modes.
    plugin.configResolved = (config) => resolveConfig({...config, command: 'build'})

    return plugin
}

export default defineConfig({
    plugins: [
        vue(),
        createVite7SvgIconsPlugin({
            iconDirs: [path.resolve(__dirname, 'src/assets/icons')],
            symbolId: 'icon-[dir]-[name]',
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        }
    }
})
