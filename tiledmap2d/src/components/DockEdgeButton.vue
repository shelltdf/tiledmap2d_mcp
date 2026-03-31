<script setup>
defineProps({
  label: { type: String, required: true },
  expandTitle: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
})

defineEmits(['expand'])
</script>

<template>
  <button
    type="button"
    class="dock-edge-btn win-btn"
    :title="expandTitle || `展开${label}`"
    :aria-label="ariaLabel || `展开${label}停靠面板`"
    @click="$emit('expand')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.dock-edge-btn {
  flex: 1 1 0;
  min-height: 48px;
  width: 100%;
  padding: 6px 2px;
  font-size: 11px;
  font-weight: 600;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.08em;
  border-radius: 4px;
  line-height: 1.2;
}
</style>
