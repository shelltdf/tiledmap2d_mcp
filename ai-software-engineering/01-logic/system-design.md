# 系统设计

## 模块划分

| 模块 | 职责 |
|------|------|
| App 壳 | 组合工具栏、调色板、画布、状态栏；应用 Windows 主题类名 |
| useTileMap | 地图分配、读写格、缩放、导入导出 JSON |
| TileMapViewport | Canvas 绘制网格与瓦片；鼠标映射到格坐标 |
| TilePalette | 展示瓦片类型并发出选中 id |
| WinToolbar | 新建尺寸、清空、导入导出触发 |

## 数据流

- 用户选择瓦片 id → 画布左键按下/拖拽 → `useTileMap` 更新对应格 → Canvas 重绘。
- 滚轮 → 缩放因子更新 → 重绘；中键拖拽 → 视口偏移（或依赖容器 scroll）。

## 与概念/物理一致性

地图 JSON 与错误语义以 `02-physical/tiledmap2d/spec.md` 为单一事实来源。
