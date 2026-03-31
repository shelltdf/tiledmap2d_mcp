<script setup>
defineProps({
  activeTool: { type: String, required: true },
})

const emit = defineEmits(['select', 'fit-view', 'center-view'])

const tools = [
  { id: 'select', label: '选择', title: '选择工具' },
  { id: 'brush', label: '画笔', title: '画笔工具' },
  { id: 'eraser', label: '橡皮', title: '橡皮工具' },
]

function choose(id) {
  emit('select', id)
}
</script>

<template>
  <div class="ctb win-panel" role="toolbar" aria-label="画布工具栏">
    <div class="ctb-title">工具栏</div>
    <button
      v-for="t in tools"
      :key="t.id"
      type="button"
      class="ctb-btn"
      :class="{ active: activeTool === t.id }"
      :title="t.title"
      :aria-label="t.title"
      @click="choose(t.id)"
    >
      <span class="ctb-btn-inner">
      <svg
        v-if="t.id === 'select'"
        class="ctb-ico"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M6 3l12 10-6 1.2L10.8 21 6 3z"
          fill="currentColor"
        />
      </svg>
      <svg
        v-else-if="t.id === 'brush'"
        class="ctb-ico"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M14.6 4.2l5.2 5.2-9.4 9.4c-.6.6-1.4.9-2.2.9H5v-3.2c0-.8.3-1.6.9-2.2l8.7-10.1z"
          fill="currentColor"
        />
        <path
          d="M4 20h6c0 1.7-1.3 3-3 3H4v-3z"
          fill="currentColor"
          opacity="0.75"
        />
      </svg>
      <svg
        v-else
        class="ctb-ico"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M7 14l7.6-7.6a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L14 21H7v-7z"
          fill="currentColor"
        />
        <path
          d="M3 21h18v2H3v-2z"
          fill="currentColor"
          opacity="0.65"
        />
      </svg>
      <span class="ctb-lbl">{{ t.label }}</span>
      </span>
    </button>
    <div class="ctb-sep" role="separator" />
    <button
      type="button"
      class="ctb-btn"
      title="适应窗口（Fit）"
      aria-label="适应窗口"
      @click="emit('fit-view')"
    >
      <span class="ctb-btn-inner">
        <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 8V4h4M16 4h4v4M4 16v4h4M16 20h4v-4M8 8h8v8H8V8z"
          />
        </svg>
        <span class="ctb-lbl">适应</span>
      </span>
    </button>
    <button
      type="button"
      class="ctb-btn"
      title="居中"
      aria-label="居中"
      @click="emit('center-view')"
    >
      <span class="ctb-btn-inner">
        <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
          />
        </svg>
        <span class="ctb-lbl">居中</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.ctb {
  width: auto;
  min-width: 72px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  user-select: none;
}
.ctb-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--win-text-secondary);
  width: 100%;
  text-align: left;
  padding: 0 4px 2px;
}
.ctb-btn-inner {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
}
.ctb-lbl {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}
.ctb-btn {
  width: 100%;
  min-height: 30px;
  height: auto;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid var(--win-border);
  border-radius: 6px;
  background: var(--win-surface);
  color: var(--win-text);
  cursor: pointer;
}
.ctb-btn:hover {
  background: var(--win-hover);
}
.ctb-btn.active {
  outline: 2px solid var(--win-accent);
  outline-offset: -1px;
  background: var(--win-list-active);
}
.ctb-ico {
  width: 18px;
  height: 18px;
}
.ctb-sep {
  height: 1px;
  background: var(--win-border);
  margin: 4px 2px;
  flex-shrink: 0;
}
</style>

