<template>
  <svg v-for="i in 15" :key="i" class="svg" width="82" height="60" viewBox="0 0 82 60" xmlns="http://www.w3.org/2000/svg">
    <path d="M53.5576 31.0098L54.0039 31.5H78.6045L54.666 57.7725L28.4424 28.9902L27.9961 28.5H3.39551L27.333 2.22656L53.5576 31.0098Z" fill="none" stroke-width="7"/>
  </svg>
  <div class="entire-body">
    <div class="projects-section">
      <div class="project1">
        <h2 class="project-title">PendulumSim</h2>
        <div class="title-underline"></div>
        <p class="project-intro"> PendulumSim is a physics simulator based on the college physics principles of the motion of a simple pendulum. </p>
      </div>
      <div class="project2">
        <h2 class="project-title">OnlineBankingManagementConsoleSim</h2>
        <div class="title-underline"></div>
      </div>
      <div class="project3"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>
html, body {
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0;
}

.entire-body {
  position: relative;
  display: flex; /* Without this, align-items and justify-content do not take affect. */
  background-size: 100% auto;
  /* min-height: 200vh; */
  margin: 0;
  padding-top: 100px;
  padding-bottom: 100px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.projects-section {
  display: flex;
  flex-direction: column;
  gap: 125px;
  align-items: center;
  z-index: 100;
}

.project1, .project2, .project3 {
  width: 850px;
  height: 350px;
  background-color: var(--primary-color);
  clip-path: polygon(
    0 0,            /* top-left */
    90% 0,          /* top-right cut starts here */
    100% 10%,       /* top-right cut */
    100% 100%,      /* bottom-right */
    10% 100%,       /* bottom-left cut */
    0 90%           /* bottom-left cut continues */
  );
}

.project-title {
  margin-left: 2rem;
}

.title-underline {
  background-color: var(--accent-color);
  width: 110px;
  height: 3px;
  margin: -10px 30px auto;
}

.project-intro {
  margin-left: 2rem;

}

</style>

<style lang="scss" scoped>
$gold: var(--accent-color);
$white: var(--text-color);
$total: 15;

.svg {
  position: fixed;
  bottom: 0;       // off-screen below
  pointer-events: none;
  transform-style: preserve-3d;
}

@for $i from 1 through $total {
  $scale: random(2) - .4;

  .svg:nth-child(#{$i}) {
    left: random(100) * 1%;
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