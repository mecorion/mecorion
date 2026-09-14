<script setup>
const model = defineModel({type: Boolean, default: false});
const props = defineProps({label: {type: String, default: ""}, description: {type: String, default: ""}});
</script>

<template>
  <label class="mc-checkbox ui-checkbox">
    <input v-bind="$attrs" v-model="model" type="checkbox" />
    <span aria-hidden="true">✓</span>
    <span class="ui-checkbox__copy">
      <strong>{{ props.label }}</strong>
      <small v-if="props.description">{{ props.description }}</small>
    </span>
  </label>
</template>
