<script setup>
const emit = defineEmits([
  'open-new-map',
  'open-map-settings',
  'clear',
  'export',
  'import',
  'export-tmx',
  'import-tmx',
])
</script>

<template>
  <div class="toolbar win-panel">
    <div class="tb-group">
      <button type="button" class="win-btn" @click="emit('open-new-map')">
        新建地图…
      </button>
      <button type="button" class="win-btn" @click="emit('open-map-settings')">
        地图设置…
      </button>
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
      <button type="button" class="win-btn primary" @click="emit('export-tmx')">
        导出 TMX
      </button>
      <label class="win-btn file-label">
        导入 TMX
        <input
          type="file"
          accept=".tmx,application/xml,text/xml"
          class="file-input"
          @change="
            (e) => {
              const f = e.target.files?.[0]
              if (f) emit('import-tmx', f)
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
