# 物理规格：tiledmap2d（TiledMap2D）

## 地图 JSON（版本 1）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 固定 `1` |
| `tileSize` | number | 是 | 单格像素边长，正整数，默认 `32` |
| `width` | number | 是 | 瓦片列数，正整数 |
| `height` | number | 是 | 瓦片行数，正整数 |
| `tiles` | number[][] | 是 | 行优先；`tiles[gy][gx]` 为瓦片类型 id；与 `width`/`height` 一致 |

### 瓦片 id

- `0`：空（透明/棋盘格）。
- `1`～：预置类型，与内置调色板一致（见源码 `tileTypes`）。

### 导入校验

- 缺字段、`tiles` 行数/列数与 `width`/`height` 不符：拒绝导入，保留当前地图，并提示错误。

## 默认新地图

- `width=32`，`height=24`，`tileSize=32`，全部格为 `0`。

## 缩放与边界

- `zoom`：建议范围 `0.25`～`4`，步进由滚轮事件决定。

## TMX（Tiled Map Editor，正交地图）

与 **Tiled** 交换时使用 `.tmx`（UTF-8 XML）。

### 支持范围

- `map@orientation` 必须为 `orthogonal`。
- `map@infinite` 必须为 `0`（不支持无限地图）。
- 读取 **第一个** `<tileset>` 的 `firstgid`（默认可为 `1`），读取 **第一个** `<layer>` 的 `<data>`。
- **图层数据**：
  - `encoding="csv"`：逗号分隔、行优先，与 `width*height` 一致。
  - `encoding="base64"` 且 `compression="zlib"`：每格 4 字节小端 `uint32` GID，行优先。
- **GID → 编辑器瓦片 id**：先去掉翻转高位标志；`0` 为空；否则 `editorId = gid - firstgid + 1`（与内置 `firstgid=1`、五类地形导出一致）。
- 导入后瓦片 id 须在 `0`～`TILE_TYPES.length-1`。

### 导出约定

- 单层名 `Tile Layer 1`；`tileset`：`firstgid=1`，`tilecount=5`，`columns=5`；`<image source="tilemap-palette.png"/>` 尺寸为 `5*tilewidth × tilewidth`（与仓库 `public/tilemap-palette.png` 一致时需在 Tiled 旁放置该图块图）。
- 若 `tilewidth`/`tileheight` 与内置图块 PNG 不一致，Tiled 可能提示图集尺寸不匹配，可替换为自建图块图并保持 `firstgid` 与格数据一致。

## 错误提示（用户可见）

- 导入 JSON / TMX 解析失败或校验失败：状态栏展示简短中文错误信息。
