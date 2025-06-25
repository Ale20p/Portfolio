<template>
  <svg v-for="i in 15" :key="i" class="svg" width="82" height="60" viewBox="0 0 82 60" xmlns="http://www.w3.org/2000/svg">
    <path d="M53.5576 31.0098L54.0039 31.5H78.6045L54.666 57.7725L28.4424 28.9902L27.9961 28.5H3.39551L27.333 2.22656L53.5576 31.0098Z" fill="none" stroke-width="7"/>
  </svg>
  <div class="entire-body">
    <div class="projects-section">
      
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>
html, body {
  overflow: hidden;
}

.entire-body {
  position: relative;
  display: flex; /* Without this, align-items and justify-content do not take affect. */
  background-size: 100% auto;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

</style>

<style lang="scss" scoped>
$gold: var(--accent-color);
$white: var(--text-color);
$total: 15;

.svg {
  position: absolute;
  bottom: 0;       // off-screen below
  transform-style: preserve-3d;
}

@for $i from 1 through $total {
  $scale: random(2) - .4;

  .svg:nth-child(#{$i}) {
    left: random(120) * 1% - 10;
    animation: raise#{$i} 6 + random(10) +s linear infinite;
    animation-delay: random(4) - 4 + s;
    transform: scale(.3 * $i - .6) rotate(random(360) + deg);
    z-index: $i - 7;
    filter: blur($i - 6 + px);
    stroke: if($i % 2 == 0, $white, $gold);

    @keyframes raise#{$i} {
      to {
        bottom: 150vh;
        transform: scale(.3 * $i - .6) rotate(random(360) + deg);
      }
    }
  }
}
</style>