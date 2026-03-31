<script setup>
import { inject } from 'vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const shell = inject('appShell', null)
const t = (path, ...args) => shell?.t?.(path, ...args) ?? path
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dlg-overlay"
      role="presentation"
      @click.self="emit('close')"
    >
      <div
        class="dlg win-panel"
        role="dialog"
        aria-labelledby="formats-title"
        aria-modal="true"
        @keydown.escape.prevent="emit('close')"
      >
        <div class="dlg-head">
          <h2 id="formats-title" class="dlg-title">{{ t('formatsHelp.title') }}</h2>
          <button type="button" class="dlg-close win-btn" @click="emit('close')">
            {{ t('formatsHelp.close') }}
          </button>
        </div>
        <div class="dlg-body win-scrollbar">
          <p class="fmt-lead">
            {{ t('formatsHelp.lead') }}
          </p>
          <section class="fmt-block">
            <h3>{{ t('formatsHelp.jsonHeading') }}</h3>
            <p>{{ t('formatsHelp.jsonP') }}</p>
            <ul>
              <li>{{ t('formatsHelp.jsonLi1') }}</li>
              <li>{{ t('formatsHelp.jsonLi2') }}</li>
              <li>{{ t('formatsHelp.jsonLi3') }}</li>
              <li>{{ t('formatsHelp.jsonLi4') }}</li>
              <li>{{ t('formatsHelp.jsonLi5') }}</li>
            </ul>
          </section>
          <section class="fmt-block">
            <h3>{{ t('formatsHelp.tmxHeading') }}</h3>
            <p>{{ t('formatsHelp.tmxP') }}</p>
            <ul>
              <li>{{ t('formatsHelp.tmxLi1') }}</li>
              <li>{{ t('formatsHelp.tmxLi2') }}</li>
              <li>{{ t('formatsHelp.tmxLi3') }}</li>
              <li>{{ t('formatsHelp.tmxLi4') }}</li>
              <li>{{ t('formatsHelp.tmxLi5') }}</li>
            </ul>
          </section>
          <p class="fmt-note">{{ t('formatsHelp.note') }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.dlg {
  width: min(520px, 100%);
  max-height: min(80vh, 640px);
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
  flex-shrink: 0;
}
.dlg-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}
.dlg-body {
  padding: 12px 14px 16px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.5;
  color: var(--win-text);
}
.fmt-lead {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--win-text-secondary);
  line-height: 1.5;
}
.fmt-block {
  margin-bottom: 16px;
}
.fmt-block h3 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--win-text);
}
.fmt-block p {
  margin: 0 0 8px;
  color: var(--win-text-secondary);
}
.fmt-block ul {
  margin: 0;
  padding-left: 1.25rem;
}
.fmt-block li {
  margin-bottom: 4px;
}
code {
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 12px;
  background: #e8e8e8;
  padding: 0 4px;
  border-radius: 2px;
  border: 1px solid var(--win-border);
}
.fmt-note {
  margin: 0;
  font-size: 12px;
  color: var(--win-text-secondary);
  border-top: 1px solid var(--win-border-strong);
  padding-top: 12px;
}
.dlg-close {
  flex-shrink: 0;
}
</style>
