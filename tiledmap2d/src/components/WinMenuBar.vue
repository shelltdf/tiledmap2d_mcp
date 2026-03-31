<script setup>
import { ref, onMounted, onUnmounted, inject, computed } from 'vue'

const emit = defineEmits([
  'new-map',
  'open-json',
  'save',
  'save-as',
  'export-tmx',
  'import-tmx',
  'clear',
  'show-formats',
])

const shell = inject('appShell', null)
const t = (path) => shell?.t?.(path) ?? path
const locale = computed(() => shell?.locale?.value ?? 'zh')
const themePreference = computed(() => shell?.themePreference?.value ?? 'system')

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

function close() {
  openId.value = null
}

function onDocClick(e) {
  if (!e.target.closest?.('.win-menubar')) close()
}

function run(action) {
  emit(action)
  close()
}

function setLang(code) {
  shell?.setLocale?.(code)
  close()
}

function setThemePref(pref) {
  shell?.setThemePreference?.(pref)
  close()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <nav
    class="win-menubar"
    role="menubar"
    :aria-label="t('winMenu.ariaMain')"
    @click.stop
  >
    <div class="menu-top">
      <button
        type="button"
        class="menu-title"
        :aria-expanded="openId === 'file'"
        aria-haspopup="true"
        @click="toggle('file')"
      >
        {{ t('menu.file') }}(<span class="mn">{{ t('menu.fileMn') }}</span>)
      </button>
      <div v-show="openId === 'file'" class="menu-dd" role="menu">
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('new-map')"
        >
          {{ t('menu.newMap') }}
        </button>
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('open-json')"
        >
          {{ t('menu.open') }}
        </button>
        <div class="menu-sep" />
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('save')"
        >
          {{ t('menu.save') }}
        </button>
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('save-as')"
        >
          {{ t('menu.saveAs') }}
        </button>
        <div class="menu-sep" />
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('export-tmx')"
        >
          {{ t('menu.exportTmx') }}
        </button>
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('import-tmx')"
        >
          {{ t('menu.importTmx') }}
        </button>
      </div>
    </div>

    <div class="menu-top">
      <button
        type="button"
        class="menu-title"
        :aria-expanded="openId === 'edit'"
        aria-haspopup="true"
        @click="toggle('edit')"
      >
        {{ t('menu.edit') }}(<span class="mn">{{ t('menu.editMn') }}</span>)
      </button>
      <div v-show="openId === 'edit'" class="menu-dd" role="menu">
        <button type="button" class="menu-item" role="menuitem" @click="run('clear')">
          {{ t('menu.clearMap') }}
        </button>
      </div>
    </div>

    <div class="menu-top">
      <button
        type="button"
        class="menu-title"
        :aria-expanded="openId === 'lang'"
        aria-haspopup="true"
        @click="toggle('lang')"
      >
        {{ t('menu.language') }}(<span class="mn">{{ t('menu.languageMn') }}</span>)
      </button>
      <div v-show="openId === 'lang'" class="menu-dd" role="menu">
        <button
          type="button"
          class="menu-item menu-item--check"
          role="menuitem"
          @click="setLang('zh')"
        >
          <span class="chk" :aria-hidden="true">{{ locale === 'zh' ? '✓' : '' }}</span>
          {{ t('menu.langZh') }}
        </button>
        <button
          type="button"
          class="menu-item menu-item--check"
          role="menuitem"
          @click="setLang('en')"
        >
          <span class="chk" :aria-hidden="true">{{ locale === 'en' ? '✓' : '' }}</span>
          {{ t('menu.langEn') }}
        </button>
      </div>
    </div>

    <div class="menu-top">
      <button
        type="button"
        class="menu-title"
        :aria-expanded="openId === 'theme'"
        aria-haspopup="true"
        @click="toggle('theme')"
      >
        {{ t('menu.theme') }}(<span class="mn">{{ t('menu.themeMn') }}</span>)
      </button>
      <div v-show="openId === 'theme'" class="menu-dd" role="menu">
        <button
          type="button"
          class="menu-item menu-item--check"
          role="menuitem"
          @click="setThemePref('system')"
        >
          <span class="chk" :aria-hidden="true">{{
            themePreference === 'system' ? '✓' : ''
          }}</span>
          {{ t('menu.themeSystem') }}
        </button>
        <button
          type="button"
          class="menu-item menu-item--check"
          role="menuitem"
          @click="setThemePref('light')"
        >
          <span class="chk" :aria-hidden="true">{{
            themePreference === 'light' ? '✓' : ''
          }}</span>
          {{ t('menu.themeLight') }}
        </button>
        <button
          type="button"
          class="menu-item menu-item--check"
          role="menuitem"
          @click="setThemePref('dark')"
        >
          <span class="chk" :aria-hidden="true">{{
            themePreference === 'dark' ? '✓' : ''
          }}</span>
          {{ t('menu.themeDark') }}
        </button>
      </div>
    </div>

    <div class="menu-top">
      <button
        type="button"
        class="menu-title"
        :aria-expanded="openId === 'help'"
        aria-haspopup="true"
        @click="toggle('help')"
      >
        {{ t('menu.help') }}(<span class="mn">{{ t('menu.helpMn') }}</span>)
      </button>
      <div v-show="openId === 'help'" class="menu-dd" role="menu">
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('show-formats')"
        >
          {{ t('menu.formats') }}
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.win-menubar {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 1px 6px 2px;
  background: var(--win-chrome);
  border-bottom: 1px solid var(--win-border-strong);
  user-select: none;
  flex-shrink: 0;
}
.menu-top {
  position: relative;
}
.menu-title {
  font: inherit;
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--win-text);
  cursor: pointer;
}
.menu-title:hover,
.menu-title:focus-visible {
  background: var(--win-hover);
  border-color: #c0c0c0;
  outline: none;
}
.mn {
  text-decoration: underline;
}
.menu-dd {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding: 2px 0;
  margin-top: 0;
  background: var(--win-surface);
  border: 1px solid var(--win-border-strong);
  border-radius: 0;
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
  z-index: 50;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: left;
  font: inherit;
  font-size: 12px;
  padding: 4px 22px 4px 12px;
  border: none;
  background: transparent;
  color: var(--win-text);
  cursor: pointer;
}
.menu-item--check {
  padding-left: 8px;
}
.chk {
  display: inline-block;
  width: 1em;
  text-align: center;
  font-size: 11px;
}
.menu-item:hover,
.menu-item:focus-visible {
  background: var(--win-menu-hover-bg);
  color: var(--win-menu-hover-fg);
  outline: none;
}
.menu-sep {
  height: 1px;
  margin: 4px 0;
  border: none;
  background: var(--win-border-strong);
}
</style>
