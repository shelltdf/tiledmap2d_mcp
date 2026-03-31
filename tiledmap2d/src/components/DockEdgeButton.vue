<script setup>
import { computed, inject } from 'vue'

const shell = inject('appShell', null)
const t = (path, ...args) => shell?.t?.(path, ...args) ?? path

const props = defineProps({
  label: { type: String, required: true },
  expandTitle: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  /**
   * 停靠边：左右缘条为竖排按钮（不在高度上拉满）；上下缘条为横排按钮（不在宽度上拉满）。
   * 见 `.cursor/rules/window-gui-documentation.mdc`。
   */
  placement: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'right', 'top', 'bottom'].includes(v),
  },
})

defineEmits(['expand'])

const edgeKind = computed(() =>
  props.placement === 'top' || props.placement === 'bottom' ? 'tb' : 'lr',
)

const titleComputed = computed(() =>
  props.expandTitle || t('docks.expandDock', props.label),
)
const ariaComputed = computed(() =>
  props.ariaLabel || t('docks.expandDockAria', props.label),
)
</script>

<template>
  <button
    type="button"
    class="dock-edge-btn win-btn"
    :class="edgeKind === 'lr' ? 'dock-edge-btn--lr' : 'dock-edge-btn--tb'"
    :title="titleComputed"
    :aria-label="ariaComputed"
    @click="$emit('expand')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
/* 基线：不参与主轴拉伸占满缘条无关维度 */
.dock-edge-btn {
  flex: 0 0 auto;
  padding: 6px 2px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--win-radius-btn);
  line-height: 1.2;
}

/* 左/右缘条：竖排；不占满整条缘条高度 */
.dock-edge-btn--lr {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.08em;
  align-self: stretch;
  width: 100%;
  min-height: 0;
}

/* 上/下缘条：横排；不占满整条缘条宽度（预留） */
.dock-edge-btn--tb {
  writing-mode: horizontal-tb;
  align-self: center;
  width: auto;
  max-width: 100%;
  min-width: 0;
  padding: 4px 10px;
}
</style>
