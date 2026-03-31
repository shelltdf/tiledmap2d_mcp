<script setup>
import { computed } from 'vue'

const props = defineProps({
  types: { type: Array, required: true },
  selectedId: { type: Number, required: true },
})

const emit = defineEmits(['collapse'])

const block = computed(() => props.types.find((t) => t.id === props.selectedId) ?? null)
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
      <div class="field row">
        <span class="label">颜色</span>
        <span v-if="block.color" class="swatch" :style="{ background: block.color }" />
        <span v-else class="value muted">（透明格 / 空）</span>
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
  border: 1px solid var(--win-border);
  border-radius: 4px;
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
.field.row {
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
.swatch {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--win-border);
}
.hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--win-text-secondary);
}
</style>
