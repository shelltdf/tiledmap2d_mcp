<script setup>
import { computed, inject } from 'vue'

defineProps({
  activeTool: { type: String, required: true },
  /** 有地图时可清空图层内容 */
  mapReady: { type: Boolean, default: true },
})

const emit = defineEmits(['select', 'fit-view', 'actual-size', 'clear-map'])

const shell = inject('appShell', null)
const t = (path, ...args) => shell?.t?.(path, ...args) ?? path

const tools = computed(() => [
  {
    id: 'select',
    label: t('tools.select'),
    title: t('tools.selectTitle'),
  },
  {
    id: 'pick',
    label: t('tools.pick'),
    title: t('tools.pickTitle'),
  },
  {
    id: 'fill',
    label: t('tools.fill'),
    title: t('tools.fillTitle'),
  },
  {
    id: 'eraser',
    label: t('tools.eraser'),
    title: t('tools.eraserTitle'),
  },
])

function choose(id) {
  emit('select', id)
}
</script>

<template>
  <div class="ctb win-panel" role="toolbar" :aria-label="t('tools.barAria')">
    <div class="ctb-title">{{ t('tools.barTitle') }}</div>
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="ctb-btn"
      :class="{ active: activeTool === tool.id }"
      :title="tool.title"
      :aria-label="tool.title"
      @click="choose(tool.id)"
    >
      <span class="ctb-btn-inner">
        <svg
          v-if="tool.id === 'select'"
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
          v-else-if="tool.id === 'pick'"
          class="ctb-ico"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 21l5-5m0 0l3-9 4-4 4 4-9 9-5 5M14.5 6.5L18 3l3 3-3.5 3.5M12 15l-2 2"
          />
        </svg>
        <svg
          v-else-if="tool.id === 'fill'"
          class="ctb-ico"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M19 11s-2 2.4-2 4a2 2 0 0 0 4 0c0-1.6-2-4-2-4zm-7 9a4 4 0 0 1-4-4c0-1.9 2-4.5 2-4.5L5.6 6.4 7 5l2.6 2.6c.5-.3 1-.4 1.4-.4 1.5 0 2.7 1.2 2.7 2.7 0 .5-.1 1-.4 1.4L16 14v5h-4zM5 3h6v2H5V3z"
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
        <span class="ctb-lbl">{{ tool.label }}</span>
      </span>
    </button>
    <div class="ctb-sep" role="separator" aria-hidden="true" />
    <button
      type="button"
      class="ctb-btn ctb-btn--danger"
      :title="t('tools.clearMapTitle')"
      :aria-label="t('tools.clearMapAria')"
      :disabled="!mapReady"
      @click="emit('clear-map')"
    >
      <span class="ctb-btn-inner">
        <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"
          />
        </svg>
        <span class="ctb-lbl">{{ t('tools.clearMap') }}</span>
      </span>
    </button>
    <div class="ctb-sep" role="separator" aria-hidden="true" />
    <button
      type="button"
      class="ctb-btn"
      :title="t('tools.fitTitle')"
      :aria-label="t('tools.fitAria')"
      @click="emit('fit-view')"
    >
      <span class="ctb-btn-inner">
        <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 8V4h4M16 4h4v4M4 16v4h4M16 20h4v-4M8 8h8v8H8V8z"
          />
        </svg>
        <span class="ctb-lbl">{{ t('tools.fit') }}</span>
      </span>
    </button>
    <button
      type="button"
      class="ctb-btn"
      :title="t('tools.actualTitle')"
      :aria-label="t('tools.actualAria')"
      @click="emit('actual-size')"
    >
      <span class="ctb-btn-inner">
        <svg class="ctb-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 7h10v10H7V7zm2 2v6h6V9H9z"
          />
        </svg>
        <span class="ctb-lbl">1:1</span>
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
  min-height: 28px;
  height: auto;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
.ctb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}
.ctb-btn--danger:not(:disabled) {
  color: #a00400;
}
.ctb-btn--danger:not(:disabled):hover {
  color: #850300;
  border-color: #c0a0a0;
}
.ctb-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.ctb-sep {
  height: 1px;
  background: var(--win-border);
  margin: 4px 2px;
  flex-shrink: 0;
}
</style>
