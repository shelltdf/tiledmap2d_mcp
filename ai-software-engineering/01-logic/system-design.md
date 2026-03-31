# 系统设计

## 模块划分

| 模块 | 职责 |
|------|------|
| App 壳 | 组合工具栏、左图层 dock、画布、右侧块库/块定义、状态栏；应用 Windows 主题类名 |
| useTileMap | 多层地图、当前层、读写格、缩放、JSON/TMX 导入导出 |
| TileMapViewport | Canvas 多层叠加绘制；鼠标映射到格坐标；方向键滚动视口 |
| MapLayersDock | 图层列表、显隐、增删、重命名、选中编辑层 |
| TilePalette（块库） | 展示瓦片类型并发出选中 id |
| BlockDefinitionDock | 展示当前选中块的内建属性 |
| WinToolbar | 新建尺寸、清空、导入导出触发 |

## 数据流

- 用户选择图层与瓦片 id → 画布左键按下/拖拽 → `useTileMap` 更新**当前层**对应格 → Canvas 重绘。
- 滚轮 → 缩放因子更新 → 重绘；方向键/滚动条 → 视口滚动。

## 与概念/物理一致性

地图 JSON 与错误语义以 `02-physical/tiledmap2d/spec.md` 为单一事实来源。
