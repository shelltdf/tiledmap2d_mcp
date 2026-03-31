<script setup>
defineProps({
  activeTool: { type: String, required: true },
})

const emit = defineEmits(['select', 'fit-view', 'actual-size'])

const tools = [
  { id: 'select', title: '选择工具' },
  { id: 'brush', title: '画笔工具' },
  { id: 'eraser', title: '橡皮工具' },
]

function choose(id) {
  emit('select', id)
}
</script>

<template>
  <div class="ctb win-panel" role="toolbar" aria-label="画布工具栏">
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
    </button>
    <div class="ctb-sep" role="separator" aria-hidden="true" />
    <button
      type="button"
      class="ctb-btn"
      title="适应窗口（Fit）"
      aria-label="适应窗口"
      @click="emit('fit-view')"
    >
      <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 8V4h4M16 4h4v4M4 16v4h4M16 20h4v-4M8 8h8v8H8V8z"
        />
      </svg>
    </button>
    <button
      type="button"
      class="ctb-btn"
      title="1:1（100% 缩放，以视口中心为锚）"
      aria-label="1:1 实际大小，视口中心缩放"
      @click="emit('actual-size')"
    >
      <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 7h10v10H7V7zm2 2v6h6V9H9z"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ctb {
  width: auto;
  min-width: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  user-select: none;
}
.ctb-btn {
  width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--win-btn-border);
  border-radius: var(--win-radius-btn);
  background: linear-gradient(
    180deg,
    var(--win-btn-face-top) 0%,
    var(--win-btn-face-bottom) 100%
  );
  color: var(--win-text);
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.55) inset;
}
.ctb-btn:hover {
  background: linear-gradient(
    180deg,
    var(--win-btn-hover-top) 0%,
    var(--win-btn-hover-bottom) 100%
  );
  border-color: #a0a0a0;
}
.ctb-btn.active {
  outline: 1px solid var(--win-accent);
  outline-offset: -1px;
  background: var(--win-list-active);
  border-color: var(--win-accent);
}
.ctb-ico {
  width: 20px;
  height: 20px;
  display: block;
}
.ctb-sep {
  height: 1px;
  background: var(--win-border);
  margin: 4px 2px;
  flex-shrink: 0;
}
</style>

