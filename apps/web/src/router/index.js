import {createRouter, createWebHistory} from "vue-router";
import VideoPage from "../pages/VideoPage.vue";
import HomePage from "@/pages/HomePage.vue";
import PlayerPage from "@/pages/PlayerPage.vue";
import UiKitView from "@/pages/UiKitView.vue";
import DashboardView from "@/pages/DashboardView.vue";
import LandingView from "@/pages/LandingView.vue";
import SignInView from "@/pages/SignInView.vue";
import SignUpView from "@/pages/SignUpView.vue";
import ProfileView from "@/pages/ProfileView.vue";
import SpacesView from "@/pages/SpacesView.vue";
import {fetchCurrentUser, isAuthenticated} from "@/auth/session.js";

// Music содержит собственный layout и аудиодвижок, поэтому загружается
// отдельным chunk только при переходе пользователя в сервис.
const MusicView = () => import("@/pages/MusicView.vue");

const routes = [
    {path: "/", component: LandingView, meta: {standalone: true}},
    {path: "/sign-in", component: SignInView, meta: {standalone: true, guestOnly: true}},
    {path: "/sign-up", component: SignUpView, meta: {standalone: true, guestOnly: true}},
    {path: "/dashboard", component: DashboardView, meta: {workspace: true, requiresAuth: true}},
    {path: "/spaces", component: SpacesView, meta: {workspace: true, requiresAuth: true}},
    {path: "/profile", component: ProfileView, meta: {workspace: true, requiresAuth: true}},
    {path: "/music", component: MusicView, meta: {workspace: true, requiresAuth: true}},
    {path: "/home", component: HomePage, meta: {needsContent: true, requiresAuth: true}},
    {path: "/videos/:category", component: VideoPage, props: true, meta: {needsContent: true, requiresAuth: true}},
    {path: "/watch", component: PlayerPage, meta: {needsContent: true, requiresAuth: true}},
    {path: "/watch/:videoUrl", component: PlayerPage, props: true, meta: {needsContent: true, requiresAuth: true}},
    {path: "/ui-kit", component: UiKitView},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to) => {
    // let authenticated = isAuthenticated();

    // Локальная сессия даёт быстрый optimistic-check, но перед входом в
    // защищённые зоны подтверждаем токен на API. Так frontend не доверяет
    // устаревшему localStorage после logout или истечения server-side session.
    // if ((to.meta.requiresAuth || to.meta.guestOnly) && authenticated) {
    //     authenticated = Boolean(await fetchCurrentUser());
    // }

    // if (to.meta.requiresAuth && !authenticated) {
    //     return {path: "/sign-in", query: {redirect: to.fullPath}};
    // }

    // if (to.meta.guestOnly && authenticated) {
    //     return "/dashboard";
    // }

    return true;
});

export default router;
