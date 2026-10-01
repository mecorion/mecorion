<script setup lang="ts">
import UiButton from "@mecorion-ui/UiButton.vue";
import UiCard from "@mecorion-ui/UiCard.vue";
import UiCheckbox from "@mecorion-ui/UiCheckbox.vue";
import UiDialog from "@mecorion-ui/UiDialog.vue";
import UiEmptyState from "@mecorion-ui/UiEmptyState.vue";
import UiFilePicker from "@mecorion-ui/UiFilePicker.vue";
import UiForm from "@mecorion-ui/UiForm.vue";
import UiInput from "@mecorion-ui/UiInput.vue";
import UiSelect from "@mecorion-ui/UiSelect.vue";
import UiTabs from "@mecorion-ui/UiTabs.vue";
import UiTextarea from "@mecorion-ui/UiTextarea.vue";

definePageMeta({title: "Mecorion Music"});

type RefItem = {code: string; name: string};
type Artist = {id: string; name: string; kind: string; status: string; description: string | null; releaseCount: number};
type ArtistRef = {id: string; name: string};
type Album = {id: string; title: string; status: string; albumType: string; languageCode: string | null; upc: string | null; releaseDate: string | null; discCount: number; trackCount: number; artists: ArtistRef[]; coverAssetId: string | null; metadata: Record<string, unknown>};
type Track = {id: string; title: string; status: string; languageCode: string | null; releaseDate: string | null; durationMs: number | null; isrc: string | null; bpm: number | null; musicalKey: string | null; isExplicit: boolean; previewStartMs: number | null; albumId: string | null; albumTitle: string | null; discNumber: number | null; trackNumber: number | null; artists: ArtistRef[]; audioAssetId: string | null; metadata: Record<string, unknown>};
type Lyrics = {id: string; languageCode: string; type: string; text: string; isPrimary: boolean};

const client = useAdminClient();
const activeTab = ref("tracks");
const search = ref("");
const statusFilter = ref("");
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const artists = ref<Artist[]>([]);
const albums = ref<Album[]>([]);
const tracks = ref<Track[]>([]);
const refs = reactive({statuses: [] as RefItem[], albumTypes: [] as RefItem[], languages: [] as RefItem[], artistKinds: [] as RefItem[]});

const artistDialog = ref(false);
const albumDialog = ref(false);
const trackDialog = ref(false);
const uploadDialog = ref(false);
const lyricsDialog = ref(false);
const albumTracksDialog = ref(false);
const albumArtistId = ref("");
const editingId = ref("");
const selectedItem = ref<Album | Track | null>(null);
const uploadKind = ref<"audio" | "cover">("audio");
const uploadFile = ref<File | null>(null);
const audioAccept = "audio/mpeg,audio/mp4,audio/x-m4a,audio/flac,audio/x-flac,audio/wav,audio/x-wav,audio/wave,audio/vnd.wave,audio/ogg,.mp3,.m4a,.flac,.wav,.ogg";
const quickTrack = reactive({title: "", artistId: "", albumId: "", file: null as File | null});
const lyrics = ref<Lyrics[]>([]);

const artistForm = reactive({name: "", kindCode: "PERSON", statusCode: "DRAFT", description: ""});
const albumForm = reactive({title: "", statusCode: "DRAFT", albumTypeCode: "ALBUM", languageCode: "", releaseDate: "", upc: "", discCount: 1, artistIds: [] as string[], genres: "", label: ""});
const trackForm = reactive({title: "", statusCode: "DRAFT", languageCode: "", releaseDate: "", durationMs: "", isrc: "", bpm: "", musicalKey: "", isExplicit: false, previewStartMs: "", artistIds: [] as string[], albumId: "", discNumber: 1, trackNumber: 1, genres: ""});
const lyricsForm = reactive({languageCode: "ru", type: "ORIGINAL", text: "", isPrimary: true});
const albumTrackIds = ref<string[]>([]);

const tabItems = computed(() => [
  {label: "Треки", value: "tracks", count: tracks.value.length},
  {label: "Альбомы", value: "albums", count: albums.value.length},
  {label: "Исполнители", value: "artists", count: artists.value.length},
]);
const options = (items: RefItem[]) => items.map(item => ({label: item.name, value: item.code}));
const artistOptions = computed(() => artists.value.map(item => ({label: item.name, value: item.id})));
const albumOptions = computed(() => [{label: "Без альбома", value: ""}, ...albums.value.map(item => ({label: item.title, value: item.id}))]);
const statusOptions = computed(() => [{label: "Все статусы", value: ""}, ...options(refs.statuses)]);
const artistStatusOptions = ["DRAFT", "PENDING", "ACTIVE", "RESTRICTED", "RETIRED"].map(value => ({label: value, value}));
const currentItems = computed(() => activeTab.value === "artists" ? artists.value : activeTab.value === "albums" ? albums.value : tracks.value);

function metadataText(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : "";
}
function splitList(value: string) {
  return value.split(",").map(item => item.trim()).filter(Boolean);
}
function numberOrNull(value: string) {
  return value ? Number(value) : null;
}
function formatDuration(ms: number | null) {
  if (!ms) return "Длительность не указана";
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

async function load() {
  loading.value = true; error.value = "";
  try {
    const query = new URLSearchParams({limit: "200"});
    if (search.value.trim()) query.set("q", search.value.trim());
    if (statusFilter.value) query.set("status", statusFilter.value);
    const [referenceData, artistData, albumData, trackData] = await Promise.all([
      client.request<typeof refs>("/api/v1/admin/music/references"),
      client.request<{items: Artist[]}>(`/api/v1/admin/music/artists?${query}`),
      client.request<{items: Album[]}>(`/api/v1/admin/music/albums?${query}`),
      client.request<{items: Track[]}>(`/api/v1/admin/music/tracks?${query}`),
    ]);
    Object.assign(refs, referenceData); artists.value = artistData.items; albums.value = albumData.items; tracks.value = trackData.items;
  } catch (caught: any) { error.value = caught.message || "Не удалось загрузить каталог Music"; }
  finally { loading.value = false; }
}

function newArtist() { editingId.value = ""; Object.assign(artistForm, {name: "", kindCode: "PERSON", statusCode: "ACTIVE", description: ""}); error.value = ""; artistDialog.value = true; }
function editArtist(item: Artist) { editingId.value = item.id; Object.assign(artistForm, {name: item.name, kindCode: item.kind, statusCode: item.status, description: item.description || ""}); artistDialog.value = true; }
function newAlbum() { editingId.value = ""; albumArtistId.value = ""; Object.assign(albumForm, {title: "", statusCode: "ACTIVE", albumTypeCode: "ALBUM", languageCode: "", releaseDate: "", upc: "", discCount: 1, artistIds: [], genres: "", label: ""}); error.value = ""; albumDialog.value = true; }
function editAlbum(item: Album) { editingId.value = item.id; Object.assign(albumForm, {title: item.title, statusCode: item.status, albumTypeCode: item.albumType, languageCode: item.languageCode || "", releaseDate: item.releaseDate?.slice(0, 10) || "", upc: item.upc || "", discCount: item.discCount, artistIds: item.artists.map(artist => artist.id), genres: metadataText(item.metadata?.genres), label: String(item.metadata?.label || "")}); albumDialog.value = true; }
function newTrack() { editingId.value = ""; Object.assign(quickTrack, {title: "", artistId: "", albumId: "", file: null}); error.value = ""; trackDialog.value = true; }
function editTrack(item: Track) { editingId.value = item.id; Object.assign(trackForm, {title: item.title, statusCode: item.status, languageCode: item.languageCode || "", releaseDate: item.releaseDate?.slice(0, 10) || "", durationMs: item.durationMs ? String(item.durationMs) : "", isrc: item.isrc || "", bpm: item.bpm ? String(item.bpm) : "", musicalKey: item.musicalKey || "", isExplicit: item.isExplicit, previewStartMs: item.previewStartMs ? String(item.previewStartMs) : "", artistIds: item.artists.map(artist => artist.id), albumId: item.albumId || "", discNumber: item.discNumber || 1, trackNumber: item.trackNumber || 1, genres: metadataText(item.metadata?.genres)}); trackDialog.value = true; }

async function mutate(action: () => Promise<unknown>, close: () => void) {
  saving.value = true; error.value = "";
  try { await action(); close(); await load(); }
  catch (caught: any) { error.value = caught.message || "Операция не выполнена"; }
  finally { saving.value = false; }
}
const saveArtist = () => mutate(() => client.request(editingId.value ? `/api/v1/admin/music/artists/${editingId.value}` : "/api/v1/admin/music/artists", {method: editingId.value ? "PATCH" : "POST", body: JSON.stringify({...artistForm, description: artistForm.description || null})}), () => artistDialog.value = false);
const saveAlbum = () => mutate(() => client.request(editingId.value ? `/api/v1/admin/music/albums/${editingId.value}` : "/api/v1/admin/music/albums", {method: editingId.value ? "PATCH" : "POST", body: JSON.stringify({...albumForm, artistIds: editingId.value ? albumForm.artistIds : albumArtistId.value ? [albumArtistId.value] : [], languageCode: albumForm.languageCode || null, releaseDate: albumForm.releaseDate || null, upc: albumForm.upc || null, metadata: {genres: splitList(albumForm.genres), label: albumForm.label}})}), () => albumDialog.value = false);
const saveTrack = () => mutate(() => client.request(editingId.value ? `/api/v1/admin/music/tracks/${editingId.value}` : "/api/v1/admin/music/tracks", {method: editingId.value ? "PATCH" : "POST", body: JSON.stringify({...trackForm, languageCode: trackForm.languageCode || null, releaseDate: trackForm.releaseDate || null, durationMs: numberOrNull(trackForm.durationMs), isrc: trackForm.isrc || null, bpm: numberOrNull(trackForm.bpm), musicalKey: trackForm.musicalKey || null, previewStartMs: numberOrNull(trackForm.previewStartMs), albumId: trackForm.albumId || null, metadata: {genres: splitList(trackForm.genres)}})}), () => trackDialog.value = false);
const saveQuickTrack = () => mutate(async () => {
  if (!quickTrack.file) throw new Error("Выберите MP3 или другой аудиофайл");
  const body = new FormData();
  body.append("title", quickTrack.title.trim());
  if (quickTrack.artistId) body.append("artistId", quickTrack.artistId);
  if (quickTrack.albumId) body.append("albumId", quickTrack.albumId);
  body.append("file", quickTrack.file);
  await client.request("/api/v1/admin/music/tracks/upload", {method: "POST", body});
}, () => trackDialog.value = false);
watch(() => quickTrack.file, (file) => {
  if (file && !quickTrack.title.trim()) quickTrack.title = file.name.replace(/\.[^.]+$/, "");
});

async function retire(kind: "artists" | "albums" | "tracks", item: Artist | Album | Track) {
  if (!window.confirm(`Вывести «${"name" in item ? item.name : item.title}» из каталога?`)) return;
  await mutate(() => client.request(`/api/v1/admin/music/${kind}/${item.id}`, {method: "DELETE"}), () => undefined);
}
function openUpload(item: Album | Track, kind: "audio" | "cover") { selectedItem.value = item; uploadKind.value = kind; uploadFile.value = null; uploadDialog.value = true; }
const saveUpload = () => mutate(async () => { if (!uploadFile.value || !selectedItem.value) throw new Error("Выберите файл"); const body = new FormData(); body.append("file", uploadFile.value); const path = uploadKind.value === "audio" ? `/api/v1/admin/music/tracks/${selectedItem.value.id}/audio` : `/api/v1/admin/music/albums/${selectedItem.value.id}/cover`; await client.request(path, {method: "POST", body}); }, () => uploadDialog.value = false);

async function openLyrics(item: Track) {
  selectedItem.value = item; error.value = "";
  try { lyrics.value = (await client.request<{items: Lyrics[]}>(`/api/v1/admin/music/tracks/${item.id}/lyrics`)).items; const current = lyrics.value[0]; Object.assign(lyricsForm, current ? {languageCode: current.languageCode, type: current.type, text: current.text, isPrimary: current.isPrimary} : {languageCode: "ru", type: "ORIGINAL", text: "", isPrimary: true}); lyricsDialog.value = true; }
  catch (caught: any) { error.value = caught.message || "Не удалось загрузить текст"; }
}
const saveLyrics = () => mutate(() => client.request(`/api/v1/admin/music/tracks/${selectedItem.value!.id}/lyrics`, {method: "PUT", body: JSON.stringify(lyricsForm)}), () => lyricsDialog.value = false);
function openAlbumTracks(item: Album) { selectedItem.value = item; albumTrackIds.value = tracks.value.filter(track => track.albumId === item.id).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0)).map(track => track.id); albumTracksDialog.value = true; }
const saveAlbumTracks = () => mutate(() => client.request(`/api/v1/admin/music/albums/${selectedItem.value!.id}/tracks`, {method: "PUT", body: JSON.stringify({tracks: albumTrackIds.value.map((trackId, index) => ({trackId, discNumber: 1, trackNumber: index + 1}))})}), () => albumTracksDialog.value = false);

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__heading">
      <div><p class="admin-eyebrow">Mecorion Music</p><h1 class="text-title">Управление музыкой</h1><p class="text-subtitle">Исполнители, релизы, треки, аудиофайлы, обложки, тексты и модерационные статусы в одном рабочем контуре.</p></div>
      <div class="admin-actions"><UiButton variant="outline" :loading="loading" @click="load">Обновить</UiButton><UiButton v-if="activeTab === 'tracks'" variant="primary" @click="newTrack">Загрузить музыку</UiButton><UiButton v-else-if="activeTab === 'albums'" variant="primary" @click="newAlbum">Создать альбом</UiButton><UiButton v-else variant="primary" @click="newArtist">Создать исполнителя</UiButton></div>
    </header>

    <UiCard title="Каталог и модерация" description="Статус ACTIVE публикует объект в сервисе, PENDING отправляет его на проверку.">
      <UiTabs v-model="activeTab" :items="tabItems" />
      <div class="admin-toolbar"><UiInput v-model="search" label="Поиск" placeholder="Название или исполнитель" @keyup.enter="load" /><UiSelect v-model="statusFilter" label="Статус" :options="activeTab === 'artists' ? [{label: 'Все статусы', value: ''}, ...artistStatusOptions] : statusOptions" /><UiButton variant="primary" :loading="loading" @click="load">Применить</UiButton></div>
    </UiCard>
    <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
    <UiCard v-if="loading" title="Загрузка музыкального каталога…" />
    <UiEmptyState v-else-if="!currentItems.length" title="Ничего не найдено" description="Создайте первый объект или измените фильтры." />

    <section v-else-if="activeTab === 'artists'" class="admin-list">
      <UiCard v-for="item in artists" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.name }}</h3><p class="mc-text-sm">{{ item.description || "Описание не заполнено" }}</p><div class="admin-meta"><span class="mc-chip">{{ item.status }}</span><span class="mc-chip">{{ item.kind }}</span><span class="mc-chip">{{ item.releaseCount }} релизов</span></div></div><span class="text-caption">Исполнитель</span><div class="admin-actions"><UiButton size="sm" variant="outline" @click="editArtist(item)">Изменить</UiButton><UiButton size="sm" variant="ghost" @click="retire('artists', item)">Вывести</UiButton></div></UiCard>
    </section>
    <section v-else-if="activeTab === 'albums'" class="admin-list">
      <UiCard v-for="item in albums" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.title }}</h3><p class="mc-text-sm">{{ item.artists.map(artist => artist.name).join(", ") || "Исполнитель не назначен" }}</p><div class="admin-meta"><span class="mc-chip">{{ item.status }}</span><span class="mc-chip">{{ item.albumType }}</span><span class="mc-chip">{{ item.trackCount }} треков</span><span class="mc-chip">{{ item.coverAssetId ? "Обложка загружена" : "Без обложки" }}</span></div></div><span class="text-caption">{{ item.releaseDate ? new Date(item.releaseDate).toLocaleDateString("ru-RU") : "Дата не указана" }}</span><div class="admin-actions"><UiButton size="sm" variant="outline" @click="editAlbum(item)">Изменить</UiButton><UiButton size="sm" variant="outline" @click="openAlbumTracks(item)">Состав</UiButton><UiButton size="sm" variant="outline" @click="openUpload(item, 'cover')">Обложка</UiButton><UiButton size="sm" variant="ghost" @click="retire('albums', item)">Вывести</UiButton></div></UiCard>
    </section>
    <section v-else class="admin-list">
      <UiCard v-for="item in tracks" :key="item.id" class="admin-list-item" raw><div class="admin-list-item__main"><h3>{{ item.title }}</h3><p class="mc-text-sm">{{ item.artists.map(artist => artist.name).join(", ") || "Исполнитель не назначен" }}<template v-if="item.albumTitle"> · {{ item.albumTitle }}</template></p><div class="admin-meta"><span class="mc-chip">{{ item.status }}</span><span class="mc-chip">{{ formatDuration(item.durationMs) }}</span><span class="mc-chip">{{ item.audioAssetId ? "Аудио готово" : "Нет аудио" }}</span><span v-if="item.isExplicit" class="mc-chip">Explicit</span></div></div><span class="text-caption">{{ item.isrc || "ISRC не указан" }}</span><div class="admin-actions"><UiButton size="sm" variant="outline" @click="editTrack(item)">Изменить</UiButton><UiButton size="sm" variant="outline" @click="openUpload(item, 'audio')">Аудио</UiButton><UiButton size="sm" variant="outline" @click="openLyrics(item)">Текст</UiButton><UiButton size="sm" variant="ghost" @click="retire('tracks', item)">Вывести</UiButton></div></UiCard>
    </section>

    <UiDialog v-model="artistDialog" :title="editingId ? 'Изменить исполнителя' : 'Новый исполнитель'" size="lg">
      <UiForm :loading="saving" :error="error" @submit="saveArtist">
        <UiInput v-model="artistForm.name" label="Имя исполнителя" required />
        <template v-if="editingId"><UiSelect v-model="artistForm.statusCode" label="Статус" :options="artistStatusOptions" /><UiTextarea v-model="artistForm.description" label="Описание" rows="4" /></template>
        <template #actions><UiButton variant="ghost" @click="artistDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template>
      </UiForm>
    </UiDialog>

    <UiDialog v-model="albumDialog" :title="editingId ? 'Изменить альбом' : 'Новый альбом'" size="lg" sticky-footer>
      <UiForm :loading="saving" :error="error" @submit="saveAlbum">
        <UiInput v-model="albumForm.title" label="Название альбома" required />
        <UiSelect v-if="!editingId" v-model="albumArtistId" label="Исполнитель" :options="[{label: 'Добавить позже', value: ''}, ...artistOptions]" />
        <template v-else><div class="mc-form-grid"><UiSelect v-model="albumForm.statusCode" label="Статус" :options="options(refs.statuses)" /><UiInput v-model="albumForm.releaseDate" label="Дата релиза" type="date" /></div><UiCard title="Исполнители"><div class="admin-check-grid"><UiCheckbox v-for="artist in artistOptions" :key="artist.value" v-model="albumForm.artistIds" :value="artist.value" :label="artist.label" /></div></UiCard></template>
        <template #actions><UiButton variant="ghost" @click="albumDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template>
      </UiForm>
    </UiDialog>

    <UiDialog v-model="trackDialog" :title="editingId ? 'Изменить трек' : 'Загрузить музыку'" size="lg" sticky-footer>
      <UiForm v-if="!editingId" :loading="saving" :error="error" @submit="saveQuickTrack">
        <UiFilePicker v-model="quickTrack.file" :accept="audioAccept" :max-size="536870912" label="Выберите MP3 или другой аудиофайл" description="MP3, M4A, FLAC, WAV или OGG" />
        <div class="mc-form-grid">
          <UiInput v-model="quickTrack.title" label="Название трека" hint="Заполнится из имени файла; можно изменить" />
          <UiSelect v-model="quickTrack.artistId" label="Исполнитель" :options="[{label: 'Без исполнителя', value: ''}, ...artistOptions]" />
          <UiSelect v-model="quickTrack.albumId" label="Альбом" :options="albumOptions" />
        </div>
        <p class="mc-text-sm">После загрузки трек появится в Mecorion Music.</p>
        <template #actions><UiButton variant="ghost" @click="trackDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving" :disabled="!quickTrack.file">Загрузить музыку</UiButton></template>
      </UiForm>
      <UiForm v-else :loading="saving" :error="error" @submit="saveTrack">
        <div class="mc-form-grid"><UiInput v-model="trackForm.title" label="Название" required /><UiSelect v-model="trackForm.statusCode" label="Статус" :options="options(refs.statuses)" /><UiSelect v-model="trackForm.albumId" label="Альбом" :options="albumOptions" /><UiInput v-model="trackForm.trackNumber" label="Номер трека" type="number" min="1" /><UiInput v-model="trackForm.discNumber" label="Номер диска" type="number" min="1" /></div>
        <UiCard title="Исполнители"><div class="admin-check-grid"><UiCheckbox v-for="artist in artistOptions" :key="artist.value" v-model="trackForm.artistIds" :value="artist.value" :label="artist.label" /></div></UiCard>
        <template #actions><UiButton variant="ghost" @click="trackDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template>
      </UiForm>
    </UiDialog>

    <UiDialog v-model="uploadDialog" :title="uploadKind === 'audio' ? 'Загрузить аудиофайл' : 'Загрузить обложку'" size="lg"><UiForm :loading="saving" :error="error" @submit="saveUpload"><UiFilePicker v-model="uploadFile" :accept="uploadKind === 'audio' ? audioAccept : 'image/jpeg,image/png,image/webp,image/avif'" :max-size="uploadKind === 'audio' ? 536870912 : 20971520" :label="uploadKind === 'audio' ? 'Выберите исходный аудиофайл' : 'Выберите квадратную обложку'" hint="Файл будет сохранён в data/music и зарегистрирован в media pipeline." /><template #actions><UiButton variant="ghost" @click="uploadDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving" :disabled="!uploadFile">Загрузить</UiButton></template></UiForm></UiDialog>

    <UiDialog v-model="lyricsDialog" title="Текст песни" size="xl" sticky-footer><UiForm :loading="saving" :error="error" @submit="saveLyrics"><div class="mc-form-grid"><UiSelect v-model="lyricsForm.languageCode" label="Язык" :options="options(refs.languages)" /><UiSelect v-model="lyricsForm.type" label="Версия" :options="[{label: 'Оригинал', value: 'ORIGINAL'}, {label: 'Перевод', value: 'TRANSLATION'}, {label: 'Романизация', value: 'ROMANIZATION'}]" /><UiCheckbox v-model="lyricsForm.isPrimary" label="Основной текст" /></div><UiTextarea v-model="lyricsForm.text" label="Текст" rows="16" required /><template #actions><UiButton variant="ghost" @click="lyricsDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить</UiButton></template></UiForm></UiDialog>

    <UiDialog v-model="albumTracksDialog" title="Состав альбома" description="Порядок выбранных треков становится порядком альбома." size="xl"><UiForm :loading="saving" :error="error" @submit="saveAlbumTracks"><div class="admin-check-grid mc-scroll"><UiCheckbox v-for="track in tracks" :key="track.id" v-model="albumTrackIds" :value="track.id" :label="track.title" :description="track.artists.map(artist => artist.name).join(', ')" /></div><template #actions><UiButton variant="ghost" @click="albumTracksDialog = false">Отмена</UiButton><UiButton type="submit" variant="primary" :loading="saving">Сохранить состав</UiButton></template></UiForm></UiDialog>
  </div>
</template>
