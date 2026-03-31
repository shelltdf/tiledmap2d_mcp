<script setup>
import { inject } from 'vue'

defineProps({
  showGrid: { type: Boolean, default: true },
  showOrigin: { type: Boolean, default: false },
  showCollisionVolume: { type: Boolean, default: true },
})

const shell = inject('appShell', null)
const t = (path, ...args) => shell?.t?.(path, ...args) ?? path

const emit = defineEmits([
  'update:showGrid',
  'update:showOrigin',
  'update:showCollisionVolume',
])
</script>

<template>
  <div
    class="dtb win-panel"
    role="group"
    :aria-label="t('display.groupAria')"
  >
    <div class="dtb-title">{{ t('display.title') }}</div>
    <label class="dtb-row" :title="t('display.gridTitle')">
      <input
        type="checkbox"
        :checked="showGrid"
        @change="emit('update:showGrid', $event.target.checked)"
      />
      <span>{{ t('display.grid') }}</span>
    </label>
    <label class="dtb-row" :title="t('display.originTitle')">
      <input
        type="checkbox"
        :checked="showOrigin"
        @change="emit('update:showOrigin', $event.target.checked)"
      />
      <span>{{ t('display.origin') }}</span>
    </label>
    <label class="dtb-row" :title="t('display.collisionTitle')">
      <input
        type="checkbox"
        :checked="showCollisionVolume"
        @change="emit('update:showCollisionVolume', $event.target.checked)"
      />
      <span>{{ t('display.collision') }}</span>
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
