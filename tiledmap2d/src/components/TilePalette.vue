<script setup>
defineProps({
  types: { type: Array, required: true },
  selectedId: { type: Number, required: true },
})

const emit = defineEmits(['select'])
</script>

<template>
  <aside class="palette win-panel">
    <div class="palette-title">调色板</div>
    <div class="palette-grid">
      <button
        v-for="t in types"
        :key="t.id"
        type="button"
        class="swatch"
        :class="{ active: selectedId === t.id }"
        :title="t.name"
        @click="emit('select', t.id)"
      >
        <span
          v-if="t.color"
          class="swatch-fill"
          :style="{ background: t.color }"
        />
        <span v-else class="swatch-empty">空</span>
        <span class="swatch-label">{{ t.name }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.palette {
  width: 168px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}
.palette-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--win-text-secondary);
}
.palette-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.swatch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  background: var(--win-surface);
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: var(--win-text);
}
.swatch:hover {
  background: var(--win-hover);
}
.swatch.active {
  outline: 2px solid var(--win-accent);
  outline-offset: -1px;
  background: var(--win-list-active);
}
.swatch-fill {
  width: 28px;
  height: 28px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}
.swatch-empty {
  width: 28px;
  height: 28px;
  border-radius: 2px;
  border: 1px dashed var(--win-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--win-text-secondary);
  flex-shrink: 0;
}
.swatch-label {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
