<script setup>
import BooksServiceView from "@/components/books/BooksServiceView.vue";
import {getBookServicePublications} from "@/spaces/spaces.mock.js";
definePageMeta({
  workspace: true,
  requiresAuth: true,
  validate: route => ['library', 'bookmarks', 'search'].includes(route.params.section) || getBookServicePublications().some(book => book.id === route.params.section),
});
</script>

<template><BooksServiceView /></template>