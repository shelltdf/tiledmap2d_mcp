# 模型元素 → 源码映射

| 元素 | 路径 |
|------|------|
| 地图状态、多层、**tileTypes**、JSON | `tiledmap2d/src/composables/useTileMap.js` |
| 画布多层绘制与命中、视口 UI 层 | `tiledmap2d/src/components/TileMapViewport.vue` |
| **地图层 Dock** | `tiledmap2d/src/components/MapLayersDock.vue` |
| 添加图层对话框 | `tiledmap2d/src/components/AddLayerDialog.vue` |
| 地图设置对话框（新建/编辑） | `tiledmap2d/src/components/MapSettingsDialog.vue` |
| 画布内工具栏 | `tiledmap2d/src/components/CanvasToolsBar.vue` |
| **显示** 面板（复选框） | `tiledmap2d/src/components/CanvasDisplayPanel.vue` |
| **缘条折叠按钮** | `tiledmap2d/src/components/DockEdgeButton.vue`（`placement`：`left`/`right` 竖排不占满高度，`top`/`bottom` 横排不占满宽度） |
| **块库 Dock** | `tiledmap2d/src/components/TilePalette.vue` |
| **块定义 Dock** | `tiledmap2d/src/components/BlockDefinitionDock.vue` |
| 主工具栏（新建/地图设置/导入导出） | `tiledmap2d/src/components/WinToolbar.vue` |
| 主菜单 | `tiledmap2d/src/components/WinMenuBar.vue` |
| 帮助：文件格式说明对话框 | `tiledmap2d/src/components/FormatsHelpDialog.vue` |
| 状态栏 | `tiledmap2d/src/components/WinStatusBar.vue` |
| Windows 主题 | `tiledmap2d/src/styles/win-theme.css` |
| 应用壳 | `tiledmap2d/src/App.vue` |
| TMX 导入导出 | `tiledmap2d/src/utils/tmx.js` |
| Tiled 调色板图块（可选） | `tiledmap2d/public/tilemap-palette.png` |
