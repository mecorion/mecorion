import {createRouter, createWebHistory} from "vue-router";
import VideoPage from "../pages/VideoPage.vue";
import HomePage from "@/pages/HomePage.vue";
import PlayerPage from "@/pages/PlayerPage.vue";
import UiKitView from "@/pages/UiKitView.vue";
import DashboardView from "@/pages/DashboardView.vue";

// Music содержит собственный layout и аудиодвижок, поэтому загружается
// отдельным chunk только при переходе пользователя в сервис.
const MusicView = () => import("@/pages/MusicView.vue");

const routes = [
    {path: "/", component: DashboardView, meta: {workspace: true}},
    {path: "/dashboard", component: DashboardView, meta: {workspace: true}},
    {path: "/music", component: MusicView, meta: {workspace: true}},
    {path: "/home", component: HomePage, meta: {needsContent: true}},
    {path: "/videos/:category", component: VideoPage, props: true, meta: {needsContent: true}},
    {path: "/watch", component: PlayerPage, meta: {needsContent: true}},
    {path: "/watch/:videoUrl", component: PlayerPage, props: true, meta: {needsContent: true}},
    {path: "/ui-kit", component: UiKitView},
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
