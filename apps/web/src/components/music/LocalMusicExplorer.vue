<script setup>
import {computed, ref, watch} from "vue";
import {useMusicPlayerStore} from "@/stores/musicPlayer.js";
import {formatPlaybackTime} from "@/utils/music.js";

const props = defineProps({
  tracks: {type: Array, required: true},
  rootName: {type: String, required: true},
});

const player = useMusicPlayerStore();
const selectedFolders = ref([]);

function buildTree(tracks) {
  const root = {name: props.rootName, path: "", type: "directory", children: []};

  tracks.forEach((track) => {
    const pathParts = track.relativePath.split("/").filter(Boolean);
    const filename = pathParts.pop() || track.filename;
    let directory = root;

    pathParts.forEach((part) => {
      let child = directory.children.find((item) => item.type === "directory" && item.name === part);
      if (!child) {
        child = {
          name: part,
          path: [...directory.path.split("/").filter(Boolean), part].join("/"),
          type: "directory",
          children: [],
        };
        directory.children.push(child);
      }
      directory = child;
    });

    directory.children.push({name: filename, path: track.relativePath, type: "file", track});
  });

  function sortTree(node) {
    node.children?.sort((left, right) => {
      if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
      return left.name.localeCompare(right.name, "ru");
    });
    node.children?.filter((item) => item.type === "directory").forEach(sortTree);
    return node;
  }

  return sortTree(root);
}

const tree = computed(() => buildTree(props.tracks));
const columns = computed(() => {
  const result = [tree.value.children];
  selectedFolders.value.forEach((folder) => result.push(folder.children));
  return result;
});

function selectEntry(entry, columnIndex) {
  if (entry.type === "file") {
    player.playTrack(entry.track.id, props.tracks.map((track) => track.id));
    return;
  }

  // При выборе другой папки в одной из предыдущих колонок Finder должен
  // отбросить все более глубокие уровни навигации.
  selectedFolders.value.splice(columnIndex);
  selectedFolders.value.push(entry);
}

function openBreadcrumb(index) {
  if (index < 0) selectedFolders.value = [];
  else selectedFolders.value = selectedFolders.value.slice(0, index + 1);
}

watch(() => props.rootName, () => { selectedFolders.value = []; });
</script>

<template>
  <section class="memusic-finder">
    <nav class="memusic-finder__breadcrumb" aria-label="Путь к папке">
      <button type="button" @click="openBreadcrumb(-1)">⌂ {{ rootName }}</button>
      <template v-for="(folder, index) in selectedFolders" :key="folder.path">
        <span>/</span><button type="button" @click="openBreadcrumb(index)">{{ folder.name }}</button>
      </template>
    </nav>

    <div class="memusic-finder__columns">
      <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="memusic-finder__column">
        <button
          v-for="entry in column"
          :key="entry.path"
          class="memusic-finder__entry"
          :class="{
            'is-selected': entry.type === 'directory' && selectedFolders[columnIndex]?.path === entry.path,
            'is-playing': entry.type === 'file' && player.currentTrackId === entry.track.id
          }"
          type="button"
          @click="selectEntry(entry, columnIndex)"
        >
          <span class="memusic-finder__entry-icon" aria-hidden="true">{{ entry.type === 'directory' ? '▰' : '♪' }}</span>
          <span class="memusic-finder__entry-name">
            <strong>{{ entry.type === 'file' ? entry.track.title : entry.name }}</strong>
            <small v-if="entry.type === 'file'">{{ entry.track.artist }}</small>
            <small v-else>{{ entry.children.length }} элементов</small>
          </span>
          <span v-if="entry.type === 'file'" class="memusic-finder__entry-meta">{{ formatPlaybackTime(entry.track.duration) }}</span>
          <span v-else class="memusic-finder__entry-meta" aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  </section>
</template>
