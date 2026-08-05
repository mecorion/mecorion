<script setup>
defineProps({
  title: {type: String, required: true},
  description: {type: String, required: true},
  mode: {
    type: String,
    default: "signin",
    validator: (value) => ["signin", "signup"].includes(value),
  },
});
</script>

<template>
  <section class="auth-visual" :class="`auth-visual--${mode}`" aria-label="Mecorion services preview">
    <div class="auth-visual__copy">
      <span class="auth-visual__brand"><i>M</i> Mecorion</span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div class="auth-visual__scene" aria-hidden="true">
      <div class="auth-orbit auth-orbit--outer"></div>
      <div class="auth-orbit auth-orbit--inner"></div>
      <div class="auth-panel auth-panel--main">
        <span></span><span></span><span></span>
      </div>
      <div class="auth-panel auth-panel--small">
        <strong>{{ mode === 'signin' ? 'Music' : 'Cloud' }}</strong>
        <span></span>
      </div>
      <div class="auth-meter"><i></i><i></i><i></i><i></i></div>
      <div class="auth-person auth-person--left"></div>
      <div class="auth-person auth-person--right"></div>
      <div class="auth-node auth-node--one">♪</div>
      <div class="auth-node auth-node--two">{{ mode === 'signin' ? '▶' : '✓' }}</div>
      <div class="auth-node auth-node--three">{{ mode === 'signin' ? 'Aa' : '☁' }}</div>
    </div>
  </section>
</template>
