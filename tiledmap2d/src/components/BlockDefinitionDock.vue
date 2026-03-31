<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  types: { type: Array, required: true },
  selectedId: { type: Number, required: true },
  /** 地图瓦片边长；无独立纹理尺寸时作预览占位 */
  tileSize: { type: Number, default: 32 },
})

const emit = defineEmits(['collapse'])

const block = computed(() => props.types.find((t) => t.id === props.selectedId) ?? null)

/** 贴图在 DOM 中解码后的像素尺寸；预览区 1 图像像素 = 1 CSS 像素，不放大 */
const imgNatural = ref({ w: 0, h: 0 })

const fallbackTexW = computed(() => {
  const b = block.value
  if (!b) return 32
  const tw = b.textureWidth
  if (tw != null && Number.isFinite(tw)) {
    return Math.max(8, Math.min(128, Math.floor(tw)))
  }
  return Math.max(8, Math.min(128, Math.floor(props.tileSize) || 32))
})

const fallbackTexH = computed(() => {
  const b = block.value
  if (!b) return 32
  const th = b.textureHeight
  if (th != null && Number.isFinite(th)) {
    return Math.max(8, Math.min(128, Math.floor(th)))
  }
  return Math.max(8, Math.min(128, Math.floor(props.tileSize) || 32))
})

const previewImgStyle = computed(() => {
  const b = block.value
  if (!b?.imageDataUrl) return {}
  const nw = imgNatural.value.w
  const nh = imgNatural.value.h
  const w = nw > 0 ? nw : fallbackTexW.value
  const h = nh > 0 ? nh : fallbackTexH.value
  return {
    width: `${w}px`,
    height: `${h}px`,
    imageRendering: 'pixelated',
  }
})

/** 与像素编辑器 / 地图 tileSize 回退逻辑一致 */
const resolutionText = computed(() => {
  if (!block.value) return '—'
  return `${fallbackTexW.value} × ${fallbackTexH.value} px`
})

const colorDepthDisplay = computed(() => {
  if (!block.value) return '—'
  return block.value.colorDepthMode === 'indexed8'
    ? '索引色（8 位）'
    : '真彩色 RGBA'
})

function onPreviewImgLoad(e) {
  const el = e.target
  if (el?.naturalWidth > 0) {
    imgNatural.value = { w: el.naturalWidth, h: el.naturalHeight }
  }
}

watch(
  () => [block.value?.imageDataUrl, block.value?.id],
  () => {
    imgNatural.value = { w: 0, h: 0 }
  },
)
</script>

<template>
  <aside class="dock dock--fill win-panel" aria-label="块定义">
    <div class="dock-head">
      <div class="dock-title">块定义</div>
      <button
        type="button"
        class="dock-collapse-btn"
        title="折叠到右缘"
        aria-label="折叠块定义停靠面板"
        @click="emit('collapse')"
      >
        ⟩
      </button>
    </div>
    <div v-if="block" class="def-body">
      <div class="field">
        <span class="label">ID</span>
        <span class="value mono">{{ block.id }}</span>
      </div>
      <div class="field">
        <span class="label">名称</span>
        <span class="value">{{ block.name }}</span>
      </div>
      <div class="field">
        <span class="label">分辨率</span>
        <span class="value mono">{{ resolutionText }}</span>
      </div>
      <div class="field">
        <span class="label">色彩模式</span>
        <span class="value">{{ colorDepthDisplay }}</span>
      </div>
      <div class="field field--preview">
        <span class="label">颜色</span>
        <div class="preview-box" title="1 像素 = 1 显示像素">
          <img
            v-if="block.imageDataUrl"
            class="preview-img"
            :src="block.imageDataUrl"
            alt=""
            @load="onPreviewImgLoad"
            :style="previewImgStyle"
          />
          <span
            v-else-if="block.color"
            class="preview-solid"
            :style="{ background: block.color }"
          />
          <span v-else class="preview-empty value muted">（透明格 / 空）</span>
        </div>
      </div>
      <p class="hint">
        在「块库」中可导入 / 编辑 / 删除类型；绘制时选中其一作为当前笔刷。
      </p>
    </div>
    <p v-else class="hint">在块库中选择一个块以查看定义。</p>
  </aside>
</template>

<style scoped>
.dock--fill {
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}
.dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.dock-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--win-text-secondary);
  margin: 0;
}
.dock-collapse-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--win-btn-border);
  border-radius: var(--win-radius-btn);
  background: var(--win-surface);
  color: var(--win-text-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.dock-collapse-btn:hover {
  background: var(--win-hover);
}
.def-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
  overflow: auto;
  min-height: 0;
  flex: 1;
}
.field {
  display: grid;
  grid-template-columns: 52px 1fr;
  align-items: center;
  gap: 8px;
}
.field--preview {
  align-items: start;
  grid-template-columns: 52px 1fr;
}
.label {
  color: var(--win-text-secondary);
}
.value {
  color: var(--win-text);
  word-break: break-word;
}
.value.mono {
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
}
.value.muted {
  color: var(--win-text-secondary);
}
/* 贴图：宽高等同图像像素数（1:1），无缩放放大 */
.preview-box {
  flex-shrink: 0;
  box-sizing: border-box;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  background: var(--win-canvas-bg, #e8e8e8);
  display: inline-block;
  overflow: auto;
  max-width: 100%;
  max-height: min(320px, 70vh);
  line-height: 0;
  vertical-align: top;
}
.preview-img {
  display: block;
  vertical-align: top;
}
.preview-solid {
  width: 120px;
  height: 120px;
  display: block;
}
.preview-empty {
  font-size: 11px;
  padding: 4px;
  text-align: center;
  line-height: 1.35;
}
.hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--win-text-secondary);
}
</style>
