<script setup>
defineProps({
  message: { type: String, default: '' },
  cursorText: { type: String, default: '' },
  zoomText: { type: String, default: '' },
})
</script>

<template>
  <footer class="statusbar">
    <span class="status-left">{{ message }}</span>
    <span class="status-right">
      <span v-if="cursorText">{{ cursorText }}</span>
      <span v-if="zoomText" class="zoom">{{ zoomText }}</span>
    </span>
  </footer>
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  padding: 2px 12px;
  font-size: 12px;
  color: var(--win-text-secondary);
  background: var(--win-chrome);
  border-top: 1px solid var(--win-border);
}
.status-left {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-right {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.zoom {
  font-variant-numeric: tabular-nums;
}
</style>
