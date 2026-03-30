<script setup>
import { reactive, computed } from 'vue'
import { useTileMap } from './composables/useTileMap.js'
import WinToolbar from './components/WinToolbar.vue'
import TilePalette from './components/TilePalette.vue'
import TileMapViewport from './components/TileMapViewport.vue'
import WinStatusBar from './components/WinStatusBar.vue'

const tm = reactive(useTileMap())

const statusMessage = computed(() => {
  if (tm.lastError) return tm.lastError
  return '就绪 — 左键绘制，右键擦除，滚轮缩放'
})

const cursorText = computed(() => {
  const c = tm.cursorCell
  if (!c) return ''
  return `光标: ${c.gx}, ${c.gy}`
})

const zoomText = computed(() => `${tm.zoomPercent}%`)

function onPaint(gx, gy, id) {
  tm.setTile(gx, gy, id)
}

function onCursor(cell) {
  tm.cursorCell = cell
}

function onZoomWheel(deltaY) {
  tm.applyZoom(deltaY)
}

function onNewMap(w, h) {
  tm.newMap(w, h)
}

function onExport() {
  const json = tm.exportMap()
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tilemap.json'
  a.click()
  URL.revokeObjectURL(url)
  tm.clearError()
}

function onImport(file) {
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result ?? '')
    const err = tm.importMapJson(text)
    if (err) tm.setError(err)
  }
  reader.onerror = () => tm.setError('文件读取失败')
  reader.readAsText(file, 'UTF-8')
}
</script>

<template>
  <div class="win-app">
    <header class="win-caption">
      <div class="caption-icon" aria-hidden="true" />
      <span class="caption-title">瓦片地图编辑器</span>
      <span class="caption-sub">Tile Map Editor</span>
    </header>

    <WinToolbar
      :map-width="tm.width"
      :map-height="tm.height"
      @new-map="onNewMap"
      @clear="tm.clearMap"
      @export="onExport"
      @import="onImport"
    />

    <main class="win-main">
      <TilePalette
        :types="tm.TILE_TYPES"
        :selected-id="tm.selectedTileId"
        @select="(id) => (tm.selectedTileId = id)"
      />
      <TileMapViewport
        :tiles="tm.tiles"
        :width="tm.width"
        :height="tm.height"
        :tile-size="tm.tileSize"
        :zoom="tm.zoom"
        :selected-tile-id="tm.selectedTileId"
        :tile-types="tm.TILE_TYPES"
        @paint="onPaint"
        @cursor="onCursor"
        @zoom-wheel="onZoomWheel"
      />
    </main>

    <WinStatusBar
      :message="statusMessage"
      :cursor-text="cursorText"
      :zoom-text="zoomText"
    />
  </div>
</template>

<style scoped>
.win-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 480px;
  background: var(--win-bg);
  color: var(--win-text);
  font-family: var(--win-font);
}
.win-caption {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--win-chrome);
  border-bottom: 1px solid var(--win-border);
  user-select: none;
}
.caption-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(135deg, var(--win-accent), #5a9fd4);
}
.caption-title {
  font-size: 14px;
  font-weight: 600;
}
.caption-sub {
  font-size: 12px;
  color: var(--win-text-secondary);
  margin-left: 4px;
}
.win-main {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 12px;
  min-height: 0;
}
</style>
