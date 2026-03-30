# 接口设计（程序间）

本工具主要为 **SPA 前端**，程序间接口指 **地图数据交换格式**（非 GUI）。

## 地图 JSON

- **方向**：导出与导入使用同一 JSON Schema（版本化），详见 `02-physical/tilemap-editor-vue/spec.md`。
- **不适用**：无 HTTP/gRPC 对外服务；若未来增加后端 API，在本文件扩展。
