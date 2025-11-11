# 百灵大模型 API 代理

API 获取页面：https://ling.tbox.cn/open

每个账号每天 50 万 tokens 的额度，包含输入和输出。免费额度每天 02:00 前完成发，当日未用完的额度不会转结到下一天，超额会从余额进行扣除。

## 透明代理

由于官方 API 没有模型列表接口，特此做此代理增加模型列表返回。官方 API 暂时只支持 Ling-1T 和 Ring-1T 两个模型，这里直接写死，其他请求透传给官方接口 https://api.tbox.cn/api/llm

cloudflare workers 部署：

```js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    
    if (url.pathname === "/") {
      return new Response("Hello World", { status: 200 });
    }
    
    if (url.pathname === '/models' || url.pathname === '/v1/models') {
      return Response.json({ 
        data: [
          { id: "Ling-1T", object: "model" },
          { id: "Ring-1T", object: "model" }
        ], 
        object: "list" 
      })
    }

    const response = await fetch("https://api.tbox.cn/api/llm" + url.pathname + url.search, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
    return response
  }
}
```