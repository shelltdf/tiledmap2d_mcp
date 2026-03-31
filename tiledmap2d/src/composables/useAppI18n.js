import { ref, computed } from 'vue'
import { messages } from '../i18n/messages.js'

const LOCALE_KEY = 'tiledmap2d-locale'

function getPath(obj, path) {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return cur
}

export function useAppI18n() {
  const stored =
    typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null
  const locale = ref(stored === 'en' ? 'en' : 'zh')

  function setLocale(code) {
    const next = code === 'en' ? 'en' : 'zh'
    locale.value = next
    try {
      localStorage.setItem(LOCALE_KEY, next)
    } catch {
      /* noop */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN'
    }
  }

  function t(path) {
    const table = messages[locale.value] ?? messages.zh
    const v = getPath(table, path)
    return typeof v === 'string' ? v : path
  }

  const isEnglish = computed(() => locale.value === 'en')

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale.value === 'en' ? 'en' : 'zh-CN'
  }

  return { locale, setLocale, t, isEnglish }
}
