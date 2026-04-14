<template>
  <DefaultTheme.Layout>
    <template
      v-if="isDocsHomePage"
      #home-hero-image
    >
      <HomepageChatDemo />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DefaultTheme from 'vitepress/theme';
import { useRoute } from 'vitepress';
import HomepageChatDemo from './components/HomepageChatDemo.vue';

const route = useRoute();

const isDocsHomePage = computed(() => route.path === '/');
</script>
