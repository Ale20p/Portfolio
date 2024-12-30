<template>
  <div class="default-layout">
    <MainHeader />
    <NuxtPage /> 
  </div>
</template>

<script lang="ts" setup>
import MainHeader from '~/components/MainHeader.vue';

</script>

<style>
.default-layout {
  background-color: var(--background-color);
  color: var(--text-color);
  height: 100vh;
}
</style>