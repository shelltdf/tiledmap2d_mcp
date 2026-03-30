<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  tiles: { type: Array, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  tileSize: { type: Number, required: true },
  zoom: { type: Number, required: true },
  selectedTileId: { type: Number, required: true },
  tileTypes: { type: Array, required: true },
})

const emit = defineEmits(['paint', 'cursor', 'zoom-wheel'])

const canvasRef = ref(null)
const wrapRef = ref(null)
let painting = false

function colorForTileId(id) {
  const t = props.tileTypes.find((x) => x.id === id)
  return t?.color ?? '#ccc'
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
      const id = props.tiles[gy][gx]
      if (id === 0) {
        const odd = (gx + gy) % 2 === 0
        ctx.fillStyle = odd ? light : dark
        ctx.fillRect(x, y, cell, cell)
      } else {
        ctx.fillStyle = colorForTileId(id)
        ctx.fillRect(x, y, cell, cell)
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
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

function onPointerDown(e) {
  if (e.button === 1) return
  canvasRef.value?.setPointerCapture(e.pointerId)
  const cell = eventToCell(e)
  emit('cursor', cell)
  if (e.button === 0) {
    painting = true
    if (cell) emit('paint', cell.gx, cell.gy, props.selectedTileId)
  } else if (e.button === 2) {
    painting = true
    if (cell) emit('paint', cell.gx, cell.gy, 0)
  }
}

function onPointerMove(e) {
  const cell = eventToCell(e)
  emit('cursor', cell)
  if (!painting) return
  if (cell) {
    const id = e.buttons === 2 ? 0 : props.selectedTileId
    emit('paint', cell.gx, cell.gy, id)
  }
}

function onPointerUp(e) {
  painting = false
  try {
    canvasRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    /* noop */
  }
}

function onWheel(e) {
  e.preventDefault()
  emit('zoom-wheel', e.deltaY)
}

watch(
  () => [props.tiles, props.width, props.height, props.tileSize, props.zoom],
  () => draw(),
  { deep: true }
)

onMounted(() => {
  draw()
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
})
</script>

<template>
  <div ref="wrapRef" class="viewport-scroll win-scrollbar">
    <canvas
      ref="canvasRef"
      class="tile-canvas"
      @pointerdown.prevent="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
      @contextmenu.prevent
      @wheel="onWheel"
    />
  </div>
</template>

<style scoped>
.viewport-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--win-canvas-bg);
  border: 1px solid var(--win-border);
  border-radius: 4px;
}
.tile-canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
}
</style>
