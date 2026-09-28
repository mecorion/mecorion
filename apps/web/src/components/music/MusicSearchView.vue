<script setup>
import {computed} from "vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiEmptyState from "@/components/ui/UiEmptyState.vue";
import UiTabs from "@/components/ui/UiTabs.vue";
import SvgIcon from "@/components/SvgIcon.vue";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";

const props = defineProps({
  query: {type: String, default: ""},
  results: {type: Object, required: true},
});
const tab = defineModel("tab", {type: String, default: "all"});
const emit = defineEmits(["search", "select", "clear"]);
const player = useMusicPlayerStore();
const tabs = [
  {value: "all", label: "Все"}, {value: "tracks", label: "Треки"},
  {value: "artists", label: "Исполнители"}, {value: "albums", label: "Альбомы"},
  {value: "playlists", label: "Плейлисты"}, {value: "podcasts", label: "Подкасты"},
];
const best = computed(() => props.results.artists[0] ?? props.results.albums[0] ?? props.results.all.find((item) => item.type === "track") ?? props.results.playlists[0] ?? null);
const quick = computed(() => props.results.all.filter((item) => item.type !== best.value?.type || item.id !== best.value?.id).slice(0, 4));
const typeLabel = {track: "Трек", artist: "Исполнитель", album: "Альбом", playlist: "Плейлист"};
const listenerFormatter = new Intl.NumberFormat("ru-RU");
function listenerLabel(count) {
  const value = count % 100;
  const ending = value >= 11 && value <= 14 ? "слушателей" : count % 10 === 1 ? "слушатель" : count % 10 >= 2 && count % 10 <= 4 ? "слушателя" : "слушателей";
  return `${listenerFormatter.format(count)} ${ending} в месяц`;
}

function play(track, context = props.results.tracks) {
  if (track?.available) player.playTrack(track.id, context.map((item) => item.id));
}
function playBest() {
  const track = best.value?.type === "track" ? best.value : best.value?.tracks?.find((item) => item.available);
  play(track, best.value?.tracks ?? props.results.tracks);
}
const bestPlayable = computed(() => best.value?.type === "track" ? best.value.available : best.value?.tracks?.some((item) => item.available));
</script>

<template>
  <section class="memusic-search-view" aria-label="Поиск музыки">
    <div v-if="!query" class="music-search__welcome">
      <p class="music-search__eyebrow">Mecorion Music / Поиск</p>
      <h1>Что будем искать?</h1>
      <p>Ищите треки, исполнителей, альбомы и плейлисты. Ваша музыка начинается с одного запроса.</p>
      <div class="music-search__explore">
        <div class="music-search__orbit" aria-hidden="true"><span></span><SvgIcon name="search" /><span></span></div>
        <div class="music-search__explore-chips">
          <UiButton v-for="item in ['Треки', 'Исполнители', 'Альбомы', 'Плейлисты']" :key="item" variant="outline" @click="emit('search', item === 'Треки' ? 'Трек' : item === 'Исполнители' ? 'Исполнитель' : item === 'Альбомы' ? 'Альбом' : 'Вечерний')">{{ item }}</UiButton>
        </div>
      </div>
    </div>

    <div v-else class="music-search__results">
      <UiTabs v-model="tab" :items="tabs" class="music-search__tabs" />

      <div v-if="!results.all.length" class="music-search__no-results">
        <UiEmptyState title="Ничего не найдено" :description="`В текущем каталоге нет результатов по запросу «${query}». Попробуйте другое название.`">
          <template #media><SvgIcon name="search" /></template>
          <template #actions><UiButton variant="outline" @click="emit('clear')">Очистить поиск</UiButton></template>
        </UiEmptyState>
      </div>

      <template v-else>
        <div v-if="tab === 'all'" class="music-search__overview">
          <div v-if="best" class="music-search__best">
            <h2>Лучший результат</h2>
            <UiCard raw unstyled class="music-search__best-card">
              <img :src="best.cover" alt="" />
              <div class="music-search__best-copy"><p>{{ typeLabel[best.type] }}</p><h3>{{ best.title }}</h3><span>{{ best.subtitle }}</span></div>
              <UiButton v-if="bestPlayable" unstyled class="music-search__best-play" :aria-label="`Слушать ${best.title}`" @click="playBest"><SvgIcon name="play" /></UiButton>
            </UiCard>
          </div>
          <div v-if="quick.length" class="music-search__quick">
            <h2>Быстрые результаты</h2>
            <UiCard v-for="item in quick" :key="`${item.type}-${item.id}`" raw unstyled class="music-search__quick-card">
              <UiButton unstyled class="music-search__quick-button" @click="emit('select', item)"><img :src="item.cover" alt="" /><span><strong>{{ item.title }}</strong><small>{{ typeLabel[item.type] }} · {{ item.subtitle }}</small></span><SvgIcon name="chevron-right" /></UiButton>
            </UiCard>
          </div>
        </div>

        <section v-else-if="tab === 'tracks'" class="music-search__section">
          <div class="music-search__section-head"><h2>Треки</h2><span>{{ results.tracks.length }}</span></div>
          <div v-if="results.tracks.length" class="music-search__track-list">
            <UiCard v-for="track in results.tracks" :key="track.id" raw unstyled class="music-search__track-row" :class="{'is-playing': player.currentTrackId === track.id}">
              <UiButton unstyled class="music-search__track-main" :disabled="!track.available" :title="track.available ? `Слушать ${track.title}` : 'Аудио пока недоступно'" @click="play(track)">
                <span class="music-search__track-cover"><img :src="track.cover" alt="" /><SvgIcon v-if="track.available" name="play" /></span>
                <span class="music-search__track-copy"><strong>{{ track.title }}</strong><span class="music-search__track-meta"><span>{{ track.artist }}</span><span>{{ track.album }}</span></span></span>
              </UiButton>
              <div class="music-search__track-actions"><UiButton unstyled :aria-label="player.likedTrackIds.includes(track.id) ? 'Убрать из любимых' : 'Добавить в любимые'" :aria-pressed="player.likedTrackIds.includes(track.id)" @click="player.toggleLike(track.id)"><SvgIcon name="heart" /></UiButton><time>{{ track.durationLabel }}</time></div>
            </UiCard>
          </div>
          <UiEmptyState v-else title="Треки не найдены" size="sm" />
        </section>

        <section v-else-if="tab === 'artists'" class="music-search__section">
          <div class="music-search__section-head"><h2>Исполнители</h2><span>{{ results.artists.length }}</span></div>
          <div v-if="results.artists.length" class="music-search__artist-grid">
            <UiCard v-for="artist in results.artists" :key="artist.id" raw unstyled class="music-search__artist-card">
              <UiButton unstyled class="music-search__artist-open" @click="emit('select', artist)">
                <span class="music-search__artist-art"><img :src="artist.cover" alt="" /></span>
                <strong>{{ artist.title }}</strong><small>{{ listenerLabel(artist.monthlyListeners) }}</small>
              </UiButton>
            </UiCard>
          </div>
          <UiEmptyState v-else title="Исполнители не найдены" size="sm" />
        </section>

        <section v-else-if="tab === 'albums'" class="music-search__section">
          <div class="music-search__section-head"><h2>Альбомы</h2><span>{{ results.albums.length }}</span></div>
          <div v-if="results.albums.length" class="music-search__album-grid">
            <UiCard v-for="album in results.albums" :key="album.id" raw unstyled class="music-search__album-card">
              <div class="music-search__media-art">
                <UiButton unstyled class="music-search__media-open" :aria-label="`Открыть альбом ${album.title}`" @click="emit('select', album)"><img :src="album.cover" alt="" /></UiButton>
                <UiButton unstyled class="music-search__media-play" :disabled="!album.tracks.some((track) => track.available)" :aria-label="`Слушать альбом ${album.title}`" :title="album.tracks.some((track) => track.available) ? `Слушать ${album.title}` : 'Аудио пока недоступно'" @click="player.playCollection(album.tracks.map((track) => track.id))"><SvgIcon name="play" /></UiButton>
              </div>
              <UiButton unstyled class="music-search__media-copy" @click="emit('select', album)"><strong>{{ album.title }}</strong><small>{{ album.year }} · {{ album.subtitle }}</small></UiButton>
            </UiCard>
          </div>
          <UiEmptyState v-else title="Альбомы не найдены" size="sm" />
        </section>

        <section v-else-if="tab === 'playlists'" class="music-search__section">
          <div class="music-search__section-head"><h2>Плейлисты</h2><span>{{ results.playlists.length }}</span></div>
          <div v-if="results.playlists.length" class="music-search__playlist-grid">
            <UiCard v-for="playlist in results.playlists" :key="playlist.id" raw unstyled class="music-search__playlist-card">
              <div class="music-search__media-art">
                <UiButton unstyled class="music-search__media-open" :aria-label="`Открыть плейлист ${playlist.title}`" @click="emit('select', playlist)"><img :src="playlist.cover" alt="" /></UiButton>
                <UiButton unstyled class="music-search__media-play" :disabled="!playlist.trackIds.some((id) => player.tracks.some((track) => track.id === id && track.available))" :aria-label="`Слушать плейлист ${playlist.title}`" :title="playlist.trackIds.some((id) => player.tracks.some((track) => track.id === id && track.available)) ? `Слушать ${playlist.title}` : 'Аудио пока недоступно'" @click="player.playCollection(playlist.trackIds)"><SvgIcon name="play" /></UiButton>
              </div>
              <UiButton unstyled class="music-search__media-copy" @click="emit('select', playlist)"><strong>{{ playlist.title }}</strong><small>{{ playlist.description }}</small></UiButton>
            </UiCard>
          </div>
          <UiEmptyState v-else title="Плейлисты не найдены" size="sm" />
        </section>

        <UiEmptyState v-else class="music-search__podcasts" title="Подкасты скоро появятся" description="Когда каталог подкастов будет подключён, результаты появятся здесь." />
      </template>
    </div>
  </section>
</template>
