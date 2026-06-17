import {createRouter, createWebHistory} from "vue-router";
import VideoPage from "../pages/VideoPage.vue";
import HomePage from "@/pages/HomePage.vue";
import PlayerPage from "@/pages/PlayerPage.vue";
import UiKitView from "@/pages/UiKitView.vue";

const routes = [
    {path: "/home", alias: '/', component: HomePage},
    {path: "/videos/:category", component: VideoPage, props: true},
    {path: "/watch", component: PlayerPage},
    {path: "/watch/:videoUrl", component: PlayerPage, props: true},
    {path: "/ui-kit", component: UiKitView},
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
