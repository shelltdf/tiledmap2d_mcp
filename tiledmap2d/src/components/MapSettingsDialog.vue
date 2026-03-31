<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'new' },
  initialWidth: { type: Number, default: 32 },
  initialHeight: { type: Number, default: 24 },
  initialTileSize: { type: Number, default: 32 },
})

const emit = defineEmits(['close', 'confirm'])

const w = ref('32')
const h = ref('24')
const ts = ref('32')

const titleText = computed(() =>
  props.mode === 'edit' ? '地图设置' : '新建地图'
)

const tileCount = computed(() => {
  const a = parseInt(w.value, 10)
  const b = parseInt(h.value, 10)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '—'
  return String(a * b)
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      w.value = String(props.initialWidth)
      h.value = String(props.initialHeight)
      ts.value = String(props.initialTileSize)
    }
  }
)

function onOk() {
  const width = Math.max(1, Math.min(256, Math.floor(Number(w.value)) || 32))
  const height = Math.max(1, Math.min(256, Math.floor(Number(h.value)) || 24))
  const tileSize = Math.max(8, Math.min(128, Math.floor(Number(ts.value)) || 32))
  emit('confirm', { width, height, tileSize })
  emit('close')
}

function onCancel() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dlg-overlay"
      role="presentation"
      @click.self="onCancel"
    >
      <div
        class="dlg win-panel"
        role="dialog"
        :aria-labelledby="'map-settings-title'"
        aria-modal="true"
        @keydown.escape.prevent="onCancel"
      >
        <div class="dlg-head">
          <h2 id="map-settings-title" class="dlg-title">{{ titleText }}</h2>
          <button type="button" class="win-btn" @click="onCancel">取消</button>
        </div>
        <div class="dlg-body">
          <div class="field">
            <label class="lbl" for="ms-w">宽度（格）</label>
            <input
              id="ms-w"
              v-model="w"
              class="inp"
              type="number"
              min="1"
              max="256"
            />
          </div>
          <div class="field">
            <label class="lbl" for="ms-h">高度（格）</label>
            <input
              id="ms-h"
              v-model="h"
              class="inp"
              type="number"
              min="1"
              max="256"
            />
          </div>
          <div class="field">
            <label class="lbl" for="ms-ts">瓦片像素边长</label>
            <input
              id="ms-ts"
              v-model="ts"
              class="inp"
              type="number"
              min="8"
              max="128"
            />
          </div>
          <p class="meta">格总数（宽×高）：<strong>{{ tileCount }}</strong></p>
        </div>
        <div class="dlg-foot">
          <button type="button" class="win-btn primary" @click="onOk">
            {{ mode === 'edit' ? '应用' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.dlg {
  width: min(400px, 100%);
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--win-border);
}
.dlg-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.dlg-body {
  padding: 12px 14px 8px;
  font-size: 13px;
}
.field {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.lbl {
  font-size: 12px;
  color: var(--win-text-secondary);
}
.inp {
  padding: 6px 8px;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  font: inherit;
  background: var(--win-surface);
  color: var(--win-text);
}
.meta {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--win-text-secondary);
}
.dlg-foot {
  padding: 10px 14px 14px;
  border-top: 1px solid var(--win-border);
  display: flex;
  justify-content: flex-end;
}
</style>
