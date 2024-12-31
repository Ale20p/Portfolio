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
  background-image: url(~/assets/images/home-background.jpg);
  background-position: center;
}

.middle-of-page {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 40%;
  width: 50%;
  background-color: var(--secondary-color);
  border: none; /* No solid border */
  box-shadow: 0 0 30px 10px var(--accent-color), /* Gold glow */
              0 0 60px 0px var(--background-color); /* Fades into page background */
}

.middle-of-page > * {
  flex-shrink: 1; /* Allow elements to shrink dynamically */
  max-width: 100%; /* Prevent overflowing horizontally */
}

.middle-of-page h1 {
  margin-bottom: 25px;
}

.middle-of-page p {
  margin-top: 0;
}

h1 {
  font-size: 10vh;
}

p {
  font-size: 2.5vh;
}
</style>