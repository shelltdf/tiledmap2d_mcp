# tiledmap2d

Vue 3 + Vite 的 **二维正交瓦片地图**编辑器（Windows 11 浅色风格 UI）。面向关卡/地形格网数据，**不包含** GIS 球面地图或地球切片（XYZ/Web Mercator 等）。

## 依赖

- Node.js 18+ 与 npm
- 安装：`npm install`

## 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` 或 `python dev.py` | 开发服务器 |
| `npm run build` 或 `python build.py` | 生产构建 → `dist/` |
| `npm run preview` 或 `python run.py` | 预览 `dist/` |
| `python test.py` | 冒烟（执行 build） |
| `python publish.py` | 构建并提示 `dist/` 路径 |

## 地图格式

- **JSON**：见 `ai-software-engineering/02-physical/tiledmap2d/spec.md`。
- **TMX**：与 Tiled 交换；导出时请把 `public/tilemap-palette.png` 复制到与 `.tmx` 相同目录（或按需在 Tiled 中替换图块集）。

## 依赖说明

- `pako`：解析 Tiled 常用的 base64+zlib 图层数据。
