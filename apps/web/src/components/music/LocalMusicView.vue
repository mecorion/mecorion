<script setup>
import {computed, ref} from "vue";
import LocalMusicExplorer from "@/components/music/LocalMusicExplorer.vue";
import MusicFilters from "@/components/music/MusicFilters.vue";
import MusicTrackList from "@/components/music/MusicTrackList.vue";
import {createLocalTracks, filesFromDirectoryInput, scanDirectoryHandle} from "@/music/localLibrary.js";
import {filterAndSortTracks} from "@/music/trackFilters.js";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiProgress from "@/components/ui/UiProgress.vue";
import SvgIcon from "@/components/SvgIcon.vue";

const player = useMusicPlayerStore();
const fileInput = ref(null);
const viewMode = ref("playlist");
const isScanning = ref(false);
const scanStage = ref("");
const scannedFiles = ref(0);
const processedFiles = ref(0);
const scanError = ref("");
const filters = ref({sort: "title"});

const hasLocalLibrary = computed(() => player.localTracks.length > 0);
const totalSize = computed(() => player.localTracks.reduce((sum, track) => sum + track.fileSize, 0));
const filteredLocalTracks = computed(() => filterAndSortTracks(player.localTracks, filters.value));
const totalSizeLabel = computed(() => {
  if (totalSize.value < 1024 ** 2) return `${Math.round(totalSize.value / 1024)} КБ`;
  return `${(totalSize.value / 1024 ** 2).toFixed(1)} МБ`;
});
const scanTotal = computed(() => Math.max(scannedFiles.value, processedFiles.value, 1));

async function processFolder({entries, rootName}) {
  isScanning.value = true;
  scanError.value = "";
  processedFiles.value = 0;
  scanStage.value = "Читаем метаданные";

  try {
    const tracks = await createLocalTracks(entries, rootName, (processed) => {
      processedFiles.value = processed;
    });
    player.replaceLocalLibrary(tracks, rootName);
    viewMode.value = "playlist";

    if (!tracks.length) scanError.value = "В выбранной папке нет поддерживаемых аудиофайлов";
  } catch (error) {
    scanError.value = "Не удалось прочитать выбранную папку";
    console.error("Local music scan failed", error);
  } finally {
    isScanning.value = false;
    scanStage.value = "";
  }
}

async function chooseFolder() {
  scanError.value = "";

  if (!("showDirectoryPicker" in window)) {
    fileInput.value?.click();
    return;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker({mode: "read"});
    isScanning.value = true;
    scanStage.value = "Ищем аудиофайлы";
    scannedFiles.value = 0;
    const result = await scanDirectoryHandle(directoryHandle, (count) => { scannedFiles.value = count; });
    await processFolder(result);
  } catch (error) {
    if (error?.name !== "AbortError") {
      scanError.value = "Браузер не смог открыть выбранную папку";
      console.error("Directory picker failed", error);
    }
    isScanning.value = false;
    scanStage.value = "";
  }
}

async function handleFallbackSelection(event) {
  const result = filesFromDirectoryInput(event.target.files);
  scannedFiles.value = result.entries.length;
  await processFolder(result);
  event.target.value = "";
}
</script>

<template>
  <section class="memusic-local">
    <header class="memusic-local__header">
      <div><p class="memusic-kicker">На этом устройстве</p><h1>Локальная музыка</h1><p>Ваша коллекция из выбранной папки.</p></div>
      <UiButton v-if="hasLocalLibrary" unstyled class="memusic-secondary-action" @click="chooseFolder">Сменить папку</UiButton>
    </header>

    <input
      ref="fileInput"
      class="memusic-visually-hidden"
      type="file"
      accept="audio/*,.flac,.m4a,.opus"
      multiple
      webkitdirectory
      directory
      @change="handleFallbackSelection"
    />

    <UiCard v-if="!hasLocalLibrary" raw unstyled class="memusic-folder-picker">
      <div class="memusic-folder-picker__icon" aria-hidden="true"><SvgIcon name="folder" /></div>
      <div><span>Локальная медиатека</span><h2>{{ isScanning ? scanStage : 'Выберите папку с музыкой' }}</h2><p>{{ isScanning ? `${processedFiles || scannedFiles} файлов обработано` : 'MP3, M4A, FLAC, WAV, OGG, AAC и Opus' }}</p></div>
      <UiButton v-if="!isScanning" unstyled class="memusic-primary-action" @click="chooseFolder">Выбрать папку</UiButton>
      <UiProgress v-else class="memusic-scan-progress" :value="processedFiles" :max="scanTotal" size="sm" />
      <small>Файлы остаются на вашем устройстве</small>
    </UiCard>

    <p v-if="scanError" class="memusic-local__error">{{ scanError }}</p>

    <template v-if="hasLocalLibrary">
      <UiCard raw unstyled class="memusic-local__summary">
        <div class="memusic-local__folder-icon" aria-hidden="true"><SvgIcon name="folder" /></div>
        <div><strong>{{ player.localFolderName }}</strong><span>{{ player.localTracks.length }} треков · {{ totalSizeLabel }}</span></div>
        <UiButton unstyled aria-label="Воспроизвести локальную медиатеку" @click="player.playCollection(player.localTrackIds)"><SvgIcon name="play" /></UiButton>
      </UiCard>

      <nav class="memusic-local-tabs" aria-label="Вид локальной медиатеки">
        <UiButton unstyled :class="{'is-active': viewMode === 'playlist'}" @click="viewMode = 'playlist'"><SvgIcon name="list-music" /> Плейлист</UiButton>
        <UiButton unstyled :class="{'is-active': viewMode === 'explorer'}" @click="viewMode = 'explorer'"><SvgIcon name="folder" /> Проводник</UiButton>
      </nav>

      <template v-if="viewMode === 'playlist'">
        <MusicFilters v-model="filters" :tracks="player.localTracks" context="local" />
        <MusicTrackList :tracks="filteredLocalTracks" title="Локальные треки" empty-text="Нет треков с такими параметрами" />
      </template>
      <LocalMusicExplorer v-else :tracks="player.localTracks" :root-name="player.localFolderName" />
    </template>
  </section>
</template>
