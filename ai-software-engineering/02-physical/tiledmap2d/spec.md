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
- `1`～：预置类型，与内置块库一致（见源码 `TILE_TYPES`）。

### 导入校验

- 缺字段、各层 `tiles` 行数/列数与 `width`/`height` 不符、瓦片 id 越界：拒绝导入，保留当前地图，并提示错误。

## 默认新地图

- `width=32`，`height=24`，`tileSize=32`，单层名「地面」，全部格为 `0`。

## 缩放与边界

- `zoom`：建议范围 `0.25`～`4`，步进由滚轮事件决定；**滚轮缩放以指针在视口内的位置为锚点**（保持指针下内容点不漂移）。

## UI（实现侧）

- 左侧 **地图层** dock：顶部 **添加**（打开对话框：层类型 **瓦片 / 图片**，插入位置 **当前之上/之下/最上/最下**）、**改名 / 删除**（针对当前选中层；至少保留一层）；列表可 **拖拽** 调整顺序；行显示类型徽标、层名与显隐；点击行切换当前层（**瓦片层**绘制与拾取仅改此层；**图片层**为叠色占位，不参与绘制）。
- 中央画布 + 右侧 **显示** 面板：可选 **背景网格**、**原点 (0,0) 方框**、**参考坐标文字** `(0,0)` 与 `(1,1)`（格角标注）。
- 画布区域：多层叠加绘制；画布外包 **固定留白**；**默认进入时**将滚动 **居中**；**中键拖拽**平移；聚焦时 **方向键** 平移。
- 画布内左侧工具栏：选择 / 画笔 / 橡皮。选择模式下左键拾取 **瓦片层** 当前格块 id，高亮并同步块库。
- 最右侧 **块库** / **块定义** dock 同前。

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
- **GID → 编辑器瓦片 id**：先去掉翻转高位标志；`0` 为空；否则 `editorId = gid - firstgid + 1`（与内置 `firstgid=1`、五类地形导出一致）。
- 导入后瓦片 id 须在 `0`～`TILE_TYPES.length-1`。

### 导出约定

- 每个编辑器图层对应一个 `<layer>`，导出 `name` 与 `visible`。
- `tileset`：`firstgid=1`，`tilecount=5`，`columns=5`；`<image source="tilemap-palette.png"/>` 尺寸为 `5*tilewidth × tilewidth`（与仓库 `public/tilemap-palette.png` 一致时需在 Tiled 旁放置该图块图）。
- 若 `tilewidth`/`tileheight` 与内置图块 PNG 不一致，Tiled 可能提示图集尺寸不匹配，可替换为自建图块图并保持 `firstgid` 与格数据一致。

## 错误提示（用户可见）

- 导入 JSON / TMX 解析失败或校验失败：状态栏展示简短中文错误信息。
