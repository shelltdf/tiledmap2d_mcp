<script setup>
import { ref, reactive, computed, watch, provide } from 'vue'
import { useTileMap } from './composables/useTileMap.js'
import { exportTmx, parseTmxToMapPayload } from './utils/tmx.js'
import { averageColorFromDataUrl } from './utils/tileImage.js'
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
import PixelEditorDialog from './components/PixelEditorDialog.vue'
import LogDialog from './components/LogDialog.vue'
import { useAppLog } from './composables/useAppLog.js'
import { useAppTheme } from './composables/useAppTheme.js'
import { useAppI18n } from './composables/useAppI18n.js'

const { locale, setLocale, t } = useAppI18n()
const tm = reactive(useTileMap())
const { themePreference, setThemePreference } = useAppTheme()
const appLog = useAppLog()
const logOpen = ref(false)

provide('appShell', {
  t,
  locale,
  setLocale,
  themePreference,
  setThemePreference,
  log: appLog,
})

watch(
  () => tm.lastError,
  (msg) => {
    if (msg) appLog.error(msg)
  },
)
const formatsOpen = ref(false)
const addLayerOpen = ref(false)
const mapSettingsOpen = ref(false)
const mapSettingsMode = ref('new')
const pixelEditorOpen = ref(false)
/** 打开像素编辑时锁定的块 id（避免编辑中途切换选中导致写错块） */
const editingTileTypeId = ref(0)
const showGridOverlay = ref(true)
const showOriginMarker = ref(false)
const showCollisionVolume = ref(true)
const importJsonEl = ref(null)
const importTmxEl = ref(null)
/** 另存/保存目标（File System Access API）；来自 `<input type=file>` 的打开无此句柄 */
const mapFileHandle = ref(null)
const mapFileSuggestedName = ref('tiledmap2d.json')
/** 菜单「打开」在回退到 `<input type=file>` 前已确认过，避免 onImport 二次确认 */
const skipImportConfirm = ref(false)

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
  if (!tm.hasMap) return t('status.noMap')
  return t('status.ready')
})

const cursorText = computed(() => {
  if (!tm.hasMap) return t('status.noMapShort')
  const c = tm.cursorCell
  if (!c) return ''
  const layer = tm.activeLayerName ? ` | ${tm.activeLayerName}` : ''
  return `${t('status.cursor')}: ${c.gx}, ${c.gy}${layer}`
})

const zoomText = computed(() => `${tm.zoomPercent}%`)

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

function onImportTileImage(file) {
  const reader = new FileReader()
  reader.onload = async () => {
    const dataUrl = String(reader.result ?? '')
    const base =
      String(file.name ?? '')
        .replace(/\.[^.]+$/, '')
        .trim() || t('tile.unnamed', tm.tileTypes.length)
    const err = await tm.addTileTypeFromImage(base, dataUrl)
    if (err) tm.setError(err)
  }
  reader.onerror = () => tm.setError(t('errors.app.imageReadFailed'))
  reader.readAsDataURL(file)
}

function onEditTileType() {
  const id = tm.selectedTileId
  const tile = tm.tileTypes[id]
  if (!tile) return
  if (id === 0) {
    const name = window.prompt(t('errors.app.promptEmptyTileName'), tile.name)
    if (name === null) return
    const trimmed = String(name).trim()
    if (!trimmed) {
      tm.setError(t('errors.app.nameRequired'))
      return
    }
    const err = tm.updateTileType(id, { name: trimmed })
    if (err) tm.setError(err)
    return
  }
  editingTileTypeId.value = id
  pixelEditorOpen.value = true
}

async function onPixelEditorSave(payload) {
  const id = editingTileTypeId.value
  if (!payload || id === 0) return
  const t = tm.tileTypes[id]
  if (!t) return
  let color
  try {
    color = await averageColorFromDataUrl(payload.imageDataUrl)
  } catch {
    color = t.color ?? '#888888'
  }
  const err = tm.updateTileType(id, {
    imageDataUrl: payload.imageDataUrl,
    color,
    name: payload.name,
    collisionType: payload.collisionType,
    transparentColor: payload.transparentColor,
    textureWidth: payload.textureWidth,
    textureHeight: payload.textureHeight,
    colorDepthMode: payload.colorDepthMode,
  })
  if (err) tm.setError(err)
}

function onDeleteTileType() {
  const id = tm.selectedTileId
  const tile = tm.tileTypes[id]
  if (!tile) return
  if (id === 0) {
    tm.setError(t('errors.app.cannotDeleteEmptyType'))
    return
  }
  if (
    !window.confirm(t('errors.app.confirmDeleteTileType', tile.name))
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
  const next = window.prompt(t('errors.app.promptLayerName'), L.name)
  if (next == null) return
  const trimmed = String(next).trim()
  if (!trimmed) return
  tm.setLayerName(index, trimmed)
}

function onLayerRemoveActive() {
  const index = tm.activeLayerIndex
  const L = tm.layers[index]
  if (!L) return
  if (tm.layers.length <= 1) {
    tm.setError(t('errors.app.keepOneLayer'))
    return
  }
  if (
    !window.confirm(t('errors.app.confirmDeleteLayer', L.name))
  ) {
    return
  }
  tm.removeLayer(index)
}

function onClearMap() {
  if (!tm.hasMap) return
  if (
    !window.confirm(t('errors.app.confirmClearMap'))
  ) {
    return
  }
  tm.clearMap()
}

function onSelectionChange({ cells }) {
  tm.setSelection(cells)
}

function onSelectionAdd({ cells }) {
  tm.addCellsToSelection(cells)
}

function onSelectionToggle({ cell }) {
  tm.toggleCellInSelection(cell.gx, cell.gy)
}

function onPickTile({ tileId }) {
  tm.setSelectedTileId(tileId)
}

function onApplyTiles({ cells, tileId }) {
  tm.fillCells(cells, tileId)
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
    const w = tm.width
    const h = tm.height
    const ts = tm.tileSize
    if (
      (width !== w || height !== h || tileSize !== ts) &&
      !window.confirm(t('errors.app.confirmResizeMap'))
    ) {
      return
    }
    tm.applyMapSettings(width, height, tileSize)
  } else {
    if (
      tm.hasMap &&
      !window.confirm(t('errors.app.confirmNewMapReplace'))
    ) {
      return
    }
    tm.newMap(width, height, tileSize)
    mapFileHandle.value = null
    appLog.info(t('log.newMapCreated'))
  }
}

function downloadJsonFile(json, filename) {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function writeJsonToFileHandle(handle, text) {
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

/** 工具栏「另存为」与菜单「另存为…」：无 File System API 时回退为下载 */
function onSaveAsDownload() {
  const json = tm.exportMap()
  if (json == null) {
    tm.setError(t('errors.app.noMapToSave'))
    return
  }
  downloadJsonFile(json, mapFileSuggestedName.value || 'tiledmap2d.json')
  tm.clearError()
  appLog.info(t('log.savedDownload'))
}

async function onMenuSave() {
  const json = tm.exportMap()
  if (json == null) {
    tm.setError(t('errors.app.noMapToSave'))
    return
  }
  if (mapFileHandle.value && 'createWritable' in mapFileHandle.value) {
    try {
      await writeJsonToFileHandle(mapFileHandle.value, json)
      tm.clearError()
      appLog.info(t('log.saved'))
    } catch {
      tm.setError(t('errors.app.saveFailed'))
    }
    return
  }
  await onMenuSaveAs()
}

async function onMenuSaveAs() {
  const json = tm.exportMap()
  if (json == null) {
    tm.setError(t('errors.app.noMapToSave'))
    return
  }
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: mapFileSuggestedName.value || 'tiledmap2d.json',
        types: [
          {
            description: t('errors.app.jsonMapDescription'),
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      await writeJsonToFileHandle(handle, json)
      mapFileHandle.value = handle
      mapFileSuggestedName.value = handle.name || 'tiledmap2d.json'
      tm.clearError()
      appLog.info(t('log.saved'))
    } catch (e) {
      if (e?.name === 'AbortError') return
      onSaveAsDownload()
    }
    return
  }
  onSaveAsDownload()
}

function onMenuNew() {
  mapSettingsMode.value = 'new'
  mapSettingsOpen.value = true
}

async function onMenuOpen() {
  if (
    tm.hasMap &&
    !window.confirm(t('errors.app.confirmOpenReplace'))
  ) {
    return
  }
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: t('errors.app.jsonMapDescription'),
            accept: { 'application/json': ['.json'] },
          },
        ],
        excludeAcceptAllOption: false,
        multiple: false,
      })
      const file = await handle.getFile()
      const text = await file.text()
      const err = tm.importMapJson(text)
      if (err) {
        tm.setError(err)
        return
      }
      mapFileHandle.value = handle
      mapFileSuggestedName.value = file.name || 'tiledmap2d.json'
      tm.clearError()
      appLog.info(t('log.importedJson'))
    } catch (e) {
      if (e?.name === 'AbortError') return
      skipImportConfirm.value = true
      importJsonEl.value?.click()
    }
    return
  }
  skipImportConfirm.value = true
  importJsonEl.value?.click()
}

function onImport(file) {
  const skip = skipImportConfirm.value
  skipImportConfirm.value = false
  if (
    !skip &&
    tm.hasMap &&
    !window.confirm(t('errors.app.confirmOpenReplace'))
  ) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result ?? '')
    const err = tm.importMapJson(text)
    if (err) tm.setError(err)
    else {
      mapFileHandle.value = null
      mapFileSuggestedName.value = file.name || 'tiledmap2d.json'
      tm.clearError()
      appLog.info(t('log.importedJson'))
    }
  }
  reader.onerror = () => tm.setError(t('errors.app.fileReadFailed'))
  reader.readAsText(file, 'UTF-8')
}

function onExportTmx() {
  if (!tm.hasMap) {
    tm.setError(t('errors.app.noMapToExport'))
    return
  }
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
  appLog.info(t('log.exportedTmx'))
}

function onImportTmx(file) {
  if (
    tm.hasMap &&
    !window.confirm(t('errors.app.confirmImportTmxReplace'))
  ) {
    return
  }
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
    else {
      mapFileHandle.value = null
      tm.clearError()
      appLog.info(t('log.importedTmx'))
    }
  }
  reader.onerror = () => tm.setError(t('errors.app.fileReadFailed'))
  reader.readAsText(file, 'UTF-8')
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
      <span class="caption-title">{{ t('caption.title') }}</span>
      <span class="caption-sub">{{ t('caption.sub') }}</span>
    </header>

    <WinMenuBar
      @new-map="onMenuNew"
      @open-json="onMenuOpen"
      @save="onMenuSave"
      @save-as="onMenuSaveAs"
      @export-tmx="onExportTmx"
      @import-tmx="onMenuImportTmx"
      @clear="onClearMap"
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

    <LogDialog
      :open="logOpen"
      :entries="appLog.entries"
      @close="logOpen = false"
    />

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

    <PixelEditorDialog
      :open="pixelEditorOpen"
      :map-tile-size="tm.tileSize"
      :tile-type="tm.tileTypes[editingTileTypeId] ?? null"
      :fallback-color="tm.tileTypes[editingTileTypeId]?.color ?? '#888888'"
      @close="pixelEditorOpen = false"
      @save="onPixelEditorSave"
    />

    <WinToolbar
      :map-ready="tm.hasMap"
      @open-new-map="openNewMapDialog"
      @open-map-settings="openEditMapSettingsDialog"
      @export-tmx="onExportTmx"
      @import-tmx="onImportTmx"
    />

    <main class="win-main">
      <div class="dock-shelf dock-shelf--left">
        <div
          class="dock-edge dock-edge--left"
          :class="{ 'dock-edge--active': dockMapLayersCollapsed }"
          role="toolbar"
          :aria-label="t('docks.dockLeftAria')"
        >
          <DockEdgeButton
            v-if="dockMapLayersCollapsed"
            placement="left"
            :label="t('docks.mapLayers')"
            @expand="dockMapLayersCollapsed = false"
          />
        </div>
        <div
          class="dock-display dock-display--left"
          :class="{ 'dock-display--collapsed': dockMapLayersCollapsed }"
        >
          <MapLayersDock
            v-show="!dockMapLayersCollapsed"
            :map-ready="tm.hasMap"
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
          :map-ready="tm.hasMap"
          :layers="tm.layers"
          :width="tm.width"
          :height="tm.height"
          :tile-size="tm.tileSize"
          :zoom="tm.zoom"
          :selected-tile-id="tm.selectedTileId"
          :active-tool="tm.activeTool"
          :active-layer-index="tm.activeLayerIndex"
          :selected-cells="tm.selectedCells"
          :tile-types="tm.tileTypes"
          :show-grid-overlay="showGridOverlay"
          :show-origin-marker="showOriginMarker"
          :show-collision-volume="showCollisionVolume"
          @cursor="onCursor"
          @zoom-wheel="onZoomWheel"
          @tool="(t) => tm.setActiveTool(t)"
          @selection-change="onSelectionChange"
          @selection-add="onSelectionAdd"
          @selection-toggle="onSelectionToggle"
          @apply-tiles="onApplyTiles"
          @pick-tile="onPickTile"
          @selection-clear="() => tm.clearSelection()"
          @set-zoom="(z) => tm.setZoom(z)"
          @update:show-grid-overlay="(v) => (showGridOverlay = v)"
          @update:show-origin-marker="(v) => (showOriginMarker = v)"
          @update:show-collision-volume="(v) => (showCollisionVolume = v)"
          @clear-map="onClearMap"
        />
      </div>
      <div
        v-if="tm.hasMap"
        class="dock-shelf dock-shelf--right"
      >
        <div
          class="dock-display dock-display--right"
          :class="{ 'dock-display--collapsed': rightDockDisplayCollapsed }"
        >
          <TilePalette
            v-show="!dockPaletteCollapsed"
            :types="tm.tileTypes"
            :selected-id="tm.selectedTileId"
            @select="selectTile"
            @import-image="onImportTileImage"
            @edit-type="onEditTileType"
            @delete-type="onDeleteTileType"
            @collapse="dockPaletteCollapsed = true"
          />
          <BlockDefinitionDock
            v-show="!dockBlockDefCollapsed"
            :types="tm.tileTypes"
            :selected-id="tm.selectedTileId"
            :tile-size="tm.tileSize"
            @collapse="dockBlockDefCollapsed = true"
          />
        </div>
        <div
          class="dock-edge dock-edge--right"
          :class="{ 'dock-edge--active': rightDockEdgeActive }"
          role="toolbar"
          :aria-label="t('docks.dockRightAria')"
        >
          <DockEdgeButton
            v-if="dockPaletteCollapsed"
            placement="right"
            :label="t('docks.palette')"
            @expand="dockPaletteCollapsed = false"
          />
          <DockEdgeButton
            v-if="dockBlockDefCollapsed"
            placement="right"
            :label="t('docks.blockDef')"
            @expand="dockBlockDefCollapsed = false"
          />
        </div>
      </div>
    </main>

    <WinStatusBar
      :message="statusMessage"
      :cursor-text="cursorText"
      :zoom-text="zoomText"
      :log-hint="t('status.clickOpenLog')"
      @open-log="logOpen = true"
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
  background: linear-gradient(
    180deg,
    var(--win-surface) 0%,
    var(--win-chrome) 100%
  );
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
