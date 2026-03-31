# 详细设计：TiledMap2D

## 坐标系

- **格坐标**：`(gx, gy)`，整数，`0 <= gx < width`，`0 <= gy < height`。
- **屏幕到格**：考虑画布在页面中的位置、`devicePixelRatio`（若启用）、缩放 `zoom`、平移 `(panX, panY)`，将指针坐标转为格索引；越界不绘制。

## 绘制交互

- **左键按下并拖拽**：连续绘制当前选中瓦片 id。
- **右键**：可选擦除（与 id=0 等价）；MVP 可与左键共用「空瓦片」调色板项。

## 主菜单与帮助

- **主菜单**：标题栏下为 Windows 风格菜单（文件 / 编辑 / 帮助）；文件项与工具栏共享导入导出逻辑；帮助项「支持的文件格式」打开模态对话框，展示 JSON 与 TMX 要点。

## 视口

- **缩放**：滚轮改变 `zoom`，限制在 `minZoom`～`maxZoom`。
- **平移**：外层容器 `overflow: auto`（滚动条）；**中键拖拽**按位移更新 `scrollLeft`/`scrollTop`；画布聚焦时 **方向键** 步进滚动。

## 图层

- 渲染顺序为 `layers` 数组顺序，仅绘制 `visible` 为真的层；上空格透出下层。
- 编辑目标为当前 `activeLayerIndex` 对应层；至少保留一层。

## 导入导出

- **JSON**：v2 含 `layers` 与 `activeLayerIndex`；仍支持读入 v1 单层 `tiles`。失败时状态栏错误信息（见 `02-physical/tiledmap2d/spec.md`）。
- **TMX**：导出多 `<layer>`（CSV）；导入按顺序解析全部 tile layer；支持 CSV 与 Base64+Zlib；GID 按 `spec` 转为编辑器瓦片 id。
