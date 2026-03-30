# 开发维护说明书

## 仓库结构

- AI 工程文档：`ai-software-engineering/`（与实现分离）。
- 实现：`tiledmap2d/`（Vue 3 + Vite）。

## 依赖

- Node.js 与 npm；安装：`npm install`（在 `tiledmap2d` 下）。

## 脚本入口

| 脚本 | 说明 |
|------|------|
| `build.py` | 生产构建 |
| `test.py` | 冒烟（构建） |
| `run.py` | 预览生产构建（需先 build） |
| `dev.py` | 开发服务器 |
| `publish.py` | 输出 `dist/` 为可分发静态目录 |

## 规格权威

行为与 JSON 格式以 `ai-software-engineering/02-physical/tiledmap2d/spec.md` 为准。
