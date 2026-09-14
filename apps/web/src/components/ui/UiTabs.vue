<script setup>
const model = defineModel({type: String, required: true});
const props = defineProps({items: {type: Array, required: true}, orientation: {type: String, default: "horizontal"}});
</script>

<template>
  <div class="ui-tabs" :class="`ui-tabs--${props.orientation}`" role="tablist" :aria-orientation="props.orientation">
    <button
      v-for="item in props.items"
      :key="item.value"
      class="ui-tabs__trigger"
      :class="{'ui-tabs__trigger--active': model === item.value}"
      type="button"
      role="tab"
      :aria-selected="model === item.value"
      @click="model = item.value"
    >
      <span>{{ item.label }}</span><small v-if="item.count !== undefined">{{ item.count }}</small>
    </button>
  </div>
</template>
