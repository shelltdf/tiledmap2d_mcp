<script setup>
import { inject } from 'vue'

const shell = inject('appShell', null)
const t = (path, ...args) => shell?.t?.(path, ...args) ?? path

defineProps({
  types: { type: Array, required: true },
  selectedId: { type: Number, required: true },
})

const emit = defineEmits([
  'select',
  'import-image',
  'edit-type',
  'delete-type',
  'collapse',
])

function onImportImage(e) {
  const input = e.target
  const f = input.files?.[0]
  input.value = ''
  if (!f) return
  if (!/^image\//.test(f.type)) return
  emit('import-image', f)
}
</script>

<template>
  <aside class="palette dock--fill win-panel" :aria-label="t('docks.palette')">
    <div class="dock-head">
      <div class="dock-title">{{ t('docks.palette') }}</div>
      <button
        type="button"
        class="dock-collapse-btn"
        :title="t('docks.paletteCollapse')"
        :aria-label="t('docks.paletteCollapseAria')"
        @click="emit('collapse')"
      >
        ⟩
      </button>
    </div>
    <div class="palette-toolbar">
      <label class="pal-btn" :title="t('paletteUi.importTitle')">
        {{ t('paletteUi.import') }}
        <input
          type="file"
          class="pal-file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/*"
          @change="onImportImage"
        />
      </label>
      <button type="button" class="pal-btn" @click="emit('edit-type')">
        {{ t('paletteUi.edit') }}
      </button>
      <button
        type="button"
        class="pal-btn pal-btn--danger"
        @click="emit('delete-type')"
      >
        {{ t('paletteUi.delete') }}
      </button>
    </div>
    <div class="palette-grid">
      <button
        v-for="item in types"
        :key="item.id"
        type="button"
        class="swatch"
        :class="{ active: selectedId === item.id }"
        :title="item.name"
        @click="emit('select', Number(item.id))"
      >
        <img
          v-if="item.imageDataUrl"
          class="swatch-img"
          :src="item.imageDataUrl"
          alt=""
        />
        <span
          v-else-if="item.color"
          class="swatch-fill"
          :style="{ background: item.color }"
        />
        <span v-else class="swatch-empty">{{ t('paletteUi.emptySwatch') }}</span>
        <span class="swatch-label">{{ item.name }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.dock--fill {
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 8px;
  padding: 10px;
}
.dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.dock-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--win-text-secondary);
  margin: 0;
}
.dock-collapse-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--win-btn-border);
  border-radius: var(--win-radius-btn);
  background: var(--win-surface);
  color: var(--win-text-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.dock-collapse-btn:hover {
  background: var(--win-hover);
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
  border: 1px solid var(--win-btn-border);
  border-radius: var(--win-radius-btn);
  background: var(--win-surface);
  color: var(--win-text);
  cursor: pointer;
  position: relative;
}
.pal-btn:hover {
  background: var(--win-hover);
}
.pal-btn--danger {
  color: #c50500;
}
.pal-btn--danger:hover {
  color: #a00400;
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
.swatch-img {
  width: 28px;
  height: 28px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  object-fit: cover;
  flex-shrink: 0;
  image-rendering: pixelated;
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
