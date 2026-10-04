<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {UiButton} from "@/components/ui";
import SvgIcon from "@/components/SvgIcon.vue";
import VideoMediaCard from "./VideoMediaCard.vue";

const props = defineProps({row: {type: Object, required: true}});
const emit = defineEmits(["watch", "browse"]);
const viewport = ref(null);
const width = ref(0);
const gap = ref(20);
const position = ref(0);
const columns = computed(() => width.value >= 1080 ? 4 : width.value >= 780 ? 3 : width.value >= 520 ? 2 : 1);
const lastPosition = computed(() => Math.max(0, props.row.items.length - columns.value));
const trackStyle = computed(() => {
  const cardWidth = Math.max(0, (width.value - gap.value * (columns.value - 1)) / columns.value);
  return {"--video-card-width": `${cardWidth}px`, "--video-shelf-offset": `${-position.value * (cardWidth + gap.value)}px`};
});
let observer;
let swipeStart;
let suppressClick = false;
let clickTimer;
function move(delta) { position.value = Math.max(0, Math.min(lastPosition.value, position.value + delta)); }
function startSwipe(event) { swipeStart = {x: event.touches[0].clientX, y: event.touches[0].clientY}; }
function endSwipe(event) {
  if (!swipeStart) return;
  const dx = event.changedTouches[0].clientX - swipeStart.x;
  const dy = event.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  move(dx < 0 ? 1 : -1);
  suppressClick = true;
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { suppressClick = false; }, 450);
}
function preventSwipeClick(event) {
  if (!suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressClick = false;
}
watch(lastPosition, value => { position.value = Math.min(position.value, value); });
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width;
    gap.value = parseFloat(getComputedStyle(viewport.value.firstElementChild).columnGap) || 0;
  });
  observer.observe(viewport.value);
});
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(clickTimer); });
</script>

<template>
  <section class="mevideo-shelf" :aria-labelledby="`video-shelf-title-${row.id}`">
    <div class="mevideo-shelf__heading">
      <h2 :id="`video-shelf-title-${row.id}`">{{ row.title }}</h2>
      <div class="mevideo-shelf__actions">
        <div v-if="lastPosition > 0" class="mevideo-shelf__controls" role="group" :aria-label="`Листать: ${row.title}`">
          <UiButton class="mevideo-shelf__previous" variant="ghost" icon :disabled="position === 0" aria-label="Предыдущие видео" :aria-controls="`video-shelf-${row.id}`" @click="move(-1)"><SvgIcon name="chevron-right" /></UiButton>
          <span class="mevideo-shelf__position">{{ position + 1 }} / {{ lastPosition + 1 }}</span>
          <UiButton variant="ghost" icon :disabled="position === lastPosition" aria-label="Следующие видео" :aria-controls="`video-shelf-${row.id}`" @click="move(1)"><SvgIcon name="chevron-right" /></UiButton>
        </div>
        <UiButton variant="ghost" size="sm" @click="emit('browse', row)">{{ row.action }}</UiButton>
      </div>
    </div>
    <div :id="`video-shelf-${row.id}`" ref="viewport" class="mevideo-shelf__viewport" aria-live="polite" @touchstart.passive="startSwipe" @touchend.passive="endSwipe" @touchcancel="swipeStart = null" @click.capture="preventSwipeClick">
      <div class="mevideo-shelf__track" :style="trackStyle">
        <VideoMediaCard v-for="(video, index) in row.items" :key="video.id" :video="video" :inert="index < position || index >= position + columns" :aria-hidden="index < position || index >= position + columns" @watch="emit('watch', $event)" />
      </div>
    </div>
  </section>
</template>
