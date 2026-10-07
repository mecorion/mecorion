<script setup>
import {videoPath} from "@/video/catalog.js";
import {computed} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiAvatar, UiBadge, UiButton, UiCard, UiDropdownMenu} from "@/components/ui";
import {useVideoWatchLater} from "@/video/watchLater.js";
const watchLater = useVideoWatchLater();

const props = defineProps({video: {type: Object, required: true}});
const viewLabel = computed(() => props.video.views == null ? "Нет просмотров" : `${new Intl.NumberFormat("ru-RU", {notation: "compact", maximumFractionDigits: 1}).format(props.video.views)} просмотров`);
const durationLabel = computed(() => {
  const text = props.video.duration ?? "";
  const hours = Number(text.match(/(\d+)\s*ч/)?.[1] ?? 0);
  const minutes = Number(text.match(/(\d+)\s*мин/)?.[1] ?? 0);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:00` : minutes ? `${minutes}:00` : text;
});
const menuItems = computed(() => [
  {id: "watch-later", label: watchLater.isSaved(props.video) ? "Убрать из «Смотреть позже»" : "Смотреть позже", icon: "star", onSelect: () => watchLater.toggle(props.video)},
  {id: "watch", label: props.video.seasons?.length ? "Выбрать серию" : props.video.state.progress > 0 ? "Продолжить просмотр" : "Смотреть", icon: "play", onSelect: () => navigateTo(videoPath(props.video.id))},
  {id: "details", label: "О публикации", icon: "arrow-up-right-1", onSelect: () => navigateTo(`/space/${props.video.spaceId}/publication/${props.video.id}`)},
]);
</script>

<template>
  <UiCard class="mevideo-media-card" raw unstyled>
    <UiButton unstyled class="mevideo-media-card__preview" :class="`mevideo-media-card__preview--${video.coverTone}`" :aria-label="`${video.state.progress > 0 ? 'Продолжить' : 'Смотреть'}: ${video.title}`" :to="videoPath(video.id)">
      <img v-if="video.coverUrl" class="mevideo-media-card__image" :src="video.coverUrl" alt="" loading="lazy" />
      <span v-else class="mevideo-media-card__visual" aria-hidden="true"><SvgIcon name="sidebar-videos" /></span>
      <span class="mevideo-media-card__play" aria-hidden="true"><SvgIcon name="play" /></span>
      <span class="mevideo-media-card__duration">{{ durationLabel }}</span>
      <UiBadge class="mevideo-media-card__kind">{{ video.state.kind }}</UiBadge>
      <span v-if="video.state.progress > 0" class="mevideo-media-card__timeline" role="progressbar" :aria-valuenow="video.state.progress" :aria-valuemin="0" :aria-valuemax="100" aria-label="Просмотрено"><span :style="{width: `${video.state.progress}%`}"></span></span>
    </UiButton>
    <div class="mevideo-media-card__info">
      <UiAvatar class="mevideo-media-card__avatar" :src="video.authorAvatar" :alt="video.author" :fallback="video.author?.split(' ').map(word => word[0]).slice(0, 2).join('')" size="sm" />
      <div class="mevideo-media-card__copy">
        <h3 class="mevideo-media-card__title"><UiButton unstyled :to="videoPath(video.id)">{{ video.title }}</UiButton></h3>
        <p class="mevideo-media-card__author">{{ video.author }}</p>
        <p class="mevideo-media-card__stats"><span>{{ viewLabel }}</span><span v-if="video.publishedLabel">{{ video.publishedLabel }}</span></p>
      </div>
      <UiDropdownMenu :items="menuItems" align="end" width="min(240px, calc(100vw - 16px))">
        <template #trigger="{toggle, isOpen}"><UiButton class="mevideo-media-card__menu" variant="ghost" size="sm" icon :aria-label="`Действия: ${video.title}`" aria-haspopup="menu" :aria-expanded="isOpen" @click="toggle"><SvgIcon name="ellipsis-vertical" /></UiButton></template>
      </UiDropdownMenu>
    </div>
  </UiCard>
</template>
