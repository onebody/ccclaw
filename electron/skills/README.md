# Skills

本目录存放 Ccclaw 的内置扩展能力（Skills）。

## 与 `connectors/` 的区别

- **`skills/`**：内置能力，是应用的一部分（如 agent 管理、命令执行、模型切换等）
- **`connectors/`**：外挂集成，连接外部服务（如飞书、钉钉、微信等 IM 渠道）

## 迁移指南

将 `electron/main/` 中的文件逐步迁移到此目录时，按功能子目录组织：

```
skills/
  agent/          # agent-*.ts
  command/        # command-*.ts
  chat/           # chat-*.ts
  model/          # local-model-*.ts
  ...
```

## 注意事项

- 迁移时务必更新所有引用方的 import 路径
- 建议一次只迁移 1-2 个文件，迁移后立即构建验证
