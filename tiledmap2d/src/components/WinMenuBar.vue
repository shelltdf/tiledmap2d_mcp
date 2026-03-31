<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits([
  'export-json',
  'import-json',
  'export-tmx',
  'import-tmx',
  'clear',
  'show-formats',
])

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
    aria-label="主菜单"
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
        文件(<span class="mn">F</span>)
      </button>
      <div v-show="openId === 'file'" class="menu-dd" role="menu">
        <button type="button" class="menu-item" role="menuitem" @click="run('export-json')">
          导出 JSON…
        </button>
        <button type="button" class="menu-item" role="menuitem" @click="run('import-json')">
          导入 JSON…
        </button>
        <div class="menu-sep" />
        <button type="button" class="menu-item" role="menuitem" @click="run('export-tmx')">
          导出 TMX…
        </button>
        <button type="button" class="menu-item" role="menuitem" @click="run('import-tmx')">
          导入 TMX…
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
        编辑(<span class="mn">E</span>)
      </button>
      <div v-show="openId === 'edit'" class="menu-dd" role="menu">
        <button type="button" class="menu-item" role="menuitem" @click="run('clear')">
          清空地图
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
        帮助(<span class="mn">H</span>)
      </button>
      <div v-show="openId === 'help'" class="menu-dd" role="menu">
        <button
          type="button"
          class="menu-item"
          role="menuitem"
          @click="run('show-formats')"
        >
          支持的文件格式…
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
  display: block;
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
