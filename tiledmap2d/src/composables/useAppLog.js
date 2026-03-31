import { ref } from 'vue'

const DEFAULT_MAX = 2000

/**
 * 应用级日志：提示 / 警告 / 错误，供 Log 窗口展示。
 * @param {number} [maxEntries]
 */
export function useAppLog(maxEntries = DEFAULT_MAX) {
  const entries = ref(
    /** @type {{ id: number, ts: number, level: 'info'|'warn'|'error', message: string }[]} */ ([]),
  )

  function push(level, message) {
    const msg = String(message ?? '')
    const row = {
      id: performance.now() + Math.random(),
      ts: Date.now(),
      level,
      message: msg,
    }
    const next = [...entries.value, row]
    if (next.length > maxEntries) next.splice(0, next.length - maxEntries)
    entries.value = next
  }

  return {
    entries,
    info: (m) => push('info', m),
    warn: (m) => push('warn', m),
    error: (m) => push('error', m),
    clear: () => {
      entries.value = []
    },
  }
}
