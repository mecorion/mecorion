<script setup>
import {computed} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {UiBadge, UiButton, UiCard, UiProgress} from "@/components/ui";
import {getSpaceBreadcrumb} from "@/spaces/spaces.mock.js";

const props = defineProps({video: {type: Object, required: true}});
const emit = defineEmits(["watch"]);
const seasonLabel = computed(() => {
  const count = props.video.seasons?.length ?? 0;
  return `${count} ${count === 1 ? 'сезон' : count < 5 ? 'сезона' : 'сезонов'}`;
});
const actionLabel = computed(() => props.video.seasons?.length ? "Выбрать серию" : props.video.state.progress > 0 ? "Продолжить" : "Смотреть");
</script>

<template>
  <UiCard class="mevideo-media-card" size="sm">
    <template #media>
      <UiButton unstyled class="mevideo-media-card__preview" :class="`mevideo-media-card__preview--${video.coverTone}`" :aria-label="`Смотреть ${video.title}`" @click="emit('watch', video.id)">
        <span class="mevideo-media-card__visual" aria-hidden="true"><SvgIcon name="sidebar-videos" /></span>
        <span class="mevideo-media-card__play" aria-hidden="true"><SvgIcon name="play" /></span>
        <span class="mevideo-media-card__duration">{{ video.duration }}</span>
      </UiButton>
    </template>
    <div class="mevideo-media-card__meta">
      <UiBadge>{{ video.state.kind }}</UiBadge>
      <span>{{ video.state.quality }}</span>
      <span v-if="video.seasons?.length">{{ seasonLabel }}</span>
    </div>
    <h3 class="mevideo-media-card__title">
      <UiButton unstyled @click="emit('watch', video.id)">{{ video.title }}</UiButton>
    </h3>
    <p class="mevideo-media-card__description">{{ video.subtitle }}</p>
    <div class="mevideo-media-card__progress">
      <UiProgress :value="video.state.progress" size="sm" :label="video.state.progress > 0 ? 'Просмотрено' : 'Ещё не смотрели'" :show-value="video.state.progress > 0" />
    </div>
    <template #footer>
      <UiButton variant="outline" size="sm" class="mevideo-media-card__watch" @click="emit('watch', video.id)"><SvgIcon name="play" />{{ actionLabel }}</UiButton>
      <UiButton variant="ghost" size="sm" icon :to="`/space/${video.spaceId}/publication/${video.id}`" :aria-label="`О публикации: ${video.title}`" :title="getSpaceBreadcrumb(video) || 'О публикации'"><SvgIcon name="arrow-up-right-1" /></UiButton>
    </template>
  </UiCard>
</template>
