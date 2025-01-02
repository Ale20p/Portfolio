<template>
  <div class="entire-body">
    <div class="projects-section">

    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>
.entire-body {
  display: flex; /* Without this, align-items and justify-content do not take affect. */
  background: url(~/assets/images/projects-top-gold.jpg) top no-repeat,
              url(~/assets/images/projects-dark-part.jpg) center repeat-y,
              url(~/assets/images/projects-bottom-gold.jpg) bottom no-repeat;
  background-size: 100% auto;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
}

.projects-section {
  position: relative;
  min-height: 100vh;
  width: 60%;
  background-color: var(--projects-color);
}
</style>