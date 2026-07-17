<script setup>
import MainSidebar from "../components/layout/MainSidebar.vue";
import MainHeader from "../components/layout/MainHeader.vue";
</script>

<template>
  <div class="main-layout">
    <MainSidebar />
    <main>
      <MainHeader />
      <section>
        <router-view />
      </section>
    </main>
  </div>
</template>