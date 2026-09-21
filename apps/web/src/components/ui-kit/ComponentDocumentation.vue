<script setup>
defineProps({
  title: {type: String, required: true},
  description: {type: String, required: true},
  types: {type: Array, default: () => []},
  usage: {type: String, required: true},
});
</script>

<template>
  <article class="uikit-docs" :aria-labelledby="`docs-${title}`">
    <div class="uikit-docs__intro">
      <p class="mc-caption mc-accent">Документация</p>
      <h2 :id="`docs-${title}`" class="mc-title-2">{{ title }}</h2>
      <p class="mc-text">{{ description }}</p>
    </div>

    <section class="uikit-docs__section">
      <h3 class="mc-title-3">Типы и состояния</h3>
      <ul>
        <li v-for="item in types" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section class="uikit-docs__section">
      <h3 class="mc-title-3">Как использовать</h3>
      <pre><code>{{ usage }}</code></pre>
    </section>
  </article>
</template>
