<script setup>
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps({
  item: {type: Object, required: true},
  itemKey: {type: String, required: true},
  state: {type: Object, required: true},
});
const emit = defineEmits(["activate"]);
</script>

<template>
  <li v-if="item.type === 'separator'" class="ui-dropdown-menu__separator" role="separator"></li>
  <li v-else-if="item.type === 'label'" class="ui-dropdown-menu__label" role="presentation">{{ item.label }}</li>
  <li v-else-if="item.type === 'submenu'" class="ui-dropdown-menu__sub">
    <button class="ui-dropdown-menu__item" type="button" role="menuitem" data-dropdown-item aria-haspopup="menu" :disabled="item.disabled">
      <SvgIcon v-if="item.icon" :name="item.icon" class="ui-dropdown-menu__icon" />
      <span class="ui-dropdown-menu__item-label">{{ item.label }}</span>
      <span class="ui-dropdown-menu__submenu-arrow" aria-hidden="true">›</span>
    </button>
    <ul class="ui-dropdown-menu__menu ui-dropdown-menu__submenu" role="menu">
      <UiDropdownMenuNode
        v-for="(child, index) in item.items || []"
        :key="child.id || `${itemKey}-${index}`"
        :item="child"
        :item-key="String(child.id || `${itemKey}-${index}`)"
        :state="state"
        @activate="emit('activate', $event)"
      />
    </ul>
  </li>
  <li v-else role="none">
    <button
      class="ui-dropdown-menu__item"
      :class="{'ui-dropdown-menu__item--danger': item.variant === 'danger'}"
      type="button"
      :role="item.type === 'checkbox' ? 'menuitemcheckbox' : item.type === 'radio' ? 'menuitemradio' : 'menuitem'"
      :aria-checked="item.type === 'checkbox' || item.type === 'radio' ? Boolean(state[itemKey]) : undefined"
      :disabled="item.disabled"
      data-dropdown-item
      @click="emit('activate', {item, itemKey})"
    >
      <span v-if="item.type === 'checkbox' || item.type === 'radio'" class="ui-dropdown-menu__indicator" aria-hidden="true">{{ state[itemKey] ? (item.type === 'radio' ? '●' : '✓') : '' }}</span>
      <SvgIcon v-if="item.icon" :name="item.icon" class="ui-dropdown-menu__icon" />
      <span class="ui-dropdown-menu__item-label">{{ item.label }}</span>
      <span v-if="item.shortcut" class="ui-dropdown-menu__shortcut">{{ item.shortcut }}</span>
    </button>
  </li>
</template>
