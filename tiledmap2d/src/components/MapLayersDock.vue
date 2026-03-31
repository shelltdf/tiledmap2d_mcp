<script setup>
defineProps({
  layers: { type: Array, required: true },
  activeIndex: { type: Number, required: true },
})

const emit = defineEmits([
  'select',
  'toggle-visible',
  'open-add-dialog',
  'rename-active',
  'remove-active',
  'reorder',
  'collapse',
])

function onDragStart(e, index) {
  e.dataTransfer.setData('text/plain', String(index))
  e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e) {
  e.preventDefault()
}

function onDrop(e, toIndex) {
  e.preventDefault()
  const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
  if (Number.isNaN(from)) return
  emit('reorder', { from, to: toIndex })
}

function kindLabel(layer) {
  return (layer?.kind || 'tile') === 'image' ? '图' : '瓦'
}
</script>

<template>
  <aside class="dock dock--fill win-panel" aria-label="地图层">
    <div class="dock-head">
      <div class="dock-title">地图层</div>
      <button
        type="button"
        class="dock-collapse-btn"
        title="折叠到左缘"
        aria-label="折叠地图层面板"
        @click="emit('collapse')"
      >
        ⟨
      </button>
    </div>
    <div class="dock-actions">
      <button
        type="button"
        class="win-btn btn-sm"
        title="添加图层"
        @click="emit('open-add-dialog')"
      >
        添加
      </button>
      <button
        type="button"
        class="win-btn btn-sm"
        title="重命名当前选中图层"
        @click="emit('rename-active')"
      >
        改名
      </button>
      <button
        type="button"
        class="win-btn btn-sm btn-danger"
        title="删除当前选中图层"
        :disabled="layers.length <= 1"
        @click="emit('remove-active')"
      >
        删除
      </button>
    </div>
    <ul
      class="layer-list"
      role="listbox"
      :aria-activedescendant="'layer-' + activeIndex"
    >
      <li
        v-for="(layer, index) in layers"
        :id="'layer-' + index"
        :key="layer.id"
        class="layer-row"
        :class="{ active: index === activeIndex }"
        role="option"
        :aria-selected="index === activeIndex"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragover="onDragOver"
        @drop="onDrop($event, index)"
        @click="emit('select', index)"
      >
        <span
          class="kind-badge"
          :title="kindLabel(layer) === '图' ? '图片层' : '瓦片层'"
        >{{ kindLabel(layer) }}</span>
        <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
        <label class="vis-toggle" :title="layer.visible ? '隐藏' : '显示'" @click.stop>
          <input
            type="checkbox"
            :checked="layer.visible"
            @change="emit('toggle-visible', index, $event.target.checked)"
          />
          <span class="vis-label">{{ layer.visible ? '显' : '隐' }}</span>
        </label>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.dock--fill {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
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
.dock-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
.btn-danger {
  color: #b00020;
  border-color: #e5c6c6;
}
.btn-danger:hover:not(:disabled) {
  background: #fde7e9;
}
.layer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
  min-height: 0;
  flex: 1;
}
.layer-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border: 1px solid var(--win-border);
  border-radius: 4px;
  background: var(--win-surface);
  cursor: grab;
  user-select: none;
}
.layer-row:active {
  cursor: grabbing;
}
.layer-row.active {
  outline: 2px solid var(--win-accent);
  outline-offset: -1px;
  background: var(--win-list-active);
}
.kind-badge {
  font-size: 10px;
  font-weight: 600;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: var(--win-hover);
  color: var(--win-text-secondary);
  flex-shrink: 0;
}
.layer-name {
  font-size: 12px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--win-text);
}
.vis-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--win-text-secondary);
  cursor: pointer;
  user-select: none;
}
.vis-toggle input {
  margin: 0;
}
.vis-label {
  width: 1.25em;
  text-align: center;
}
</style>
