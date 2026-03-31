<script setup>
defineProps({
  message: { type: String, default: '' },
  cursorText: { type: String, default: '' },
  zoomText: { type: String, default: '' },
  /** 悬停提示：点击打开日志 */
  logHint: { type: String, default: '' },
})

const emit = defineEmits(['open-log'])
</script>

<template>
  <footer
    class="statusbar"
    role="button"
    tabindex="0"
    :title="logHint || undefined"
    @click="emit('open-log')"
    @keydown.enter.prevent="emit('open-log')"
    @keydown.space.prevent="emit('open-log')"
  >
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
  min-height: 22px;
  padding: 2px 10px;
  font-size: 12px;
  color: var(--win-text-secondary);
  background: var(--win-chrome);
  border-top: 1px solid var(--win-status-inset-bottom);
  box-shadow: inset 0 1px 0 var(--win-status-inset-top);
  cursor: pointer;
  user-select: none;
}
.statusbar:hover {
  background: var(--win-hover);
}
.statusbar:focus-visible {
  outline: 1px dotted var(--win-text);
  outline-offset: -2px;
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
