<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, resolveComponent} from "vue";

const props = defineProps({
  items: {type: Array, default: () => []},
  separator: {type: String, default: "›"},
  maxItems: {type: Number, default: 0},
  ariaLabel: {type: String, default: "Хлебные крошки"},
});

const root = ref(null);
const menu = ref(null);
const activeMenu = ref("");
const menuItems = ref([]);
const menuPosition = ref({top: "0px", left: "0px"});

const entries = computed(() => {
  if (props.maxItems < 3 || props.items.length <= props.maxItems) return props.items.map((item, index) => ({type: "item", item, index}));
  const tailCount = props.maxItems - 2;
  const tailStart = props.items.length - tailCount;
  return [
    {type: "item", item: props.items[0], index: 0},
    {type: "ellipsis", items: props.items.slice(1, tailStart), index: 1},
    ...props.items.slice(tailStart).map((item, offset) => ({type: "item", item, index: tailStart + offset})),
  ];
});

function isCurrent(entry) {
  return entry.item.current ?? entry.index === props.items.length - 1;
}

function itemComponent(item) {
  if (item.to) return resolveComponent("NuxtLink");
  if (item.href) return "a";
  return "span";
}

async function openMenu(key, items, event) {
  if (activeMenu.value === key) return closeMenu();
  activeMenu.value = key;
  menuItems.value = items;
  const anchor = event.currentTarget.getBoundingClientRect();
  await nextTick();
  if (!menu.value) return;
  const popup = menu.value.getBoundingClientRect();
  const margin = 8;
  const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - popup.width - margin));
  const below = anchor.bottom + 6;
  const top = below + popup.height <= window.innerHeight - margin ? below : anchor.top - popup.height - 6;
  menuPosition.value = {top: `${Math.max(margin, top)}px`, left: `${left}px`};
}

function closeMenu() {
  activeMenu.value = "";
  menuItems.value = [];
}

function handleOutside(event) {
  if (!root.value?.contains(event.target) && !menu.value?.contains(event.target)) closeMenu();
}

function handleKeydown(event) {
  if (event.key === "Escape") closeMenu();
}

onMounted(() => {
  document.addEventListener("pointerdown", handleOutside);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", closeMenu);
  window.addEventListener("scroll", closeMenu, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleOutside);
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", closeMenu);
  window.removeEventListener("scroll", closeMenu, true);
});
</script>

<template>
  <nav ref="root" class="ui-breadcrumb" :aria-label="props.ariaLabel">
    <ol class="ui-breadcrumb__list">
      <template v-for="(entry, displayIndex) in entries" :key="entry.type === 'item' ? entry.index : 'ellipsis'">
        <li v-if="displayIndex" class="ui-breadcrumb__separator" aria-hidden="true">
          <slot name="separator">{{ props.separator }}</slot>
        </li>
        <li v-if="entry.type === 'ellipsis'" class="ui-breadcrumb__item">
          <button class="ui-breadcrumb__ellipsis" type="button" aria-label="Показать скрытые разделы" :aria-expanded="activeMenu === 'ellipsis'" @click="openMenu('ellipsis', entry.items, $event)">
            <slot name="ellipsis">•••</slot>
          </button>
        </li>
        <li v-else class="ui-breadcrumb__item">
          <button v-if="entry.item.children?.length" class="ui-breadcrumb__link ui-breadcrumb__dropdown-trigger" type="button" :aria-expanded="activeMenu === `item-${entry.index}`" @click="openMenu(`item-${entry.index}`, entry.item.children, $event)">
            {{ entry.item.label }}<span aria-hidden="true">⌄</span>
          </button>
          <span v-else-if="isCurrent(entry)" class="ui-breadcrumb__page" aria-current="page">{{ entry.item.label }}</span>
          <component v-else :is="itemComponent(entry.item)" class="ui-breadcrumb__link" :to="entry.item.to || undefined" :href="entry.item.href || undefined" :target="entry.item.target || undefined" :rel="entry.item.target === '_blank' ? 'noopener noreferrer' : undefined">
            <slot name="item" :item="entry.item" :index="entry.index">{{ entry.item.label }}</slot>
          </component>
        </li>
      </template>
    </ol>
  </nav>
  <Teleport to="body">
    <div v-if="activeMenu" ref="menu" class="ui-breadcrumb__menu" :style="menuPosition" role="menu">
      <component v-for="(item, index) in menuItems" :is="itemComponent(item)" :key="item.label ?? index" class="ui-breadcrumb__menu-item" :to="item.to || undefined" :href="item.href || undefined" :target="item.target || undefined" :rel="item.target === '_blank' ? 'noopener noreferrer' : undefined" role="menuitem" @click="closeMenu">
        {{ item.label }}
      </component>
    </div>
  </Teleport>
</template>
