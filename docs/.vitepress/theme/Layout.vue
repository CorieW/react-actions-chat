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
import { useData } from 'vitepress';
import HomepageChatDemo from './components/HomepageChatDemo.vue';

const { frontmatter, page } = useData();

const isDocsHomePage = computed(() => {
  return frontmatter.value.layout === 'home' && page.value.relativePath === 'index.md';
});
</script>
