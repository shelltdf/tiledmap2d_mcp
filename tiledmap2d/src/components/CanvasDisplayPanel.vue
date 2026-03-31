<script setup>
defineProps({
  showGrid: { type: Boolean, default: false },
  showOrigin: { type: Boolean, default: false },
  showRefLabels: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:showGrid',
  'update:showOrigin',
  'update:showRefLabels',
])
</script>

<template>
  <div class="dtb win-panel" role="group" aria-label="显示辅助">
    <div class="dtb-title">显示</div>
    <label class="dtb-row">
      <input
        type="checkbox"
        :checked="showGrid"
        @change="emit('update:showGrid', $event.target.checked)"
      />
      <span>网格</span>
    </label>
    <label class="dtb-row">
      <input
        type="checkbox"
        :checked="showOrigin"
        @change="emit('update:showOrigin', $event.target.checked)"
      />
      <span>原点</span>
    </label>
    <label class="dtb-row">
      <input
        type="checkbox"
        :checked="showRefLabels"
        @change="emit('update:showRefLabels', $event.target.checked)"
      />
      <span>参考</span>
    </label>
  </div>
</template>

<style scoped>
.dtb {
  width: auto;
  min-width: 72px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  user-select: none;
  font-size: 12px;
}
.dtb-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--win-text-secondary);
  width: 100%;
  text-align: right;
  padding: 0 2px 4px;
}
.dtb-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin: 0;
  cursor: pointer;
  color: var(--win-text);
}
.dtb-row input {
  margin: 0;
}
</style>
