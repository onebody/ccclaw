# Connectors

本目录存放外部服务集成（IM 渠道、第三方平台等）。

## 子目录结构

按渠道分目录：

```
connectors/
  feishu/         # 飞书集成（feishu-*.ts）
  dingtalk/        # 钉钉集成（dingtalk-*.ts）
  ...
```

## 迁移指南

将 `electron/main/` 中的 Connector 相关文件逐步迁移到此目录时：

1. 按渠道创建子目录
2. 移动文件
3. **务必更新**所有引用方的 import 路径
4. 更新 `vite.config.ts` 的 `rollupOptions.input` 包含新文件

## 注意事项

- 迁移时建议一次只迁移一个渠道（如先迁移 feishu/）
- 迁移后立即构建验证，避免破坏现有功能
