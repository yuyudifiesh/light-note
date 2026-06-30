<script setup>
import { ref } from 'vue'

const currentYear = ref(new Date().getFullYear())
</script>

<template>
  <footer class="global-footer" @mousedown.stop>
    <span class="copyright-text">
      Copyright © {{ currentYear }} Vilinko. All Rights Reserved.
    </span>
  </footer>
</template>

<style scoped>
.global-footer {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: none;
}

.copyright-text {
  display: inline-block;
  margin: 0;
  padding: 6px 16px;
  font-size: 11px;
  color: #8b7355;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  letter-spacing: 0.5px;
  
  background: rgba(245, 240, 235, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  border: 1px solid rgba(139, 115, 85, 0.15);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  
  pointer-events: auto;
  user-select: none !important;
}
</style>