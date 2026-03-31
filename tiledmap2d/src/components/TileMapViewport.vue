<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import CanvasToolsBar from './CanvasToolsBar.vue'
import CanvasDisplayPanel from './CanvasDisplayPanel.vue'

const panning = ref(false)

const props = defineProps({
  layers: { type: Array, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  tileSize: { type: Number, required: true },
  zoom: { type: Number, required: true },
  selectedTileId: { type: Number, required: true },
  activeTool: { type: String, required: true },
  activeLayerIndex: { type: Number, required: true },
  pickedCell: { type: Object, default: null },
  tileTypes: { type: Array, required: true },
  showGridOverlay: { type: Boolean, default: false },
  showOriginMarker: { type: Boolean, default: false },
  showRefLabels: { type: Boolean, default: false },
})

const emit = defineEmits([
  'paint',
  'cursor',
  'zoom-wheel',
  'tool',
  'pick-tile',
  'set-zoom',
  'update:showGridOverlay',
  'update:showOriginMarker',
  'update:showRefLabels',
])

const canvasRef = ref(null)
const padRef = ref(null)
const wrapRef = ref(null)
let painting = false
let lastPanX = 0
let lastPanY = 0
let toolBeforeSpace = null
let spaceHoldListener = false

const KEY_SCROLL_STEP = 48
/** 画布四周留白（px），使地图可略平移出视口；过大会让地图在视口内显得「偏一侧」 */
const VIEW_SCROLL_MARGIN = 64

function colorForTileId(id) {
  const t = props.tileTypes.find((x) => x.id === id)
  return t?.color ?? '#ccc'
}

function layerKind(layer) {
  return layer?.kind === 'image' ? 'image' : 'tile'
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const cell = props.tileSize * props.zoom
  const cw = props.width * cell
  const ch = props.height * cell
  canvas.width = Math.max(1, Math.floor(cw * dpr))
  canvas.height = Math.max(1, Math.floor(ch * dpr))
  canvas.style.width = `${cw}px`
  canvas.style.height = `${ch}px`
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cw, ch)

  const light = '#fafafa'
  const dark = '#e8e8e8'
  for (let gy = 0; gy < props.height; gy++) {
    for (let gx = 0; gx < props.width; gx++) {
      const x = gx * cell
      const y = gy * cell
      const odd = (gx + gy) % 2 === 0
      ctx.fillStyle = odd ? light : dark
      ctx.fillRect(x, y, cell, cell)
    }
  }

  for (const layer of props.layers) {
    if (!layer?.visible) continue
    if (layerKind(layer) === 'image') {
      ctx.fillStyle = 'rgba(100, 140, 255, 0.14)'
      ctx.fillRect(0, 0, cw, ch)
      continue
    }
    if (!layer.tiles) continue
    for (let gy = 0; gy < props.height; gy++) {
      for (let gx = 0; gx < props.width; gx++) {
        const id = layer.tiles[gy]?.[gx] ?? 0
        if (id === 0) continue
        const x = gx * cell
        const y = gy * cell
        ctx.fillStyle = colorForTileId(id)
        ctx.fillRect(x, y, cell, cell)
      }
    }
  }

  for (let gy = 0; gy < props.height; gy++) {
    for (let gx = 0; gx < props.width; gx++) {
      const x = gx * cell
      const y = gy * cell
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
    }
  }

  if (props.showGridOverlay) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= props.width; gx++) {
      const x = gx * cell + 0.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ch)
      ctx.stroke()
    }
    for (let gy = 0; gy <= props.height; gy++) {
      const y = gy * cell + 0.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(cw, y)
      ctx.stroke()
    }
  }

  if (props.showOriginMarker && props.width > 0 && props.height > 0) {
    ctx.strokeStyle = '#c42b1c'
    ctx.lineWidth = 2
    ctx.strokeRect(1.5, 1.5, cell - 3, cell - 3)
  }

  if (props.showRefLabels && props.width > 0 && props.height > 0) {
    ctx.font = `${Math.max(10, Math.min(14, cell * 0.35))}px Segoe UI, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.textBaseline = 'top'
    ctx.fillText('(0,0)', 4, 3)
    if (props.width >= 2 && props.height >= 2) {
      ctx.fillText('(1,1)', cell + 4, cell + 3)
    }
  }

  const p = props.pickedCell
  if (p && props.activeTool === 'select') {
    const gx = p.gx
    const gy = p.gy
    if (
      gx >= 0 &&
      gy >= 0 &&
      gx < props.width &&
      gy < props.height
    ) {
      const x = gx * cell
      const y = gy * cell
      ctx.strokeStyle = '#0067c0'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3)
    }
  }
}

function eventToCell(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const cell = props.tileSize * props.zoom
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const gx = Math.floor(x / cell)
  const gy = Math.floor(y / cell)
  if (gx < 0 || gy < 0 || gx >= props.width || gy >= props.height) return null
  return { gx, gy }
}

function tileIdAtActiveLayer(cell) {
  const L = props.layers[props.activeLayerIndex]
  if (!cell || !L) return 0
  if (layerKind(L) !== 'tile') return 0
  return L.tiles?.[cell.gy]?.[cell.gx] ?? 0
}

function onPointerDown(e) {
  wrapRef.value?.focus()
  if (e.button === 1) {
    e.preventDefault()
    panning.value = true
    lastPanX = e.clientX
    lastPanY = e.clientY
    padRef.value?.setPointerCapture(e.pointerId)
    return
  }
  e.preventDefault()
  padRef.value?.setPointerCapture(e.pointerId)
  const cell = eventToCell(e)
  emit('cursor', cell)
  if (props.activeTool === 'select') {
    if (e.button === 0 && cell) {
      const tileId = tileIdAtActiveLayer(cell)
      emit('pick-tile', {
        gx: cell.gx,
        gy: cell.gy,
        tileId,
      })
    }
    return
  }
  if (e.button === 0) {
    painting = true
    if (!cell) return
    if (props.activeTool === 'eraser') {
      emit('paint', cell.gx, cell.gy, 0)
      return
    }
    emit('paint', cell.gx, cell.gy, props.selectedTileId)
  } else if (e.button === 2) {
    painting = true
    if (cell) emit('paint', cell.gx, cell.gy, 0)
  }
}

function onPointerMove(e) {
  if (panning.value) {
    e.preventDefault()
    const dx = e.clientX - lastPanX
    const dy = e.clientY - lastPanY
    lastPanX = e.clientX
    lastPanY = e.clientY
    const el = wrapRef.value
    if (el) {
      el.scrollLeft -= dx
      el.scrollTop -= dy
    }
    return
  }
  const cell = eventToCell(e)
  emit('cursor', cell)
  if (props.activeTool === 'select') return
  if (!painting) return
  if (cell) {
    let id = e.buttons === 2 ? 0 : props.selectedTileId
    if (props.activeTool === 'eraser') id = 0
    emit('paint', cell.gx, cell.gy, id)
  }
}

function onPointerUp(e) {
  panning.value = false
  painting = false
  try {
    if (e?.pointerId != null) {
      padRef.value?.releasePointerCapture(e.pointerId)
    }
  } catch {
    /* noop */
  }
}

/** 中键平移时指针可能移出画布矩形，不要用 leave 结束拖拽（否则像无法自由平移） */
function onPointerLeave(e) {
  if (panning.value) return
  onPointerUp(e)
}

function onWheel(e) {
  e.preventDefault()
  const rect = wrapRef.value?.getBoundingClientRect()
  if (!rect) return
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const oldZ = props.zoom
  emit('zoom-wheel', e.deltaY)
  nextTick(() => {
    const newZ = props.zoom
    if (newZ === oldZ) return
    const k = newZ / oldZ
    const wrap = wrapRef.value
    if (!wrap) return
    const cx = wrap.scrollLeft + x
    const cy = wrap.scrollTop + y
    wrap.scrollLeft = Math.max(0, cx * k - x)
    wrap.scrollTop = Math.max(0, cy * k - y)
  })
}

function onWindowSpaceUp(e) {
  if (e.code !== 'Space') return
  e.preventDefault()
  window.removeEventListener('keyup', onWindowSpaceUp, true)
  spaceHoldListener = false
  emit('tool', toolBeforeSpace ?? 'brush')
  toolBeforeSpace = null
}

function fitView() {
  const wrap = wrapRef.value
  if (!wrap) return
  const pad = VIEW_SCROLL_MARGIN
  const tw = props.width
  const th = props.height
  const ts = props.tileSize
  const vw = wrap.clientWidth
  const vh = wrap.clientHeight
  if (vw <= 0 || vh <= 0) return
  const zx = (vw - 2 * pad) / (tw * ts)
  const zy = (vh - 2 * pad) / (th * ts)
  const z = Math.min(zx, zy)
  emit('set-zoom', z)
  nextTick(() => centerViewport())
}

function centerViewport() {
  const wrap = wrapRef.value
  if (!wrap) return
  const pad = VIEW_SCROLL_MARGIN
  const cell = props.tileSize * props.zoom
  const cw = props.width * cell
  const ch = props.height * cell
  const contentW = cw + pad * 2
  const contentH = ch + pad * 2
  const vw = wrap.clientWidth
  const vh = wrap.clientHeight
  if (vw <= 0 || vh <= 0) return
  wrap.scrollLeft = Math.max(0, (contentW - vw) / 2)
  wrap.scrollTop = Math.max(0, (contentH - vh) / 2)
}

function scheduleCenter() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => centerViewport())
  })
}

function cursorForTool() {
  if (panning.value) return 'grabbing'
  if (props.activeTool === 'select') return 'default'
  if (props.activeTool === 'eraser') return 'cell'
  return 'crosshair'
}

function scrollViewportBy(dx, dy) {
  const el = wrapRef.value
  if (!el) return
  el.scrollLeft += dx
  el.scrollTop += dy
}

function onWrapKeyDown(e) {
  const wrap = wrapRef.value
  if (!wrap || document.activeElement !== wrap) return

  if (e.code === 'Space') {
    e.preventDefault()
    if (e.repeat) return
    if (!spaceHoldListener) {
      spaceHoldListener = true
      toolBeforeSpace = props.activeTool
      emit('tool', 'select')
      window.addEventListener('keyup', onWindowSpaceUp, true)
    }
    return
  }

  let dx = 0
  let dy = 0
  if (e.key === 'ArrowLeft') dx = -KEY_SCROLL_STEP
  else if (e.key === 'ArrowRight') dx = KEY_SCROLL_STEP
  else if (e.key === 'ArrowUp') dy = -KEY_SCROLL_STEP
  else if (e.key === 'ArrowDown') dy = KEY_SCROLL_STEP
  else return
  e.preventDefault()
  scrollViewportBy(dx, dy)
}

watch(
  () => [
    props.layers,
    props.width,
    props.height,
    props.tileSize,
    props.zoom,
    props.pickedCell,
    props.activeTool,
    props.activeLayerIndex,
    props.showGridOverlay,
    props.showOriginMarker,
    props.showRefLabels,
  ],
  () => draw(),
  { deep: true }
)

watch(
  () => [props.width, props.height, props.tileSize],
  async () => {
    await nextTick()
    scheduleCenter()
  }
)

onMounted(async () => {
  draw()
  window.addEventListener('resize', draw)
  await nextTick()
  scheduleCenter()
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
  window.removeEventListener('keyup', onWindowSpaceUp, true)
})
</script>

<template>
  <div class="viewport-shell">
    <div
      ref="wrapRef"
      class="viewport-scroll viewport-scroll--hide-scrollbar"
      tabindex="0"
      @keydown="onWrapKeyDown"
    >
      <div
        ref="padRef"
        class="canvas-pad"
        :class="{ 'is-panning': panning }"
        :style="{
          padding: `${VIEW_SCROLL_MARGIN}px`,
          cursor: cursorForTool(),
        }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerLeave"
        @contextmenu.prevent
        @wheel="onWheel"
      >
        <canvas ref="canvasRef" class="tile-canvas" tabindex="-1" />
      </div>
    </div>
    <!-- 覆盖层不参与滚动：工具栏与「显示」共用一个父节点，左右分列 -->
    <div class="viewport-ui" aria-hidden="false">
      <div class="viewport-chrome">
        <div class="viewport-chrome-left">
          <CanvasToolsBar
            :active-tool="activeTool"
            @select="(t) => emit('tool', t)"
            @fit-view="fitView"
            @center-view="centerViewport"
          />
        </div>
        <div class="viewport-chrome-spacer" aria-hidden="true" />
        <div class="viewport-chrome-right" aria-label="显示辅助">
          <CanvasDisplayPanel
            :show-grid="showGridOverlay"
            :show-origin="showOriginMarker"
            :show-ref-labels="showRefLabels"
            @update:show-grid="emit('update:showGridOverlay', $event)"
            @update:show-origin="emit('update:showOriginMarker', $event)"
            @update:show-ref-labels="emit('update:showRefLabels', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport-shell {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  background: var(--win-canvas-bg);
  /* 滚动在 viewport-scroll 内完成，避免画布像素变高时把外壳撑出主窗口 */
  overflow: hidden;
}
.viewport-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  outline: none;
  /* 不要用 text-align:center + inline-block 居中：部分环境下纵向 scrollHeight 异常，只能横向拖动画布 */
}
.viewport-scroll:focus-visible {
  outline: 2px solid var(--win-accent);
  outline-offset: 1px;
}
.viewport-scroll--hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.viewport-scroll--hide-scrollbar::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.viewport-ui {
  position: absolute;
  inset: 0;
  z-index: 5;
  padding: 10px;
  pointer-events: none;
}
.viewport-chrome {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  pointer-events: none;
}
.viewport-chrome-left,
.viewport-chrome-right {
  flex-shrink: 0;
  pointer-events: none;
}
.viewport-chrome-left :deep(.ctb),
.viewport-chrome-right :deep(.dtb) {
  pointer-events: auto;
}
.viewport-chrome-spacer {
  flex: 1;
  min-width: 0;
  align-self: stretch;
  pointer-events: none;
}
.viewport-chrome-right {
  max-width: min(168px, calc(100% - 20px));
}
.canvas-pad {
  display: block;
  width: max-content;
  max-width: none;
  margin-left: auto;
  margin-right: auto;
  box-sizing: content-box;
}
.tile-canvas {
  display: block;
  vertical-align: top;
  touch-action: none;
}
.canvas-pad.is-panning {
  cursor: grabbing !important;
}
</style>
