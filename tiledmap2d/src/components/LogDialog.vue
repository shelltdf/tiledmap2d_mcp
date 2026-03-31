<script setup>
import { computed, inject, ref } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** @type {{ id: number, ts: number, level: 'info'|'warn'|'error', message: string }[]} */
  entries: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const shell = inject('appShell', null)

const t = (path) => shell?.t?.(path) ?? path

const locale = computed(() => shell?.locale?.value ?? 'zh')
const copyDone = ref(false)

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString(
      locale.value === 'en' ? 'en-US' : 'zh-CN',
      {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    )
  } catch {
    return String(ts)
  }
}

function levelLabel(level) {
  if (level === 'warn') return t('log.levelWarn')
  if (level === 'error') return t('log.levelError')
  return t('log.levelInfo')
}

/** 与界面展示一致的纯文本全文（一行一条） */
const plainText = computed(() => {
  if (!props.entries?.length) return ''
  return props.entries
    .map((e) => {
      const time = formatTime(e.ts)
      const lv = levelLabel(e.level)
      return `[${time}] [${lv}] ${e.message}`
    })
    .join('\n')
})

async function copyAll() {
  const text = plainText.value
  try {
    await navigator.clipboard.writeText(text)
    copyDone.value = true
    setTimeout(() => {
      copyDone.value = false
    }, 2000)
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      copyDone.value = true
      setTimeout(() => {
        copyDone.value = false
      }, 2000)
    } catch {
      /* noop */
    }
  }
}
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
        aria-labelledby="log-dlg-title"
        aria-modal="true"
        @keydown.escape.prevent="emit('close')"
      >
        <div class="dlg-head">
          <div>
            <h2 id="log-dlg-title" class="dlg-title">{{ t('log.title') }}</h2>
            <p class="dlg-sub">{{ t('log.subtitle') }}</p>
          </div>
          <div class="dlg-actions">
            <button
              type="button"
              class="win-btn dlg-copy"
              :disabled="entries.length === 0"
              @click="copyAll"
            >
              {{ copyDone ? t('log.copied') : t('log.copyAll') }}
            </button>
            <button type="button" class="dlg-close win-btn" @click="emit('close')">
              {{ t('log.close') }}
            </button>
          </div>
        </div>
        <div class="dlg-body">
          <p v-if="entries.length === 0" class="log-empty">{{ t('log.empty') }}</p>
          <textarea
            v-else
            class="log-plain win-scrollbar"
            readonly
            spellcheck="false"
            :value="plainText"
            aria-label="Log"
          />
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
  width: min(640px, 100%);
  max-height: min(85vh, 720px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--win-shadow-dialog);
}
.dlg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--win-border-strong);
  background: linear-gradient(180deg, var(--win-surface) 0%, var(--win-chrome) 100%);
  flex-shrink: 0;
}
.dlg-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.dlg-sub {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--win-text-secondary);
}
.dlg-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.dlg-copy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.dlg-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  font-size: 12px;
}
.log-empty {
  margin: 0;
  color: var(--win-text-secondary);
}
.log-plain {
  flex: 1;
  min-height: 200px;
  width: 100%;
  margin: 0;
  padding: 8px 10px;
  resize: none;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 11px;
  line-height: 1.45;
  color: var(--win-text);
  background: var(--win-surface);
  border: 1px solid var(--win-border-strong);
  border-radius: var(--win-radius-panel);
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
}
.log-plain:focus {
  outline: 1px dotted var(--win-border-strong);
  outline-offset: 0;
}
</style>
