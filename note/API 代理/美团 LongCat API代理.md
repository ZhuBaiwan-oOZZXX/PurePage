# 美团 LongCat API 代理

API 获取页面：https://longcat.chat/platform/usage

每个账号每天 500 万 tokens 的额度（默认50 万 tokens，需要申请额度），当日未用完的额度不会转结到下一天。

## 透明代理

由于官方 API 没有模型列表接口，特此做此代理增加模型列表返回。官方 API 暂时只支持 LongCat-Flash-Chat 和 LongCat-Flash-Chat-Thinking 两个模型，这里直接写死，其他请求透传给官方接口 https://api.longcat.chat/openai

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
          { id: "LongCat-Flash-Chat", object: "model" },
          { id: "LongCat-Flash-Thinking", object: "model" },
          { id: "LongCat-Flash-Thinking-2601", object: "model" },
        ], 
        object: "list" 
      })
    }

    const response = await fetch("https://api.longcat.chat/openai" + url.pathname + url.search, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
    return response
  }
}
```