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

- **缩放**：滚轮以指针为中心或画布中心改变 `zoom`，限制在 `minZoom`～`maxZoom`。
- **平移**：中键拖拽更新 `panX/Y`；外层容器 `overflow: auto` 作为备选。

## 导入导出

- **JSON**：组装 `spec` 定义的对象，`JSON.stringify` 后触发浏览器下载；导入时 `JSON.parse` 后校验字段。
- **TMX**：导出为 UTF-8 XML，单层 CSV；导入时 `DOMParser` 解析，支持 CSV 与 Base64+Zlib 图层；GID 按 `spec` 转为编辑器瓦片 id；失败时状态栏错误信息（见 `02-physical/tiledmap2d/spec.md`）。
