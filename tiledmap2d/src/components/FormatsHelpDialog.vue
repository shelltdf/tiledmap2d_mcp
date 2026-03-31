<script setup>
defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
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
          <h2 id="formats-title" class="dlg-title">支持的文件格式（TiledMap2D）</h2>
          <button type="button" class="dlg-close win-btn" @click="emit('close')">
            关闭
          </button>
        </div>
        <div class="dlg-body win-scrollbar">
          <p class="fmt-lead">
            本工具处理的是<strong>二维正交网格</strong>上的瓦片索引，与 GIS
            中的地球瓦片/金字塔切片<strong>不是同一类数据</strong>。
          </p>
          <section class="fmt-block">
            <h3>JSON（本编辑器原生）</h3>
            <p>UTF-8 文本，用于与本工具互相同步地图数据。</p>
            <ul>
              <li><code>version</code>：当前导出力 <code>3</code>（多图层、<code>kind</code>）；仍可读 <code>2</code> / <code>1</code></li>
              <li><code>tileSize</code>：单格像素边长（8～128）</li>
              <li><code>width</code> / <code>height</code>：地图宽高（格数，1～256）</li>
              <li>
                <code>layers</code>（v2/v3）：数组；每项含 <code>name</code>、<code>visible</code>、<code>tiles</code>；v3 另有 <code>kind</code>（<code>tile</code>/<code>image</code>）；
                另可有 <code>activeLayerIndex</code>
              </li>
              <li>
                <code>tiles</code>（v1 仅）：单层二维数组，导入后视为名为「地面」的一层
              </li>
            </ul>
          </section>
          <section class="fmt-block">
            <h3>TMX（Tiled Map Editor）</h3>
            <p>与 <strong>Tiled</strong> 交换的正交地图 XML（<code>.tmx</code>）。</p>
            <ul>
              <li>仅支持 <code>orientation=&quot;orthogonal&quot;</code>、<code>infinite=&quot;0&quot;</code></li>
              <li>读取第一个 <code>&lt;tileset&gt;</code> 的 <code>firstgid</code>；按顺序读取全部 <code>&lt;layer&gt;</code> 的 <code>&lt;data&gt;</code>（多图层）</li>
              <li>
                图层数据支持：<code>encoding=&quot;csv&quot;</code>，或
                <code>encoding=&quot;base64&quot;</code> 且 <code>compression=&quot;zlib&quot;</code>
              </li>
              <li>GID <code>0</code> 为空格；非零格按 <code>编辑器瓦片 id = gid - firstgid + 1</code> 换算（与导出时 <code>firstgid=1</code> 约定一致）</li>
              <li>
                导出 TMX 会引用同目录下的 <code>tilemap-palette.png</code> 作为图块图；在 Tiled
                中打开时请将该文件放在与 <code>.tmx</code> 相同目录（或使用自建图块图并保持一致）
              </li>
            </ul>
          </section>
          <p class="fmt-note">完整字段与边界以仓库内工程文档 <code>ai-software-engineering/02-physical/tiledmap2d/spec.md</code> 为准。</p>
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--win-border);
  flex-shrink: 0;
}
.dlg-title {
  margin: 0;
  font-size: 15px;
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
  background: var(--win-hover);
  padding: 0 4px;
  border-radius: 3px;
}
.fmt-note {
  margin: 0;
  font-size: 12px;
  color: var(--win-text-secondary);
  border-top: 1px solid var(--win-border);
  padding-top: 12px;
}
.dlg-close {
  flex-shrink: 0;
}
</style>
