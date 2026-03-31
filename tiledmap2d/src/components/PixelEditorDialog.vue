<script setup>
import { ref, watch, nextTick, computed, inject } from 'vue'

const shell = inject('appShell', null)
const t = (path, ...args) => shell?.t?.(path, ...args) ?? path

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 地图全局瓦片边长（默认纹理尺寸） */
  mapTileSize: { type: Number, default: 32 },
  /** 当前编辑的块；为 null 时不绘制内容 */
  tileType: { type: Object, default: null },
  /** 无底图时的填充色（填满工具） */
  fallbackColor: { type: String, default: '#888888' },
})

const emit = defineEmits(['close', 'save'])

const canvasRef = ref(null)
const importInputRef = ref(null)
const brushColor = ref('#000000')
const painting = ref(false)

/** 纹理像素宽/高（可与地图 tileSize 独立） */
const pixelW = ref(32)
const pixelH = ref(32)
const localName = ref('')
const localCollision = ref('none')
const transparentEnabled = ref(false)
const transparentHex = ref('#FF00FF')
const localColorDepthMode = ref('rgba8')
/** 有未保存更改时为 true；保存成功后为 false */
const dirty = ref(false)

const displayScale = 12

const brushColorHex = computed(() => {
  const s = String(brushColor.value || '#000000').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toUpperCase()
  return s
})

const colorDepthLabel = computed(() => {
  shell?.locale?.value
  if (localColorDepthMode.value === 'indexed8') {
    return t('pixelEditor.depthIndexed')
  }
  return t('pixelEditor.depthRgba')
})

function clampSize(n) {
  return Math.max(8, Math.min(128, Math.floor(Number(n)) || 32))
}

function markDirty() {
  dirty.value = true
}

function initFromTileType() {
  const t = props.tileType
  const mapTs = Math.max(8, Math.min(128, Math.floor(props.mapTileSize) || 32))
  if (!t) return
  localName.value = String(t.name ?? '')
  pixelW.value = clampSize(t.textureWidth ?? mapTs)
  pixelH.value = clampSize(t.textureHeight ?? mapTs)
  localCollision.value = t.collisionType === 'block' ? 'block' : 'none'
  const tc = t.transparentColor
  transparentEnabled.value = !!(
    tc &&
    typeof tc === 'string' &&
    /^#[0-9a-fA-F]{6}$/.test(tc.trim())
  )
  transparentHex.value =
    transparentEnabled.value && tc
      ? String(tc).trim().toUpperCase()
      : '#FF00FF'
  localColorDepthMode.value =
    t.colorDepthMode === 'indexed8' ? 'indexed8' : 'rgba8'
  dirty.value = false
}

watch(
  () => [props.open, props.tileType?.id],
  () => {
    if (!props.open || !props.tileType) return
    initFromTileType()
    nextTick(() => syncCanvasFromProps())
  },
)

function syncCanvasFromProps() {
  const canvas = canvasRef.value
  if (!canvas || !props.open || !props.tileType) return
  const w = clampSize(pixelW.value)
  const h = clampSize(pixelH.value)
  pixelW.value = w
  pixelH.value = h
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const url = props.tileType.imageDataUrl
  if (url) {
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
    }
    img.onerror = () => {
      ctx.fillStyle = props.fallbackColor
      ctx.fillRect(0, 0, w, h)
    }
    img.src = url
  } else {
    ctx.fillStyle = props.fallbackColor
    ctx.fillRect(0, 0, w, h)
  }
}

function applyPixelSizeFromInputs() {
  const canvas = canvasRef.value
  if (!canvas || !props.open) return
  const w = clampSize(pixelW.value)
  const h = clampSize(pixelH.value)
  pixelW.value = w
  pixelH.value = h
  if (canvas.width === w && canvas.height === h) return
  const prevUrl = canvas.toDataURL()
  const img = new Image()
  img.onload = () => {
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = props.fallbackColor
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    markDirty()
  }
  img.onerror = () => {
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = props.fallbackColor
      ctx.fillRect(0, 0, w, h)
    }
    markDirty()
  }
  img.src = prevUrl
}

function clientToPixel(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const cw = canvas.width
  const ch = canvas.height
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * cw)
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * ch)
  if (x < 0 || y < 0 || x >= cw || y >= ch) return null
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
  markDirty()
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
  if (!window.confirm(t('pixelEditor.confirmFill'))) {
    return
  }
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = props.fallbackColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  markDirty()
}

function buildSavePayload() {
  const canvas = canvasRef.value
  if (!canvas || !props.tileType) return null
  const name = String(localName.value ?? '').trim()
  if (!name) return null
  return {
    imageDataUrl: canvas.toDataURL('image/png'),
    name,
    textureWidth: clampSize(pixelW.value),
    textureHeight: clampSize(pixelH.value),
    collisionType: localCollision.value === 'block' ? 'block' : 'none',
    transparentColor:
      transparentEnabled.value &&
      /^#[0-9a-fA-F]{6}$/.test(String(transparentHex.value).trim())
        ? String(transparentHex.value).trim().toUpperCase()
        : null,
    colorDepthMode:
      localColorDepthMode.value === 'indexed8' ? 'indexed8' : 'rgba8',
  }
}

function onSave() {
  const payload = buildSavePayload()
  if (!payload) {
    window.alert(t('pixelEditor.nameRequiredAlert'))
    return
  }
  emit('save', payload)
  dirty.value = false
}

function onCancel() {
  emit('close')
}

function onImportClick() {
  importInputRef.value?.click()
}

function onImportFile(e) {
  const input = e.target
  const f = input.files?.[0]
  input.value = ''
  if (!f || !/^image\//.test(f.type)) return
  if (!window.confirm(t('pixelEditor.confirmImportReplace'))) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = String(reader.result ?? '')
    const canvas = canvasRef.value
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      markDirty()
    }
    img.onerror = () => {}
    img.src = dataUrl
  }
  reader.readAsDataURL(f)
}

function onExportClick() {
  const canvas = canvasRef.value
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `pixel-${(localName.value || 'tile').replace(/[^\w\u4e00-\u9fff-]+/g, '_') || 'tile'}.png`
  a.click()
}

function onNameInput() {
  markDirty()
}

function onCollisionChange() {
  markDirty()
}

function onTransparentToggle() {
  markDirty()
}

function onTransparentColorInput() {
  markDirty()
}

function onColorDepthChange() {
  markDirty()
}

</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && tileType"
      class="dlg-overlay"
      role="presentation"
      @click.self="onCancel"
    >
      <div
        class="dlg win-panel"
        role="dialog"
        aria-labelledby="pixel-editor-title"
        aria-modal="true"
        @keydown.escape.prevent="onCancel"
      >
        <div class="dlg-head">
          <h2 id="pixel-editor-title" class="dlg-title">
            {{ t('pixelEditor.titlePrefix') }} —
            {{ localName || t('pixelEditor.tileFallback') }}
          </h2>
          <button
            type="button"
            class="dlg-close-ico"
            :aria-label="t('pixelEditor.close')"
            :title="t('pixelEditor.close')"
            @click="onCancel"
          >
            <span class="dlg-close-glyph" aria-hidden="true">×</span>
          </button>
        </div>

        <div
          class="pe-menu-toolbar win-chrome-strip"
          role="toolbar"
          :aria-label="t('pixelEditor.toolbarAria')"
        >
          <button
            type="button"
            class="win-btn"
            :class="dirty ? 'pe-save-dirty' : 'primary'"
            @click="onSave"
          >
            {{ t('pixelEditor.save') }}
          </button>
          <button type="button" class="win-btn" @click="onImportClick">
            {{ t('pixelEditor.import') }}
          </button>
          <input
            ref="importInputRef"
            type="file"
            class="sr-only"
            accept="image/png,image/jpeg,image/gif,image/webp,image/*"
            tabindex="-1"
            aria-hidden="true"
            @change="onImportFile"
          />
          <button type="button" class="win-btn" @click="onExportClick">
            {{ t('pixelEditor.export') }}
          </button>
        </div>

        <div class="dlg-body pe-workspace">
          <aside class="pe-toolrail" :aria-label="t('pixelEditor.toolrailAria')">
            <span class="pe-toolrail-label">{{ t('pixelEditor.color') }}</span>
            <label class="pe-color-swatch" :title="t('pixelEditor.fgColorTitle')">
              <input
                v-model="brushColor"
                type="color"
                class="pe-color-input"
                @input="markDirty"
              />
            </label>
            <button
              type="button"
              class="win-btn pe-toolrail-btn"
              :title="t('pixelEditor.fillCanvasTitle')"
              @click="onClear"
            >
              {{ t('pixelEditor.fill') }}
            </button>
          </aside>

          <div class="pe-canvas-pane">
            <div class="pe-canvas-wrap">
              <div
                class="pe-canvas-stack"
                :style="{
                  width: pixelW * displayScale + 'px',
                  height: pixelH * displayScale + 'px',
                }"
              >
                <canvas
                  ref="canvasRef"
                  class="pe-canvas"
                  :style="{
                    width: pixelW * displayScale + 'px',
                    height: pixelH * displayScale + 'px',
                    imageRendering: 'pixelated',
                  }"
                  @pointerdown="onPointerDown"
                  @pointermove="onPointerMove"
                  @pointerup="onPointerUp"
                  @pointerleave="painting = false"
                />
                <div
                  class="pe-pixel-grid"
                  aria-hidden="true"
                  :style="{
                    backgroundSize: `${displayScale}px ${displayScale}px`,
                  }"
                />
              </div>
            </div>
            <p class="pe-canvas-hint">
              {{ pixelW }}×{{ pixelH }}
              {{ t('pixelEditor.canvasHintSuffix') }}
            </p>
          </div>

          <aside class="pe-props win-panel" :aria-label="t('pixelEditor.propsAria')">
            <div class="pe-props-title">{{ t('pixelEditor.propsTitle') }}</div>
            <dl class="pe-props-dl">
              <div class="pe-props-row pe-props-row--full">
                <dt>{{ t('pixelEditor.name') }}</dt>
                <dd>
                  <input
                    v-model="localName"
                    type="text"
                    class="pe-inp"
                    maxlength="64"
                    @input="onNameInput"
                  />
                </dd>
              </div>
              <div class="pe-props-row pe-props-row--full">
                <dt>{{ t('pixelEditor.size') }}</dt>
                <dd class="pe-size-row">
                  <input
                    v-model.number="pixelW"
                    type="number"
                    class="pe-inp pe-inp-num"
                    min="8"
                    max="128"
                    @change="applyPixelSizeFromInputs"
                  />
                  <span class="pe-size-x">×</span>
                  <input
                    v-model.number="pixelH"
                    type="number"
                    class="pe-inp pe-inp-num"
                    min="8"
                    max="128"
                    @change="applyPixelSizeFromInputs"
                  />
                  <span class="pe-size-unit">px</span>
                </dd>
              </div>
              <div class="pe-props-row pe-props-row--full">
                <dt>{{ t('pixelEditor.collision') }}</dt>
                <dd>
                  <select
                    v-model="localCollision"
                    class="pe-sel"
                    @change="onCollisionChange"
                  >
                    <option value="none">{{ t('pixelEditor.colNone') }}</option>
                    <option value="block">{{ t('pixelEditor.colBlock') }}</option>
                  </select>
                </dd>
              </div>
              <div class="pe-props-row pe-props-row--full">
                <dt>{{ t('pixelEditor.transparent') }}</dt>
                <dd class="pe-trans-wrap">
                  <label class="pe-check">
                    <input
                      v-model="transparentEnabled"
                      type="checkbox"
                      @change="onTransparentToggle"
                    />
                    {{ t('pixelEditor.transparentEnable') }}
                  </label>
                  <input
                    v-model="transparentHex"
                    type="color"
                    class="pe-trans-color"
                    :disabled="!transparentEnabled"
                    @input="onTransparentColorInput"
                  />
                  <span class="mono pe-trans-hex">{{ transparentHex }}</span>
                </dd>
              </div>
              <div class="pe-props-row pe-props-row--full">
                <dt>{{ t('pixelEditor.colorDepth') }}</dt>
                <dd>
                  <select
                    v-model="localColorDepthMode"
                    class="pe-sel"
                    @change="onColorDepthChange"
                  >
                    <option value="rgba8">{{ t('blockDef.rgba') }}</option>
                    <option value="indexed8">{{ t('blockDef.indexed') }}</option>
                  </select>
                  <p class="pe-depth-hint">{{ colorDepthLabel }}</p>
                </dd>
              </div>
              <div class="pe-props-row">
                <dt>{{ t('pixelEditor.brushColor') }}</dt>
                <dd class="mono">{{ brushColorHex }}</dd>
              </div>
              <div class="pe-props-row">
                <dt>{{ t('pixelEditor.fillColor') }}</dt>
                <dd class="pe-swatch-inline">
                  <span
                    class="pe-swatch-dot"
                    :style="{ background: fallbackColor }"
                  />
                  <span class="mono">{{ fallbackColor }}</span>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
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
  width: min(760px, 100%);
  max-height: min(92vh, 760px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--win-shadow-dialog);
}
.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px 8px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--win-border-strong);
  background: linear-gradient(180deg, #ffffff 0%, #ececec 100%);
}
.dlg-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dlg-close-ico {
  flex-shrink: 0;
  width: 26px;
  height: 22px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--win-radius-btn);
  background: transparent;
  color: var(--win-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.dlg-close-ico:hover {
  background: rgba(209, 52, 56, 0.12);
  border-color: #e81123;
  color: #e81123;
}
.dlg-close-glyph {
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
  transform: translateY(-1px);
}
.pe-menu-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--win-border-strong);
}
/* 未保存：红色强调；已保存：蓝色 primary */
.pe-save-dirty {
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%) !important;
  border-color: #a93226 !important;
  color: #fff !important;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset;
}
.pe-save-dirty:hover {
  background: linear-gradient(180deg, #ec7063 0%, #cb4335 100%) !important;
  border-color: #cb4335 !important;
}
.dlg-body.pe-workspace {
  padding: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  font-size: 13px;
}
.pe-toolrail {
  flex: 0 0 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-right: 1px solid var(--win-border-strong);
  background: var(--win-chrome);
}
.pe-toolrail-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--win-text-secondary);
  user-select: none;
  text-align: center;
  width: 100%;
}
.pe-color-swatch {
  width: 36px;
  height: 36px;
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-btn);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  display: block;
  background: var(--win-surface);
  box-shadow: var(--win-shadow-panel);
}
.pe-color-input {
  width: 44px;
  height: 44px;
  margin: -4px;
  padding: 0;
  border: none;
  cursor: pointer;
}
.pe-toolrail-btn {
  width: 100%;
  padding-left: 4px;
  padding-right: 4px;
  font-size: 11px;
}
.pe-canvas-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 12px;
  gap: 8px;
  overflow: auto;
  background: var(--win-surface);
}
.pe-canvas-wrap {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 10px;
  background: var(--win-canvas-bg);
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-panel);
  max-width: 100%;
}
.pe-canvas-stack {
  position: relative;
  display: block;
  flex-shrink: 0;
}
.pe-canvas {
  display: block;
  touch-action: none;
  cursor: crosshair;
  vertical-align: top;
}
.pe-pixel-grid {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 1px, transparent 1px);
  background-position: 0 0;
}
.pe-canvas-hint {
  margin: 0;
  font-size: 11px;
  color: var(--win-text-secondary);
  text-align: center;
}
.pe-props {
  flex: 0 0 200px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-left: 1px solid var(--win-border-strong);
  border-radius: 0;
  background: var(--win-chrome);
  box-shadow: none;
  overflow: auto;
}
.pe-props-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--win-text-secondary);
  margin: 0 0 4px;
  user-select: none;
}
.pe-props-dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pe-props-row {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 6px;
  align-items: start;
  font-size: 12px;
}
.pe-props-row--full {
  grid-template-columns: 52px 1fr;
}
.pe-props-row dt {
  margin: 0;
  padding-top: 4px;
  color: var(--win-text-secondary);
  font-weight: normal;
}
.pe-props-row dd {
  margin: 0;
  color: var(--win-text);
  word-break: break-word;
  min-width: 0;
}
.pe-inp {
  width: 100%;
  padding: 3px 6px;
  font: inherit;
  font-size: 12px;
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-btn);
  background: var(--win-surface);
  color: var(--win-text);
}
.pe-inp-num {
  width: 52px;
}
.pe-size-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.pe-size-x {
  color: var(--win-text-secondary);
  user-select: none;
}
.pe-size-unit {
  font-size: 11px;
  color: var(--win-text-secondary);
}
.pe-sel {
  width: 100%;
  padding: 3px 6px;
  font: inherit;
  font-size: 12px;
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-btn);
  background: var(--win-surface);
  color: var(--win-text);
}
.pe-trans-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.pe-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
}
.pe-trans-color {
  width: 28px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--win-border-strong);
  border-radius: 2px;
  cursor: pointer;
}
.pe-trans-color:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.pe-trans-hex {
  font-size: 10px;
}
.pe-depth-hint {
  margin: 4px 0 0;
  font-size: 10px;
  line-height: 1.35;
  color: var(--win-text-secondary);
}
.mono {
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 11px;
}
.pe-swatch-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pe-swatch-dot {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid var(--win-border-strong);
  flex-shrink: 0;
}
</style>
