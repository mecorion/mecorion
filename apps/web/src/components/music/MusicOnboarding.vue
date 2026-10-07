<script setup>
import {computed, onMounted, ref, watch} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiFilePicker from "@/components/ui/UiFilePicker.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSteps from "@/components/ui/UiSteps.vue";

const emit = defineEmits(["finish"]);
const step = ref(1);
const query = ref("");
const selectedGenres = ref(["rock", "metal", "electronic", "soundtrack"]);
const selectedArtists = ref(["korol", "kino", "daft", "slipknot"]);
const importSource = ref("spotify");
const files = ref([]);
const steps = ["Жанры", "Исполнители", "Импорт", "Готово"];
const genres = [
  {id: "rock", title: "Рок", icon: "music", color: "rose"},
  {id: "metal", title: "Металл", icon: "star", color: "rose"},
  {id: "electronic", title: "Электроника", icon: "repeat", color: "violet"},
  {id: "rap", title: "Рэп", icon: "music", color: "violet"},
  {id: "pop", title: "Поп", icon: "heart", color: "rose"},
  {id: "jazz", title: "Джаз", icon: "music", color: "violet"},
  {id: "classical", title: "Классика", icon: "music", color: "violet"},
  {id: "soundtrack", title: "Саундтреки", icon: "play", color: "violet"},
  {id: "indie", title: "Инди", icon: "music", color: "violet"},
  {id: "lofi", title: "Lo-fi", icon: "repeat", color: "rose"},
  {id: "folk", title: "Фолк", icon: "music", color: "violet"},
  {id: "anime", title: "Аниме", icon: "star", color: "rose"},
];
const artists = [
  {id: "korol", title: "Король и Шут", mark: "КиШ", color: "rose"},
  {id: "kino", title: "Кино", mark: "КИНО", color: "slate"},
  {id: "linkin", title: "Linkin Park", mark: "LP", color: "violet"},
  {id: "bmth", title: "Bring Me The Horizon", mark: "BMTH", color: "slate"},
  {id: "molchat", title: "Молчат Дома", mark: "МД", color: "slate"},
  {id: "oxxy", title: "Oxxxymiron", mark: "OXXY", color: "violet"},
  {id: "daft", title: "Daft Punk", mark: "DAFT", color: "violet"},
  {id: "miyagi", title: "Miyagi & Andy Panda", mark: "M&A", color: "slate"},
  {id: "sabaton", title: "Sabaton", mark: "S", color: "rose"},
  {id: "dragons", title: "Imagine Dragons", mark: "ID", color: "violet"},
  {id: "slipknot", title: "Slipknot", mark: "S", color: "rose"},
  {id: "radiohead", title: "Radiohead", mark: "RH", color: "slate"},
];
const importOptions = [
  {id: "spotify", title: "Spotify", description: "Плейлисты и любимые треки", icon: "music", badge: "Популярно", flowLabel: "Плейлисты"},
  {id: "yandex", title: "Яндекс Музыка", description: "Плейлисты и избранное", icon: "music", badge: "Быстро", flowLabel: "Избранное"},
  {id: "local", title: "Локальные файлы", description: "Музыка с вашего компьютера", icon: "folder", flowLabel: "Аудиофайлы"},
  {id: "playlist", title: "CSV / M3U", description: "Файлы плейлистов", icon: "list-music", flowLabel: "Списки треков"},
];
const filteredArtists = computed(() => artists.filter((artist) => artist.title.toLocaleLowerCase("ru").includes(query.value.trim().toLocaleLowerCase("ru"))));

function toggle(kind, id) {
  const collection = kind === "genre" ? selectedGenres : selectedArtists;
  collection.value = collection.value.includes(id) ? collection.value.filter((value) => value !== id) : [...collection.value, id];
}
function finish() {
  localStorage.setItem("mecorion.music.onboarding", JSON.stringify({genres: selectedGenres.value, artists: selectedArtists.value, importSource: importSource.value}));
  emit("finish");
}
watch(step, () => { query.value = ""; });
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem("mecorion.music.onboarding.draft") || "null");
    if (saved) {
      step.value = Math.min(4, Math.max(1, saved.step || 1));
      selectedGenres.value = saved.genres || selectedGenres.value;
      selectedArtists.value = saved.artists || selectedArtists.value;
      importSource.value = saved.importSource || importSource.value;
    }
  } catch { /* Ignore an old draft. */ }
});
watch([step, selectedGenres, selectedArtists, importSource], () => {
  localStorage.setItem("mecorion.music.onboarding.draft", JSON.stringify({step: step.value, genres: selectedGenres.value, artists: selectedArtists.value, importSource: importSource.value}));
}, {deep: true});
</script>

<template>
  <div class="music-setup">
    <div class="music-setup__ambient" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="music-setup__inner">
      <header class="music-setup__progress" aria-label="Шаги настройки">
        <span class="music-setup__count">{{ step }}/4</span>
        <UiSteps :steps="steps" :current="step" label="Настройка Music" />
        <p>Создаём вашу<br />музыкальную историю</p>
      </header>

      <div class="music-setup__intro">
        <p class="music-setup__eyebrow">{{ step === 4 ? 'Всё готово' : 'Добро пожаловать в Mecorion Music' }}</p>
        <h1>{{ step === 4 ? 'Mecorion Music готов' : 'Настройте Mecorion Music' }}</h1>
        <h2>{{ ['Шаг 1. Выберите любимые жанры', 'Шаг 2. Выберите любимых исполнителей', 'Шаг 3. Импортируйте музыку и плейлисты', 'Настройку можно завершить позже'][step - 1] }}</h2>
        <p>{{ ['Это поможет собрать для вас персональные рекомендации и первый музыкальный поток.', 'Мы соберём персональные подборки и быстрее запустим рекомендации по вашим вкусам.', 'Перенесите свою библиотеку и начните слушать без ручной настройки с нуля.', 'Вы сможете в любой момент выбрать жанры, исполнителей и импортировать плейлисты позже.'][step - 1] }}</p>
      </div>

      <template v-if="step === 1 || step === 2">
        <div v-if="step === 2" class="music-setup__search"><UiInput v-model="query" placeholder="Найти исполнителя"><template #prefix><SvgIcon name="search" /></template></UiInput></div>
        <div class="music-setup__grid" :class="{'music-setup__grid--artists': step === 2}">
          <UiCard v-for="(item, index) in step === 1 ? genres : filteredArtists" :key="item.id" raw unstyled class="music-setup__choice" :class="[`music-setup__choice--${item.color}`, {selected: (step === 1 ? selectedGenres : selectedArtists).includes(item.id)}]">
            <UiButton unstyled class="music-setup__choice-button" :aria-pressed="(step === 1 ? selectedGenres : selectedArtists).includes(item.id)" :aria-label="`${item.title}: ${(step === 1 ? selectedGenres : selectedArtists).includes(item.id) ? 'выбрано' : 'выбрать'}`" @click="toggle(step === 1 ? 'genre' : 'artist', item.id)">
              <span class="music-setup__choice-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="music-setup__choice-art"><SvgIcon v-if="step === 1" :name="item.icon" /><strong v-else>{{ item.mark }}</strong></span>
              <span class="music-setup__choice-title">{{ item.title }}</span>
              <span v-if="(step === 1 ? selectedGenres : selectedArtists).includes(item.id)" class="music-setup__check" aria-hidden="true"></span>
            </UiButton>
          </UiCard>
        </div>
        <p class="music-setup__selection"><span>Выбрано <strong>{{ step === 1 ? selectedGenres.length : selectedArtists.length }}</strong> {{ step === 1 ? 'жанра' : 'исполнителя' }}</span><span>Можно изменить позже в настройках <SvgIcon name="circle-alert" /></span></p>
      </template>

      <template v-else-if="step === 3">
        <div class="music-setup__imports">
          <UiCard v-for="source in importOptions" :key="source.id" raw unstyled class="music-setup__import" :class="{selected: importSource === source.id}">
            <UiButton unstyled class="music-setup__import-button" :aria-pressed="importSource === source.id" @click="importSource = source.id">
              <span v-if="source.badge" class="music-setup__badge">{{ source.badge }}</span>
              <span class="music-setup__import-visual" aria-hidden="true">
                <span class="music-setup__import-icon"><SvgIcon :name="source.icon" /></span>
                <span class="music-setup__import-tracks"><i></i><i></i><i></i></span>
                <SvgIcon class="music-setup__import-arrow" name="chevron-right" />
                <span class="music-setup__import-destination">M</span>
              </span>
              <span class="music-setup__import-copy"><strong>{{ source.title }}</strong><span>{{ source.description }}</span></span>
              <span class="music-setup__import-caption"><span>{{ source.flowLabel }}</span><span>Music</span></span>
            </UiButton>
          </UiCard>
        </div>
        <div class="music-setup__import-body"><UiFilePicker v-model="files" multiple accept="audio/*,.m3u,.m3u8,.pls,.csv" label="Перетащите файлы сюда" description="Аудиофайлы и плейлисты M3U, PLS или CSV" /><div class="music-setup__benefits"><p><SvgIcon name="list-music" /><span><strong>Сохраним плейлисты</strong><small>Подборки останутся с вами.</small></span></p><p><SvgIcon name="heart" /><span><strong>Перенесём избранное</strong><small>Треки, которые вы любите.</small></span></p><p><SvgIcon name="folder" /><span><strong>Локальная музыка</strong><small>Ваши файлы всегда доступны.</small></span></p><small>Подключение Spotify и Яндекс Музыки появится позже. Сейчас можно выбрать локальные файлы.</small></div></div>
      </template>

      <UiCard v-else raw unstyled class="music-setup__complete"><div class="music-setup__complete-art"><div class="music-setup__device"><span class="music-setup__device-logo">M</span><strong>Ваша музыка<br />начинается здесь</strong><SvgIcon name="music" /></div><span class="music-setup__orbit"></span></div><div class="music-setup__complete-copy"><p><SvgIcon name="badge-check" />Базовый профиль создан</p><p><SvgIcon name="badge-check" />Рекомендации будут уточняться по мере прослушивания</p><p><SvgIcon name="badge-check" />Настройки доступны позже</p><div><SvgIcon name="star" /><span>Просто начните слушать сейчас.</span></div></div></UiCard>

      <footer class="music-setup__footer"><UiButton variant="outline" @click="finish">Пропустить настройку</UiButton><div><UiButton v-if="step > 1" variant="ghost" @click="step--">Назад</UiButton><UiButton variant="primary" @click="step === 4 ? finish() : step++">{{ step === 4 ? 'Открыть Music' : 'Далее' }} <SvgIcon name="chevron-right" /></UiButton></div></footer>
    </div>
  </div>
</template>
