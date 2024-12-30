<template>
  <header class="header">
    <div class="container">
      <nav class="nav">
        <ul>
          <li><NuxtLink to="/">Home</NuxtLink></li>
          <li><NuxtLink to="/about">About Me</NuxtLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script lang="ts" setup>

</script>

<style>
.header {
  position: fixed;
  background-color: var(--primary-color);
  width: 100%;
  z-index: 1000;
  text-align: center;
  display: flex;
  justify-content: space-evenly;
  top: 0;
}

.nav ul {
  display: flex;
  list-style: none; /* Remove bullets */
  margin: 0; /* Remove default margin */
  padding: 0; /* Remove default padding */
}

.nav li {
  margin: 0 10px; /* Add space between menu items */
}

.nav a {
  text-decoration: none; /* Remove underline */
  color: white; /* Link color */
  font-size: 18px;
}

.nav a:hover {
  color: var(--accent-color); /* Change color on hover */
}
</style>