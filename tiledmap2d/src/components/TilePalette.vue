<script setup>
defineProps({
  types: { type: Array, required: true },
  selectedId: { type: Number, required: true },
})

const emit = defineEmits(['select', 'import-types', 'edit-type', 'delete-type'])

/** 中键：不触发左键 click，在此单独选中并避免浏览器默认行为 */
function onMiddlePointerDown(e, id) {
  if (e.button !== 1) return
  e.preventDefault()
  emit('select', Number(id))
}

function onImportFile(e) {
  const input = e.target
  const f = input.files?.[0]
  input.value = ''
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    emit('import-types', String(reader.result ?? ''))
  }
  reader.onerror = () => {}
  reader.readAsText(f, 'UTF-8')
}
</script>

<template>
  <aside class="palette win-panel">
    <header class="palette-head">
      <div class="palette-title">块库</div>
      <div class="palette-toolbar">
        <label class="pal-btn">
          导入
          <input
            type="file"
            class="pal-file"
            accept="application/json,.json"
            @change="onImportFile"
          />
        </label>
        <button type="button" class="pal-btn" @click="emit('edit-type')">
          编辑
        </button>
        <button type="button" class="pal-btn" @click="emit('delete-type')">
          删除
        </button>
      </div>
    </header>
    <div class="palette-grid">
      <button
        v-for="t in types"
        :key="t.id"
        type="button"
        class="swatch"
        :class="{ active: selectedId === t.id }"
        :title="t.name + ' · 中键快速选择'"
        @pointerdown="onMiddlePointerDown($event, t.id)"
        @click="emit('select', Number(t.id))"
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
  width: 100%;
  flex-shrink: 0;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  padding: 10px;
}
.palette-head {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  flex-shrink: 0;
}
.palette-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.pal-btn {
  font: inherit;
  font-size: 11px;
  padding: 4px 8px;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  background: var(--win-surface);
  color: var(--win-text);
  cursor: pointer;
  position: relative;
}
.pal-btn:hover {
  background: var(--win-hover);
}
label.pal-btn {
  display: inline-flex;
  align-items: center;
}
.pal-file {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
.palette-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--win-text-secondary);
  line-height: 1.3;
}
.palette-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
  min-height: 0;
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
