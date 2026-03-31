import { ref, watch, onMounted, onUnmounted } from 'vue'

const THEME_KEY = 'tiledmap2d-theme'

/**
 * @typedef {'system'|'light'|'dark'} ThemePreference
 */

function resolvePreference(pref) {
  if (pref === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return pref === 'dark' ? 'dark' : 'light'
}

function applyToDocument(pref) {
  const resolved = resolvePreference(pref)
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themePref = pref
}

export function useAppTheme() {
  const stored =
    typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
  const initial =
    stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system'
  const themePreference = ref(/** @type {ThemePreference} */ (initial))

  let mql = null

  function setThemePreference(pref) {
    const next =
      pref === 'light' || pref === 'dark' || pref === 'system' ? pref : 'system'
    themePreference.value = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* noop */
    }
  }

  function onSystemSchemeChange() {
    if (themePreference.value === 'system') applyToDocument('system')
  }

  onMounted(() => {
    mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', onSystemSchemeChange)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', onSystemSchemeChange)
  })

  watch(themePreference, (v) => applyToDocument(v), { immediate: true })

  return {
    themePreference,
    setThemePreference,
  }
}
