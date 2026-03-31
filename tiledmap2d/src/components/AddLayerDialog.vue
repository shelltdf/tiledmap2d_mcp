<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])

const kind = ref('tile')
const insert = ref('above')

watch(
  () => props.open,
  (v) => {
    if (v) {
      kind.value = 'tile'
      insert.value = 'above'
    }
  }
)

function onOk() {
  emit('confirm', { kind: kind.value, insert: insert.value })
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
      class="dlg-overlay"
      role="presentation"
      @click.self="onCancel"
    >
      <div
        class="dlg win-panel"
        role="dialog"
        aria-labelledby="add-layer-title"
        aria-modal="true"
        @keydown.escape.prevent="onCancel"
      >
        <div class="dlg-head">
          <h2 id="add-layer-title" class="dlg-title">添加图层</h2>
          <button type="button" class="win-btn" @click="onCancel">取消</button>
        </div>
        <div class="dlg-body">
          <div class="field">
            <div class="label">层类型</div>
            <select v-model="kind" class="sel">
              <option value="tile">Tiled 瓦片层</option>
              <option value="image">图片层</option>
            </select>
          </div>
          <div class="field">
            <div class="label">插入位置</div>
            <div class="radios">
              <label><input v-model="insert" type="radio" value="above" /> 当前层之上</label>
              <label><input v-model="insert" type="radio" value="below" /> 当前层之下</label>
              <label><input v-model="insert" type="radio" value="top" /> 最上层</label>
              <label><input v-model="insert" type="radio" value="bottom" /> 最下层</label>
            </div>
          </div>
          <p class="hint">
            绘制与拾取仅作用于 <strong>Tiled 瓦片层</strong>；图片层为占位叠色（后续可接贴图）。
          </p>
        </div>
        <div class="dlg-foot">
          <button type="button" class="win-btn primary" @click="onOk">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  width: min(400px, 100%);
  max-height: min(80vh, 520px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--win-shadow-dialog);
}
.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--win-border-strong);
  background: linear-gradient(180deg, #ffffff 0%, #ececec 100%);
}
.dlg-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}
.dlg-body {
  padding: 12px 14px;
  overflow: auto;
  font-size: 13px;
}
.dlg-foot {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--win-border-strong);
  display: flex;
  justify-content: flex-end;
  background: var(--win-chrome);
}
.field {
  margin-bottom: 14px;
}
.label {
  font-size: 12px;
  font-weight: 600;
  color: var(--win-text-secondary);
  margin-bottom: 6px;
}
.sel {
  width: 100%;
  padding: 4px 8px;
  font: inherit;
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-btn);
  background: var(--win-surface);
  color: var(--win-text);
}
.radios {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.radios label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--win-text-secondary);
}
</style>
