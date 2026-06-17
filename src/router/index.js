import {createRouter, createWebHistory} from "vue-router";
import VideoPage from "../pages/VideoPage.vue";
import HomePage from "@/pages/HomePage.vue";
import PlayerPage from "@/pages/PlayerPage.vue";

const routes = [
    {path: "/home", alias: '/', component: HomePage},
    {path: "/videos/:category", component: VideoPage, props: true},
    {path: "/watch", component: PlayerPage},
    {path: "/watch/:videoUrl", component: PlayerPage, props: true},
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
