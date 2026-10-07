<script setup>
import VideoServiceView from "@/components/video/VideoServiceView.vue";
import {videoCatalog} from "@/video/catalog.js";

definePageMeta({
  workspace: true,
  requiresAuth: true,
  validate: (route) => {
    const video = videoCatalog.find(item => item.id === route.params.id);
    if (!video) return false;
    if (route.query.season === undefined && route.query.episode === undefined) return true;
    const season = video.seasons?.find(item => String(item.number) === (route.query.season ?? "1"));
    return Boolean(season && (route.query.episode === undefined || season.episodes.some(item => item.id === route.query.episode)));
  },
});
</script>

<template><VideoServiceView /></template>
