<template>
  <div class="main-page">
    <div class="middle-of-page">
      <h1>Alessandro Pomponi</h1>

      <p>Computer Science Student</p>
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>
.main-page {
  display: flex;
  flex-direction: column;
  /* Fill the entire viewport: */
  height: 100vh;
  /* Center child elements both horizontally and vertically: */
  justify-content: center;
  align-items: center;
}

.middle-of-page {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 40%;
  width: 50%;
  background-color: var(--secondary-color);
}
</style>