<template>
  <div class="homepage-chat-demo">
    <div ref="mountElement" class="homepage-chat-demo__mount" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { mountHomepageChatDemo } from "./homepageChatDemo";

const mountElement = ref<HTMLDivElement | null>(null);
let cleanupMount: (() => void) | undefined;

onMounted(() => {
  if (!mountElement.value) {
    return;
  }

  cleanupMount = mountHomepageChatDemo(mountElement.value);
});

onBeforeUnmount(() => {
  cleanupMount?.();
  cleanupMount = undefined;
});
</script>
