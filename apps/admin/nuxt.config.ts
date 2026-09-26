import {fileURLToPath} from "node:url";
import {createSvgIconsPlugin} from "vite-plugin-svg-icons";

const webRoot = fileURLToPath(new URL("../web", import.meta.url));

function svgIconsPlugin() {
  const plugin = createSvgIconsPlugin({
    iconDirs: [fileURLToPath(new URL("../web/src/assets/icons", import.meta.url))],
    symbolId: "icon-[dir]-[name]",
  });
  const resolveConfig = plugin.configResolved.bind(plugin);
  plugin.configResolved = (config) => resolveConfig({...config, command: "build"});
  return plugin;
}

export default defineNuxtConfig({
  compatibilityDate: "2026-09-14",
  srcDir: "src/",
  buildDir: ".nuxt",
  // The admin panel has no public SEO pages. Client rendering keeps the auth
  // token out of server payloads and produces small route-specific chunks.
  ssr: false,
  devtools: {enabled: false},
  css: ["~/styles/admin.scss"],
  app: {
    baseURL: "/admin/",
    head: {
      title: "Mecorion Admin",
      htmlAttrs: {lang: "ru"},
      meta: [
        {name: "robots", content: "noindex,nofollow"},
        {name: "color-scheme", content: "light dark"},
      ],
    },
    pageTransition: false,
    layoutTransition: false,
  },
  runtimeConfig: {
    public: {
      mecorionApiUrl: "http://127.0.0.1:4000",
    },
  },
  alias: {
    "@mecorion-ui": `${webRoot}/src/components/ui`,
  },
  vite: {
    plugins: [svgIconsPlugin()],
    server: {
      fs: {allow: [webRoot]},
    },
    build: {
      cssCodeSplit: true,
      reportCompressedSize: true,
    },
  },
});
