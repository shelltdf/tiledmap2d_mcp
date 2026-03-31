# 第三方开源组件许可证（运行时）

本文档汇总 **Web 前端实现**（`tiledmap2d/`）在**生产构建**中实际打包、随 `dist` 分发的 npm **运行时依赖**（`dependencies` 及其传递依赖）的许可证声明。  
**不包含** 仅用于开发的 `devDependencies`（如 `vite`、`@vitejs/plugin-vue`）。

> **更新方式**：在 `tiledmap2d/` 目录执行  
> `npx license-checker@25.0.1 --production --json`  
> 对照本表核对；依赖变更后请同步更新本文件。

**生成依据**：`tiledmap2d/package.json` 的 `dependencies` + `npm ls --all --omit=dev`；许可证字段来自各包 `package.json` / 附带 `LICENSE` 文件（以 SPDX 或 npm 声明为准）。

---

## 直接依赖（`dependencies`）

| 包 | 版本（锁定示例） | 许可证 | 说明 |
|----|------------------|--------|------|
| [vue](https://github.com/vuejs/core) | ^3.5.30（解析为 3.5.x） | MIT | 运行时框架 |
| [pako](https://github.com/nodeca/pako) | ^2.1.0 | MIT 与 Zlib（SPDX: `(MIT AND Zlib)`） | TMX zlib 解压等 |

---

## 传递依赖（生产树内，随构建进入产物）

下列包由 `vue` 等引入，**同一包名多版本**时以实际安装的 `node_modules` 为准。

| 包 | 版本 | 许可证 |
|----|------|--------|
| @babel/helper-string-parser | 7.27.1 | MIT |
| @babel/helper-validator-identifier | 7.28.5 | MIT |
| @babel/parser | 7.29.2 | MIT |
| @babel/types | 7.29.0 | MIT |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT |
| @vue/compiler-core | 3.5.31 | MIT |
| @vue/compiler-dom | 3.5.31 | MIT |
| @vue/compiler-sfc | 3.5.31 | MIT |
| @vue/compiler-ssr | 3.5.31 | MIT |
| @vue/reactivity | 3.5.31 | MIT |
| @vue/runtime-core | 3.5.31 | MIT |
| @vue/runtime-dom | 3.5.31 | MIT |
| @vue/server-renderer | 3.5.31 | MIT |
| @vue/shared | 3.5.31 | MIT |
| csstype | 3.2.3 | MIT |
| entities | 7.0.1 | BSD-2-Clause |
| estree-walker | 2.0.2 | MIT |
| magic-string | 0.30.21 | MIT |
| nanoid | 3.3.11 | MIT |
| picocolors | 1.1.1 | ISC |
| postcss | 8.5.8 | MIT |
| source-map-js | 1.2.1 | BSD-3-Clause |

---

## 许可证类型简要说明（非法律意见）

- **MIT**：保留版权声明与许可文本；常见商业友好。
- **BSD-2-Clause / BSD-3-Clause**：保留声明与免责声明；注意 BSD-3 对署名/广告条款的额外要求。
- **ISC**：与 MIT 类似、条款更短。
- **(MIT AND Zlib)**（pako）：同时满足 MIT 与 Zlib 相关义务；详见包内 `LICENSE`。

完整法律文本见各包在 `node_modules/<包名>/LICENSE` 中的原文。

---

## 数字资产（第三方授权资源）

当前实现中，**未**从 npm 包引入需单独署名的**字体包或大型第三方图集**；`tiledmap2d/public/`（如 `favicon.svg`）为项目自有资源。  
若后续增加第三方字体、图标库或贴图包，请在本节追加：**名称、版本、许可证、仓库或下载来源、在仓库中的路径**。

---

## 免责声明

本文件仅供方便查阅；**不构成法律建议**。分发前请由权利人复核许可证兼容性与署名要求。
