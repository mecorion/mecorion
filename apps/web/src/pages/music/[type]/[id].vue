<script setup>
definePageMeta({workspace: true, requiresAuth: true});

import {computed} from "vue";
import {useRoute} from "#app";
import SvgIcon from "@/components/SvgIcon.vue";
import MusicPlayerBar from "@/components/music/MusicPlayerBar.vue";
import MusicPlayerMode from "@/components/music/MusicPlayerMode.vue";
import MusicQueuePanel from "@/components/music/MusicQueuePanel.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import {musicPlaylists} from "@/music/catalog.js";
import {findMusicRelease, getRelatedReleases} from "@/music/releases.js";
import {useContextNavigation} from "@/navigation/contextNavigation.js";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";

const route = useRoute();
const player = useMusicPlayerStore();
const release = computed(() => findMusicRelease(String(route.params.type), String(route.params.id)));
const related = computed(() => release.value ? getRelatedReleases(release.value.id) : []);
const playableIds = computed(() => release.value?.tracks.map((track) => track.id) ?? []);
const isLiked = computed(() => release.value?.tracks.every((track) => player.likedTrackIds.includes(track.id)) ?? false);
const releaseCountLabel = computed(() => {
  const count = release.value?.tracks.length ?? 0;
  const forms = release.value?.kind === "podcast" ? ["эпизод", "эпизода", "эпизодов"] : ["трек", "трека", "треков"];
  const form = count % 10 === 1 && count % 100 !== 11 ? forms[0] : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? forms[1] : forms[2];
  return `${count} ${form}`;
});

if (!release.value) throw createError({statusCode: 404, statusMessage: "Релиз не найден"});

useContextNavigation({
  title: "Mecorion",
  subtitle: "Music",
  accent: "#ff6f8f",
  accentStrong: "#ff86a3",
  activeId: computed(() => release.value.kind === "playlist" ? "playlist-playlist-evening" : ""),
  groups: computed(() => [
    {label: null, navLabel: "Настройка Music", items: [
      {id: "onboarding", title: "Первый запуск", icon: "star", action: () => navigateTo("/music")},
    ]},
    {label: null, navLabel: "Разделы Music", items: [
      {id: "home", title: "Главная", icon: "home", action: () => navigateTo("/music")},
      {id: "search", title: "Поиск", icon: "search", action: () => navigateTo("/music?section=search")},
      {id: "library", title: "Моя музыка", icon: "music", action: () => navigateTo("/music")},
      {id: "local", title: "Локальная музыка", icon: "download", action: () => navigateTo("/music")},
    ]},
    {label: "Плейлисты", items: musicPlaylists.map((playlist) => ({
      id: `playlist-${playlist.id}`,
      title: playlist.title,
      icon: "music",
      active: release.value.kind === "playlist" && release.value.id === "evening-flow" && playlist.id === "playlist-evening",
      action: () => navigateTo(playlist.id === "playlist-evening" ? "/music/playlist/evening-flow" : "/music"),
    }))},
  ]),
});

function playRelease() {
  const matchingIds = playableIds.value.filter((id) => player.tracks.some((track) => track.id === id));
  if (matchingIds.length) player.playCollection(matchingIds);
}

function toggleReleaseLike() {
  const shouldUnlike = isLiked.value;
  release.value.tracks.forEach((track) => {
    if (shouldUnlike || !player.likedTrackIds.includes(track.id)) player.toggleLike(track.id);
  });
}
</script>

<template>
  <main class="memusic-release-page">
    <div class="memusic-release-panel">
    <nav class="memusic-release-breadcrumb" aria-label="Навигационная цепочка">
      <NuxtLink to="/music">Music</NuxtLink><SvgIcon name="chevron-right" /><span>{{ release.typeLabel }}</span>
    </nav>

    <section class="memusic-release-hero">
      <div class="memusic-release-hero__glow" :style="{backgroundImage: `url(${release.cover})`}" aria-hidden="true" />
      <div class="memusic-release-hero__art"><img class="memusic-release-hero__cover" :src="release.cover" :alt="`Обложка: ${release.title}`" /></div>
      <div class="memusic-release-hero__content">
        <p class="memusic-release-hero__eyebrow">MECORION MUSIC <span>/</span> РЕЛИЗ</p>
        <div class="memusic-release-title-line">
          <h1>{{ release.title }}</h1>
          <UiBadge variant="accent">{{ release.typeLabel }}</UiBadge>
        </div>
        <p class="memusic-release-hero__artist"><strong>{{ release.artist }}</strong><span aria-hidden="true" />{{ release.year }}<span aria-hidden="true" />{{ releaseCountLabel }}</p>
        <p class="memusic-release-hero__summary">{{ release.description }}</p>
        <div class="memusic-release-hero__actions">
          <UiButton variant="primary" class="memusic-release-hero__listen" @click="playRelease"><SvgIcon name="play" /> {{ release.kind === 'podcast' ? 'Слушать выпуск' : 'Слушать' }}</UiButton>
          <UiButton variant="outline" class="memusic-release-hero__favorite" :aria-pressed="isLiked" @click="toggleReleaseLike"><SvgIcon name="heart" /> <span>{{ isLiked ? 'В избранном' : 'В избранное' }}</span></UiButton>
          <UiButton variant="ghost" class="memusic-release-hero__about" href="#release-about">О релизе <SvgIcon name="chevron-right" /></UiButton>
        </div>
      </div>
    </section>

    <div class="memusic-release-layout">
      <section class="memusic-release-tracklist" aria-labelledby="release-tracks-title">
        <header><div><p>{{ release.kind === 'podcast' ? 'Выпуски' : 'Внутри релиза' }}</p><h2 id="release-tracks-title">{{ release.kind === 'podcast' ? 'Эпизоды' : 'Треки' }}</h2></div><span>{{ releaseCountLabel }}</span></header>
        <ol>
          <li v-for="(track, index) in release.tracks" :key="track.id">
            <UiButton unstyled class="memusic-release-track" @click="player.tracks.some((item) => item.id === track.id) && player.playTrack(track.id, playableIds)">
              <span class="memusic-release-track__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="memusic-release-track__artwork">
                <img class="memusic-release-track__cover" :src="track.cover" alt="" />
                <span class="memusic-release-track__play" aria-hidden="true"><SvgIcon name="play" /></span>
              </span>
              <span class="memusic-release-track__title"><strong>{{ track.title }}</strong><small>{{ track.artist }}</small></span>
              <span class="memusic-release-track__duration">{{ track.durationLabel }}</span>
            </UiButton>
            <UiButton unstyled class="memusic-release-track__like" :class="{'is-active': player.likedTrackIds.includes(track.id)}" :aria-label="`Добавить ${track.title} в избранное`" @click="player.toggleLike(track.id)"><SvgIcon name="heart" /></UiButton>
          </li>
        </ol>
      </section>

      <aside class="memusic-release-aside" aria-label="Информация о релизе">
        <UiCard id="release-about" class="memusic-release-info" title="О релизе"><p>{{ release.description }}</p><dl><div><dt>Дата выхода</dt><dd>{{ release.date }}</dd></div><div><dt>Лейбл</dt><dd>{{ release.label }}</dd></div></dl></UiCard>
        <UiCard class="memusic-release-info" title="Участники записи"><ul><li v-for="credit in release.credits" :key="credit">{{ credit }}</li></ul></UiCard>
      </aside>
    </div>

    <section class="memusic-release-discovery" aria-labelledby="release-discovery-title">
      <header class="memusic-release-discovery__header">
        <div><p>СЛУШАЙТЕ ДАЛЬШЕ</p><h2 id="release-discovery-title">Похожие релизы</h2></div>
        <UiButton variant="ghost" to="/music">Весь каталог <SvgIcon name="chevron-right" /></UiButton>
      </header>
      <div class="memusic-release-discovery__grid">
        <UiCard v-for="item in related" :key="item.id" raw unstyled :to="`/music/${item.kind}/${item.id}`" class="memusic-release-discovery__card">
          <img :src="item.cover" :alt="`Обложка: ${item.title}`" />
          <span><strong>{{ item.title }}</strong><small>{{ item.typeLabel }} · {{ item.artist }}</small></span>
        </UiCard>
      </div>
    </section>

    <footer class="memusic-release-footer">℗ {{ release.label }}</footer>
    </div>
    <MusicQueuePanel :inert="player.isPlayerModeOpen" />
    <MusicPlayerMode />
    <MusicPlayerBar release :inert="player.isPlayerModeOpen" />
  </main>
</template>
