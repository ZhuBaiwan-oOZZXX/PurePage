# 智谱 coding plan 接入 NewAPI

- 类型：自定义渠道
- Base URL：`https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`
- 请求头覆盖（可选）：
```json
{
  "User-Agent": "claude-cli/2.0.22 (external, cli)"
}
```
- 参数覆盖（关闭思考，可选）：
```json
{
    "thinking": { "type": "disabled" }
}
```