<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  mapWidth: { type: Number, required: true },
  mapHeight: { type: Number, required: true },
})

const emit = defineEmits(['new-map', 'clear', 'export', 'import'])

const w = ref(String(props.mapWidth))
const h = ref(String(props.mapHeight))

watch(
  () => props.mapWidth,
  (v) => {
    w.value = String(v)
  }
)
watch(
  () => props.mapHeight,
  (v) => {
    h.value = String(v)
  }
)

function submitNew() {
  emit('new-map', w.value, h.value)
}
</script>

<template>
  <div class="toolbar win-panel">
    <div class="tb-group">
      <label class="tb-label">宽</label>
      <input v-model="w" class="tb-input" type="number" min="1" max="256" />
      <label class="tb-label">高</label>
      <input v-model="h" class="tb-input" type="number" min="1" max="256" />
      <button type="button" class="win-btn" @click="submitNew">新建地图</button>
    </div>
    <div class="tb-sep" />
    <div class="tb-group">
      <button type="button" class="win-btn" @click="emit('clear')">清空</button>
      <button type="button" class="win-btn primary" @click="emit('export')">
        导出 JSON
      </button>
      <label class="win-btn file-label">
        导入 JSON
        <input
          type="file"
          accept="application/json,.json"
          class="file-input"
          @change="
            (e) => {
              const f = e.target.files?.[0]
              if (f) emit('import', f)
              e.target.value = ''
            }
          "
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--win-border);
}
.tb-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tb-label {
  font-size: 12px;
  color: var(--win-text-secondary);
}
.tb-input {
  width: 56px;
  padding: 4px 6px;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  font: inherit;
  background: var(--win-surface);
  color: var(--win-text);
}
.tb-sep {
  width: 1px;
  height: 24px;
  background: var(--win-border);
  margin: 0 4px;
}
.file-label {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
