# 系统设计

## 模块划分

| 模块 | 职责 |
|------|------|
| App 壳 | 组合 **菜单栏**、**WinToolbar**、左 **MapLayersDock**、中央 **TileMapViewport**、右 **TilePalette** + **BlockDefinitionDock**、**WinStatusBar**；应用 Windows 主题 |
| useTileMap | 多层地图、**tileTypes**、当前层、读写格、缩放、JSON/TMX 导入导出、地图设置、块类型 CRUD |
| TileMapViewport | Canvas 多层叠加绘制；指针映射到格；**滚动画布**；**viewport-ui** 叠放 **CanvasToolsBar** + **CanvasDisplayPanel**（不随滚动） |
| MapLayersDock | 图层列表（**地图层 Dock**） |
| TilePalette | **块库 Dock**：类型列表、导入/编辑/删除 |
| BlockDefinitionDock | **块定义 Dock**：当前选中块属性 |
| WinToolbar | 新建地图、地图设置、清空、导入导出触发 |
| WinMenuBar | 文件/编辑/帮助菜单 |
| MapSettingsDialog | 新建或编辑宽高、tileSize、格总数提示 |
| AddLayerDialog | 添加图层（类型与插入位置） |
| CanvasToolsBar / CanvasDisplayPanel | 画布内工具与显示开关 |

## 数据流

- 用户选择图层与瓦片 id → 画布左键按下/拖拽 → `useTileMap` 更新**当前层**对应格 → Canvas 重绘。
- 滚轮 → 缩放因子更新 → 重绘；中键拖拽/方向键 → 视口 `scrollLeft`/`scrollTop`。
- 块库 JSON 导入 → `tileTypes` 替换并裁剪地图格 id。

## 与概念/物理一致性

地图 JSON、瓦片 id 边界与错误语义以 `02-physical/tiledmap2d/spec.md` 为单一事实来源。
