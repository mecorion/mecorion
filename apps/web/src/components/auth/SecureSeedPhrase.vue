<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
import SvgIcon from "@/components/SvgIcon.vue";

defineProps({words: {type: Array, required: true}});

const concealed = ref(false);
let concealTimer;

function conceal() {
  concealed.value = true;
}

function reveal() {
  window.clearTimeout(concealTimer);
  concealTimer = window.setTimeout(() => {
    if (document.visibilityState === "visible" && document.hasFocus()) concealed.value = false;
  }, 250);
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") conceal();
  else reveal();
}

function preventExtraction(event) {
  event.preventDefault();
}

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", conceal);
  window.addEventListener("focus", reveal);
  window.addEventListener("beforeprint", conceal);
});

onBeforeUnmount(() => {
  window.clearTimeout(concealTimer);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("blur", conceal);
  window.removeEventListener("focus", reveal);
  window.removeEventListener("beforeprint", conceal);
});
</script>

<template>
  <section
    class="seed-secret"
    :class="{'is-concealed': concealed}"
    aria-label="Ваша SeedPhrase"
    @copy="preventExtraction"
    @cut="preventExtraction"
    @contextmenu="preventExtraction"
    @dragstart="preventExtraction"
  >
    <div class="seed-secret__content">
      <div class="seed-secret__warning">
        <SvgIcon name="shield" />
        <p><strong>Запишите слова на бумаге</strong><span>Не сохраняйте SeedPhrase в заметках, облаке или менеджере паролей.</span></p>
      </div>
      <ol class="seed-secret__words">
        <li v-for="(word, index) in words" :key="index">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ word }}</strong>
        </li>
      </ol>
    </div>
    <div class="seed-secret__shield" aria-live="polite">
      <SvgIcon name="shield" />
      <strong>SeedPhrase скрыта</strong>
      <span>Вернитесь на страницу, когда рядом никого нет.</span>
    </div>
  </section>
</template>
