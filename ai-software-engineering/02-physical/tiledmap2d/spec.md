# 物理规格：tiledmap2d（TiledMap2D）

## 地图 JSON

### 版本 3（当前导出默认）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 固定 `3` |
| `tileSize` | number | 是 | 单格像素边长，正整数，默认 `32` |
| `width` | number | 是 | 瓦片列数，正整数 |
| `height` | number | 是 | 瓦片行数，正整数 |
| `layers` | array | 是 | 至少一层；每项见下 |
| `activeLayerIndex` | number | 否 | 当前选中层索引，默认 `0` |

**图层项** `layers[]`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 显示名；默认「地面」或「图层 n」 |
| `visible` | boolean | 否 | 是否在画布中绘制；默认 `true` |
| `kind` | string | 否 | `tile`（瓦片/Tiled 层）或 `image`（图片层占位）；缺省为 `tile` |
| `tiles` | number[][] | 是 | 行优先；与 `width`/`height` 一致 |

### 版本 2（兼容导入）

与 `3` 相同，但 `layers[]` 可无 `kind`（按 `tile` 处理）；`version` 为 `2`。

### 版本 1（兼容导入）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 固定 `1` |
| `tileSize` | number | 是 | 同上 |
| `width` / `height` | number | 是 | 同上 |
| `tiles` | number[][] | 是 | 单层；导入后为单一瓦片图层「地面」 |

### 瓦片 id

- `0`：空（透明；画布底层为棋盘格，上层空格透出下层）。
- `1`～`tileTypes.length - 1`：与当前 **块库**（`useTileMap` 中可变 **`tileTypes`**，默认由 `DEFAULT_TILE_TYPES` 克隆）一致。

### 导入校验

- 缺字段、各层 `tiles` 行数/列数与 `width`/`height` 不符、瓦片 id 越界（`≥ tileTypes.length`）：拒绝导入，保留当前地图，并提示错误。

## 默认新地图

- `width=32`，`height=24`，`tileSize=32`，单层名「地面」，全部格为 `0`。

## 缩放与边界

- `zoom`：建议范围 `0.25`～`4`，步进由滚轮事件决定；**滚轮缩放以指针在视口内的位置为锚点**（保持指针下内容点不漂移）。

## UI（实现侧）

主窗口为 **SDI** 单页壳：**菜单栏** → **WinToolbar** → **主工作区** → **状态栏**（见概念层 UI 说明）。全局视觉由 `tiledmap2d/src/styles/win-theme.css` 提供 **Windows 10/11 桌面近似**（灰壳 `#f0f0f0`、按钮渐变与灰描边、下拉菜单项高亮 `#0078d4`、状态栏顶缘内凹、面板/对话框 2px 圆角与较深描边）。

- **Dock 停靠结构**：左右各一 **`dock-shelf`**；每侧 **`dock-edge`（缘条，紧贴窗口左/右缘）** 与 **`dock-display`（显示区）** 为 **兄弟** 节点（非嵌套）。折叠后仅缘条显示竖条按钮；展开面板仅在显示区内。**右侧** 块库 / 块定义共用同一显示区纵向分栏，单独折叠其一则剩余展开面板可占满该侧显示区高度（`App.vue` + `DockEdgeButton.vue`）。**缘条折叠按钮几何**：左/右停靠时竖排按钮**不在高度方向拉满**缘条（按内容高度 + `gap` 堆叠）；上/下停靠时横排按钮**不在宽度方向拉满**缘条（`DockEdgeButton` 的 `placement`：`left`/`right`/`top`/`bottom`）。
- **地图层 Dock**（左）：可 **折叠** 为左缘竖条「地图层」按钮（点击展开）；展开时 **添加**（`AddLayerDialog`：层类型 **瓦片 / 图片**，插入 **当前之上/之下/最上/最下**）、**改名 / 删除**（当前层；至少保留一层）；列表 **拖拽** 排序；行显类型徽标、层名、显隐；点击行切换当前层（**瓦片层**可绘制/拾取；**图片层**为叠色占位）。
- **客户区**（中）：**TileMapViewport** — Canvas 多层绘制；**viewport-inner** 承担四周留白与指针/滚轮命中；**viewport-ui** 叠层（不随中键滚动）：左上 **CanvasToolsBar**（标题「工具栏」+ 选择/**吸取**/填充/橡皮 + 清空地图 + 适应/1:1，图标+短标签）；**选择**仅维护选区高亮，不修改块库当前块；**吸取**从当前编辑层格读取 tile id 写回块库选中；**填充**对当前选区批量铺块，无选区时仅填充单击格；右上 **CanvasDisplayPanel**（标题「显示」+ 三个 **checkbox**：网格/原点/碰撞体积）。
- **平移 / 缩放**：中键拖拽、`scrollLeft`/`scrollTop`；滚轮缩放以指针为锚点；**空格**按住临时选择工具；**Alt** 按住临时吸取工具（松手还原；非输入框焦点时）；方向键平移（画布聚焦）；选择工具 **右键** 清空选区。
- **块库 Dock**（右列上）：可 **折叠** 为右缘竖条「块库」按钮（点击展开）；**块库** 标题栏 **⟩** 折叠到右缘；**导入 / 编辑 / 删除**；类型列表（中键快速选中）。
- **块定义 Dock**（右列下）：可 **折叠** 为右缘竖条「块定义」按钮（点击展开）；标题栏 **⟩** 折叠到右缘；只读展示当前选中块属性。
- **WinToolbar**：**新建地图…**、**地图设置…**（`MapSettingsDialog`：宽/高/tileSize、格总数）；**TMX** 导入/导出。**JSON** 打开/保存/另存为在菜单 **文件**；**清空地图**在画布 **CanvasToolsBar**。

## TMX（Tiled Map Editor，正交地图）

与 **Tiled** 交换时使用 `.tmx`（UTF-8 XML）。

### 支持范围

- `map@orientation` 必须为 `orthogonal`。
- `map@infinite` 必须为 `0`（不支持无限地图）。
- 读取 **第一个** `<tileset>` 的 `firstgid`（默认可为 `1`）。
- 按文档顺序读取 **全部** `<layer>`（tile layer）的 `<data>`；每层 `name`、`visible`（`0` 为隐藏）写入编辑器图层元数据。
- **图层数据**：
  - `encoding="csv"`：逗号分隔、行优先，与 `width*height` 一致。
  - `encoding="base64"` 且 `compression="zlib"`：每格 4 字节小端 `uint32` GID，行优先。
- **GID → 编辑器瓦片 id**：先去掉翻转高位标志；`0` 为空；否则 `editorId = gid - firstgid + 1`（与 `firstgid=1` 导出约定一致）。
- 导入后瓦片 id 须在 `0`～**当前 `tileTypes.length - 1`**（导入前块库数量与地图数据须一致）。

### 导出约定

- 每个编辑器图层对应一个 `<layer>`，导出 `name` 与 `visible`。
- `tileset`：当前实现导出 **`tilecount=5`**、`columns=5` 占位图块集（与仓库 `public/tilemap-palette.png` 示例一致）；若实际 **tileTypes** 数量与 5 不一致，在 Tiled 中可能需自配图块图或调整 tileset。**firstgid=1**。
- 若 `tilewidth`/`tileheight` 与内置图块 PNG 不一致，Tiled 可能提示图集尺寸不匹配，可替换为自建图块图并保持 `firstgid` 与格数据一致。

## 错误提示（用户可见）

- 导入 JSON / TMX 解析失败或校验失败：状态栏展示简短中文错误信息。
