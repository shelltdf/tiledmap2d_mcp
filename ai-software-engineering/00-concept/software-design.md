# 软件设计

## 子系统

1. **壳层（Windows 风格）**：布局、主题 CSS 变量、工具栏与状态栏。
2. **地图模型**：二维瓦片索引数组、元数据（宽高、tileSize、版本）。
3. **编辑交互**：画布命中测试、绘制、缩放与视口变换。
4. **调色板**：瓦片类型列表与当前选中瓦片。
5. **持久化**：JSON 序列化与文件选择器导入导出（浏览器环境）。

## 技术栈

- Vue 3（Composition API）、Vite。
- 画布渲染采用 HTML5 Canvas 2D。

## 与物理阶段关系

可执行与文件格式规格以 `ai-software-engineering/02-physical/tilemap-editor-vue/spec.md` 为准。
