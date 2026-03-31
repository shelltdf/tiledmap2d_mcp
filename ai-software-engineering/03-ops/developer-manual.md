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

## 第三方依赖许可证

- 仓库根目录 **`THIRD_PARTY_LICENSES.md`**：由 `license-checker` 生成并人工复核的依赖许可摘要。
- 在 `tiledmap2d` 下可执行 `npm run licenses` 重新生成 JSON 输出（用于与文档对照）；更新依赖后应复核 `THIRD_PARTY_LICENSES.md` 与 `.cursor/rules/third-party-licenses.mdc` 约定。

## 国际化与主题（实现路径）

- 文案：`tiledmap2d/src/i18n/messages.js`；模板内用 `te('key')`（`tiledmap2d/src/i18n/te.js`）或 `useAppI18n` 的 `appLocale`。
- 主题：`useAppTheme.js` 写入 `html[data-theme]`，样式见 `win-theme.css`。
