<script setup>
defineProps({
  /** 已创建或打开过地图，可编辑画布与导出 */
  mapReady: { type: Boolean, default: true },
})

const emit = defineEmits([
  'open-new-map',
  'open-map-settings',
  'export-tmx',
  'import-tmx',
])
</script>

<template>
  <div class="toolbar win-chrome-strip">
    <div class="tb-group">
      <button
        type="button"
        class="win-btn tb-icon-btn"
        title="新建地图…"
        aria-label="新建地图"
        @click="emit('open-new-map')"
      >
        <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
          />
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
            d="M14 2v6h6"
          />
          <path
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            d="M12 18v-6M9 15h6"
          />
        </svg>
      </button>
      <button
        type="button"
        class="win-btn tb-icon-btn"
        title="地图设置…"
        aria-label="地图设置"
        :disabled="!mapReady"
        @click="emit('open-map-settings')"
      >
        <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"
          />
        </svg>
      </button>
    </div>
    <div class="tb-sep" aria-hidden="true" />
    <div class="tb-group">
      <button
        type="button"
        class="win-btn primary tb-icon-btn"
        title="导出 TMX"
        aria-label="导出 TMX"
        :disabled="!mapReady"
        @click="emit('export-tmx')"
      >
        <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
          />
        </svg>
      </button>
      <label
        class="win-btn file-label tb-icon-btn"
        title="导入 TMX"
        aria-label="导入 TMX"
      >
        <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
          />
        </svg>
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
  gap: 8px 10px;
  padding: 6px 10px 7px;
}
.tb-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tb-sep {
  width: 1px;
  height: 24px;
  background: var(--win-border-strong);
  margin: 0 2px;
  flex-shrink: 0;
}
.tb-icon-btn {
  width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.tb-ico {
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
  pointer-events: none;
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
  width: 100%;
  height: 100%;
}
</style>
