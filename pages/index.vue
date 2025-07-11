<template>
  <div class="main-page">
    <div class="middle-of-page">
      <!-- The SVG is sized to fill the container and has a 100x85 viewBox, so we can easily calculate a rectangle perimeter = 2*(100+85) = 370. -->
      <svg class="svg-border" viewBox="0 0 100 85" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Path starts at bottom left corner (0, 85), goes to bottom right corner (100, 85), then goes top right (100, 0), then to top left (0, 0), and then back down to close. -->
        <!-- All work in (x,y), L: line to, M: start point, Z: back to start -->
        <path class="border-of-middle" d="M 10,85 L 90,85 L 100,85 L 100,0 L 0,0 L 0,85 Z" />
      </svg>
      <div class="text">
        <NuxtLink class="link-about" to="/about">
          <h1 class="myname">Alessandro Pomponi</h1>

          <p class="titles">Software Engineering Undergraduate Student</p>
        </NuxtLink>
      </div>
    </div>
    <div class="bottom-streak">
      <svg class="streak-svg" preserveAspectRatio="none" width="576" height="197" viewBox="0 0 576 197" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="movingGradient" x1="0" y1="0" x2="576" y2="0"
                          gradientUnits="userSpaceOnUse"
                          spreadMethod="repeat"
                          :gradientTransform="gradientTransform"
                          ref="grandientRef">
            <stop offset="0%" stop-color="var(--accent-color)" />
            <stop offset="30%"   stop-color="var(--background-color)" />
            <stop offset="100%" stop-color="var(--accent-color)" />
          </linearGradient>
        </defs>
        <path d="M1 196H575V75.1156C333.586 200.705 207.964 184.161 1 2M1 196C1 196 3.34315 77.7617 1 2M1 196V2" fill="url(#movingGradient)"/>
      </svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, onBeforeUnmount} from 'vue'

const translateX = ref(0)
const speed = 0.5 // pixels per frame
let animationFrame: number

const animateGradient = () => {
  translateX.value = (translateX.value + speed) % 576
  animationFrame = requestAnimationFrame(animateGradient)
}

onMounted(() => {
  animationFrame = requestAnimationFrame(animateGradient)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
})

const gradientTransform = computed(() => 
  isNaN(translateX.value) ? '' : `translate(${translateX.value}, 0)`
) 
</script>

<style>
.main-page {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Fill the entire viewport */
  justify-content: center; /* Center child elements both horizontally and vertically: */
  align-items: center;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  position: relative;
  overflow: hidden;
}

.streak-svg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 90px;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
}



.streak-path {
  fill:var(--accent-color);
}

.middle-of-page {
  top: -10%;
  position: relative;
  text-align: center;
  height: 30%;
  width: 50%;
  background-color: transparent;
  margin: 0 auto;
}


/* Absolutely position the svg to fill the .middle-of-page container */
.svg-border {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

/* The 'draw border' styles */
.border-of-middle {
  fill: none;
  stroke: var(--accent-color);
  /* The perimeter for the 100x85 viewbox is 370, so -> */
  stroke-dasharray: 370; /* This defines the stroke outline of the shape as a dashed pattern */
  stroke-dashoffset: 290; /* Offsets the stroke of the dash pattern */
                          /* make -80 of the perimeter in order to show bottom line, so hides everything except first 100 of perimeter */
  stroke-width: 4%;
  transition: stroke-dashoffset 0.5s linear,
              stroke-width 0.5s linear;
}

/* Text layering above the svg */
.text {
  position: relative;
  z-index: 1; /* Ensures the text stays above the svg */
}

/* On hover, animate from dashoffset=370 to dashoffset=0. */
.middle-of-page:hover .border-of-middle{
  stroke-dashoffset: 0; /* Reveals the entire perimeter */
  stroke-width: 2.5%;
}

/* Styling for link */
.link-about {
  color: var(--text-color);
  text-decoration: none; /* no underline */
}

.middle-of-page > * {
  flex-shrink: 1; /* Allow elements to shrink dynamically */
  max-width: 100%; /* Prevent overflowing horizontally */
}

.myname {
  font-size: 10vh;
  margin-bottom: 25px;
}

.titles {
  font-size: 2.5vh;
  margin-top: 0;
}
</style>

