<script setup>
import { ref, reactive, computed } from 'vue'
import { useTileMap } from './composables/useTileMap.js'
import { exportTmx, parseTmxToMapPayload } from './utils/tmx.js'
import WinMenuBar from './components/WinMenuBar.vue'
import FormatsHelpDialog from './components/FormatsHelpDialog.vue'
import WinToolbar from './components/WinToolbar.vue'
import DockEdgeButton from './components/DockEdgeButton.vue'
import TilePalette from './components/TilePalette.vue'
import MapLayersDock from './components/MapLayersDock.vue'
import BlockDefinitionDock from './components/BlockDefinitionDock.vue'
import TileMapViewport from './components/TileMapViewport.vue'
import AddLayerDialog from './components/AddLayerDialog.vue'
import MapSettingsDialog from './components/MapSettingsDialog.vue'
import WinStatusBar from './components/WinStatusBar.vue'

const tm = reactive(useTileMap())
const formatsOpen = ref(false)
const addLayerOpen = ref(false)
const mapSettingsOpen = ref(false)
const mapSettingsMode = ref('new')
const showGridOverlay = ref(false)
const showOriginMarker = ref(false)
const showRefLabels = ref(false)
const importJsonEl = ref(null)
const importTmxEl = ref(null)

/** Dock：折叠后按钮在靠边「缘条」，与中间「显示区」兄弟排列；多 Dock 共享显示区高度 */
const dockMapLayersCollapsed = ref(false)
const dockPaletteCollapsed = ref(false)
const dockBlockDefCollapsed = ref(false)

const rightDockDisplayCollapsed = computed(
  () => dockPaletteCollapsed.value && dockBlockDefCollapsed.value,
)
const rightDockEdgeActive = computed(
  () => dockPaletteCollapsed.value || dockBlockDefCollapsed.value,
)

const statusMessage = computed(() => {
  if (tm.lastError) return tm.lastError
  return '就绪 — 左键绘制，右键擦除；中键拖动画布平移；选择工具下左键拾取格中块；块库左键选块；滚轮缩放以指针为中心；画布聚焦时按住空格临时选择、松开恢复；方向键平移视口；支持 JSON / TMX（Tiled）'
})

const cursorText = computed(() => {
  const c = tm.cursorCell
  if (!c) return ''
  const layer = tm.activeLayerName ? ` | ${tm.activeLayerName}` : ''
  return `光标: ${c.gx}, ${c.gy}${layer}`
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

function onAddLayerConfirm(payload) {
  tm.insertLayer(payload)
}

function onLayerReorder({ from, to }) {
  tm.moveLayer(from, to)
}

function selectTile(id) {
  tm.setSelectedTileId(id)
}

function onImportTileTypes(text) {
  const err = tm.importTileTypesJson(text)
  if (err) tm.setError(err)
}

function onEditTileType() {
  const id = tm.selectedTileId
  const types = tm.tileTypes
  const t = types[id]
  if (!t) return
  const name = window.prompt('块名称', t.name)
  if (name === null) return
  const trimmed = String(name).trim()
  if (!trimmed) {
    tm.setError('名称不能为空')
    return
  }
  if (id === 0) {
    const err = tm.updateTileType(id, { name: trimmed })
    if (err) tm.setError(err)
    return
  }
  const c = window.prompt('颜色 (#RRGGBB)', t.color ?? '#888888')
  if (c === null) return
  const tc = String(c).trim()
  if (!tc || !/^#[0-9a-fA-F]{6}$/.test(tc)) {
    tm.setError('颜色须为 #RRGGBB')
    return
  }
  const err = tm.updateTileType(id, { name: trimmed, color: tc })
  if (err) tm.setError(err)
}

function onDeleteTileType() {
  const id = tm.selectedTileId
  const t = tm.tileTypes[id]
  if (!t) return
  if (id === 0) {
    tm.setError('不能删除「空」类型')
    return
  }
  if (
    !window.confirm(
      `删除块类型「${t.name}」？地图上该块将变为空，且更大 id 会顺延重排。`
    )
  ) {
    return
  }
  const err = tm.deleteTileType(id)
  if (err) tm.setError(err)
}

function onLayerRenameActive() {
  const index = tm.activeLayerIndex
  const L = tm.layers[index]
  if (!L) return
  const next = window.prompt('图层名称', L.name)
  if (next == null) return
  const trimmed = String(next).trim()
  if (!trimmed) return
  tm.setLayerName(index, trimmed)
}

function onLayerRemoveActive() {
  tm.removeLayer(tm.activeLayerIndex)
}

function onPickTile({ gx, gy, tileId }) {
  tm.setPickedCell(gx, gy)
  tm.setSelectedTileId(tileId)
}

function openNewMapDialog() {
  mapSettingsMode.value = 'new'
  mapSettingsOpen.value = true
}

function openEditMapSettingsDialog() {
  mapSettingsMode.value = 'edit'
  mapSettingsOpen.value = true
}

function onMapSettingsConfirm({ width, height, tileSize }) {
  if (mapSettingsMode.value === 'edit') {
    tm.applyMapSettings(width, height, tileSize)
  } else {
    tm.newMap(width, height, tileSize)
  }
}

function onExport() {
  const json = tm.exportMap()
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tiledmap2d.json'
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

function onExportTmx() {
  const xml = exportTmx({
    width: tm.width,
    height: tm.height,
    tileSize: tm.tileSize,
    layers: tm.layers.map((L) => ({
      name: L.name,
      visible: L.visible,
      kind: L.kind || 'tile',
      tiles: L.tiles,
    })),
  })
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tiledmap2d.tmx'
  a.click()
  URL.revokeObjectURL(url)
  tm.clearError()
}

function onImportTmx(file) {
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result ?? '')
    const r = parseTmxToMapPayload(text, tm.tileTypes.length)
    if (typeof r === 'string') {
      tm.setError(r)
      return
    }
    const err = tm.importMapObject(r)
    if (err) tm.setError(err)
  }
  reader.onerror = () => tm.setError('文件读取失败')
  reader.readAsText(file, 'UTF-8')
}

function onMenuImportJson() {
  importJsonEl.value?.click()
}

function onMenuImportTmx() {
  importTmxEl.value?.click()
}

function onMenuShowFormats() {
  formatsOpen.value = true
}
</script>

<template>
  <div class="win-app">
    <header class="win-caption">
      <div class="caption-icon" aria-hidden="true" />
      <span class="caption-title">TiledMap2D</span>
      <span class="caption-sub">二维正交瓦片 · 非 GIS 球面切片</span>
    </header>

    <WinMenuBar
      @export-json="onExport"
      @import-json="onMenuImportJson"
      @export-tmx="onExportTmx"
      @import-tmx="onMenuImportTmx"
      @clear="tm.clearMap"
      @show-formats="onMenuShowFormats"
    />

    <input
      ref="importJsonEl"
      type="file"
      class="sr-only"
      accept="application/json,.json"
      tabindex="-1"
      aria-hidden="true"
      @change="
        (e) => {
          const f = e.target.files?.[0]
          if (f) onImport(f)
          e.target.value = ''
        }
      "
    />
    <input
      ref="importTmxEl"
      type="file"
      class="sr-only"
      accept=".tmx,application/xml,text/xml"
      tabindex="-1"
      aria-hidden="true"
      @change="
        (e) => {
          const f = e.target.files?.[0]
          if (f) onImportTmx(f)
          e.target.value = ''
        }
      "
    />

    <FormatsHelpDialog :open="formatsOpen" @close="formatsOpen = false" />

    <AddLayerDialog
      :open="addLayerOpen"
      @close="addLayerOpen = false"
      @confirm="onAddLayerConfirm"
    />

    <MapSettingsDialog
      :open="mapSettingsOpen"
      :mode="mapSettingsMode"
      :initial-width="tm.width"
      :initial-height="tm.height"
      :initial-tile-size="tm.tileSize"
      @close="mapSettingsOpen = false"
      @confirm="onMapSettingsConfirm"
    />

    <WinToolbar
      @open-new-map="openNewMapDialog"
      @open-map-settings="openEditMapSettingsDialog"
      @clear="tm.clearMap"
      @export="onExport"
      @import="onImport"
      @export-tmx="onExportTmx"
      @import-tmx="onImportTmx"
    />

    <main class="win-main">
      <div class="dock-shelf dock-shelf--left">
        <div
          class="dock-edge dock-edge--left"
          :class="{ 'dock-edge--active': dockMapLayersCollapsed }"
          role="toolbar"
          aria-label="左侧折叠停靠"
        >
          <DockEdgeButton
            v-if="dockMapLayersCollapsed"
            placement="left"
            label="地图层"
            @expand="dockMapLayersCollapsed = false"
          />
        </div>
        <div
          class="dock-display dock-display--left"
          :class="{ 'dock-display--collapsed': dockMapLayersCollapsed }"
        >
          <MapLayersDock
            v-show="!dockMapLayersCollapsed"
            :layers="tm.layers"
            :active-index="tm.activeLayerIndex"
            @select="(i) => tm.setActiveLayer(i)"
            @toggle-visible="
              (i, vis) => tm.setLayerVisible(i, vis)
            "
            @open-add-dialog="addLayerOpen = true"
            @rename-active="onLayerRenameActive"
            @remove-active="onLayerRemoveActive"
            @reorder="onLayerReorder"
            @collapse="dockMapLayersCollapsed = true"
          />
        </div>
      </div>
      <div class="canvas-workspace">
        <TileMapViewport
          :layers="tm.layers"
          :width="tm.width"
          :height="tm.height"
          :tile-size="tm.tileSize"
          :zoom="tm.zoom"
          :selected-tile-id="tm.selectedTileId"
          :active-tool="tm.activeTool"
          :active-layer-index="tm.activeLayerIndex"
          :picked-cell="tm.pickedCell"
          :tile-types="tm.tileTypes"
          :show-grid-overlay="showGridOverlay"
          :show-origin-marker="showOriginMarker"
          :show-ref-labels="showRefLabels"
          @paint="onPaint"
          @cursor="onCursor"
          @zoom-wheel="onZoomWheel"
          @tool="(t) => tm.setActiveTool(t)"
          @pick-tile="onPickTile"
          @set-zoom="(z) => tm.setZoom(z)"
          @update:show-grid-overlay="(v) => (showGridOverlay = v)"
          @update:show-origin-marker="(v) => (showOriginMarker = v)"
          @update:show-ref-labels="(v) => (showRefLabels = v)"
        />
      </div>
      <div class="dock-shelf dock-shelf--right">
        <div
          class="dock-display dock-display--right"
          :class="{ 'dock-display--collapsed': rightDockDisplayCollapsed }"
        >
          <TilePalette
            v-show="!dockPaletteCollapsed"
            :types="tm.tileTypes"
            :selected-id="tm.selectedTileId"
            @select="selectTile"
            @import-types="onImportTileTypes"
            @edit-type="onEditTileType"
            @delete-type="onDeleteTileType"
            @collapse="dockPaletteCollapsed = true"
          />
          <BlockDefinitionDock
            v-show="!dockBlockDefCollapsed"
            :types="tm.tileTypes"
            :selected-id="tm.selectedTileId"
            @collapse="dockBlockDefCollapsed = true"
          />
        </div>
        <div
          class="dock-edge dock-edge--right"
          :class="{ 'dock-edge--active': rightDockEdgeActive }"
          role="toolbar"
          aria-label="右侧折叠停靠"
        >
          <DockEdgeButton
            v-if="dockPaletteCollapsed"
            placement="right"
            label="块库"
            @expand="dockPaletteCollapsed = false"
          />
          <DockEdgeButton
            v-if="dockBlockDefCollapsed"
            placement="right"
            label="块定义"
            @expand="dockBlockDefCollapsed = false"
          />
        </div>
      </div>
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
  padding: 8px 12px 9px;
  background: linear-gradient(180deg, #ffffff 0%, #ececec 100%);
  border-bottom: 1px solid var(--win-border-strong);
  user-select: none;
  flex-shrink: 0;
}
.caption-icon {
  width: 20px;
  height: 20px;
  border-radius: 1px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: linear-gradient(180deg, #1a8cff 0%, var(--win-accent) 100%);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
}
.caption-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
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
  overflow: hidden;
}
.canvas-workspace {
  flex: 1;
  display: flex;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  align-items: stretch;
  overflow: hidden;
}
.dock-shelf--left,
.dock-shelf--right {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex-shrink: 0;
  min-height: 0;
}
.dock-edge--left,
.dock-edge--right {
  width: 0;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  gap: 6px;
  flex-shrink: 0;
  transition:
    width 0.15s ease,
    min-width 0.15s ease;
}
.dock-edge--left.dock-edge--active,
.dock-edge--right.dock-edge--active {
  width: 28px;
  min-width: 28px;
}
.dock-display--left {
  flex: 0 0 208px;
  width: 208px;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    width 0.15s ease,
    flex 0.15s ease;
}
.dock-display--left.dock-display--collapsed {
  flex: 0 0 0;
  width: 0;
  overflow: hidden;
}
.dock-display--right {
  flex: 0 0 188px;
  width: 188px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition:
    width 0.15s ease,
    flex 0.15s ease;
}
.dock-display--right.dock-display--collapsed {
  flex: 0 0 0;
  width: 0;
  min-width: 0;
  overflow: hidden;
  gap: 0;
}
</style>
