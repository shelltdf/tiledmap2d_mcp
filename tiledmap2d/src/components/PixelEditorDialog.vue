<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 纹理边长（与地图 tileSize 一致） */
  tileSize: { type: Number, default: 32 },
  /** 已有贴图 */
  initialDataUrl: { type: String, default: null },
  /** 无底图时的填充色 */
  fallbackColor: { type: String, default: '#888888' },
  /** 块名称（仅标题展示） */
  typeName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const canvasRef = ref(null)
const brushColor = ref('#000000')
const painting = ref(false)

const displayScale = 12

function syncCanvasFromProps() {
  const canvas = canvasRef.value
  if (!canvas || !props.open) return
  const n = Math.max(8, Math.min(128, Math.floor(props.tileSize) || 32))
  canvas.width = n
  canvas.height = n
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (props.initialDataUrl) {
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, n, n)
      ctx.drawImage(img, 0, 0, n, n)
    }
    img.onerror = () => {
      ctx.fillStyle = props.fallbackColor
      ctx.fillRect(0, 0, n, n)
    }
    img.src = props.initialDataUrl
  } else {
    ctx.fillStyle = props.fallbackColor
    ctx.fillRect(0, 0, n, n)
  }
}

watch(
  () => [props.open, props.tileSize, props.initialDataUrl],
  () => {
    if (!props.open) return
    nextTick(() => syncCanvasFromProps())
  }
)

function clientToPixel(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const n = canvas.width
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * n)
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * n)
  if (x < 0 || y < 0 || x >= n || y >= n) return null
  return { x, y }
}

function paintAt(e) {
  const p = clientToPixel(e)
  if (!p) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = brushColor.value
  ctx.fillRect(p.x, p.y, 1, 1)
}

function onPointerDown(e) {
  e.preventDefault()
  painting.value = true
  paintAt(e)
  canvasRef.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!painting.value) return
  paintAt(e)
}

function onPointerUp(e) {
  painting.value = false
  try {
    canvasRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    /* noop */
  }
}

function onClear() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = props.fallbackColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function onConfirm() {
  const canvas = canvasRef.value
  if (!canvas) return
  emit('save', canvas.toDataURL('image/png'))
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
      class="pe-overlay"
      role="presentation"
      @click.self="onCancel"
    >
      <div
        class="pe-dlg win-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="'像素编辑：' + (typeName || '块')"
        @keydown.escape.prevent="onCancel"
      >
        <div class="pe-head">
          <h2 class="pe-title">像素编辑 — {{ typeName || '块' }}</h2>
          <button type="button" class="win-btn" @click="onCancel">关闭</button>
        </div>
        <p class="pe-hint">
          {{ tileSize }}×{{ tileSize }} 像素；拖拽绘制（单像素笔刷）
        </p>
        <div class="pe-tools">
          <label class="pe-label">
            颜色
            <input v-model="brushColor" type="color" class="pe-color" />
          </label>
          <button type="button" class="win-btn" @click="onClear">用底色填满</button>
        </div>
        <div class="pe-canvas-wrap">
          <canvas
            ref="canvasRef"
            class="pe-canvas"
            :style="{
              width: tileSize * displayScale + 'px',
              height: tileSize * displayScale + 'px',
              imageRendering: 'pixelated',
            }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointerleave="painting = false"
          />
        </div>
        <div class="pe-actions">
          <button type="button" class="win-btn" @click="onCancel">取消</button>
          <button type="button" class="win-btn primary" @click="onConfirm">
            保存到当前块
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pe-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.pe-dlg {
  max-width: min(96vw, 520px);
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pe-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pe-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.pe-hint {
  margin: 0;
  font-size: 12px;
  color: var(--win-text-secondary);
}
.pe-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.pe-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
}
.pe-color {
  width: 36px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--win-border);
  cursor: pointer;
}
.pe-canvas-wrap {
  display: flex;
  justify-content: center;
  padding: 8px;
  background: var(--win-canvas-bg);
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius-panel);
  overflow: auto;
  max-height: 60vh;
}
.pe-canvas {
  display: block;
  touch-action: none;
  cursor: crosshair;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}
.pe-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
