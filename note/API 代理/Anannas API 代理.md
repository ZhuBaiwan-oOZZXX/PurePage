# Anannas API 代理

官网：https://anannas.ai

有很多免费的模型，但是模型列表太多，免费的付费的混杂在一块，不便于筛选。

## 透明代理

由于官方 API 模型列表太长，特此做此代理，筛选出免费模型，其他请求透传给官方接口 https://api.anannas.ai

cloudflare workers 部署：

```js
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response("Hello World", { status: 200 });
    }

    if (url.pathname === "/v1/models" || url.pathname === "/models") {
      const res = await fetch("https://api.anannas.ai/v1/models?details=true");
      if (!res.ok) return new Response(await res.text(), { status: res.status });

      const { data, object } = await res.json();
      const models = data
        .filter(m => m.pricing?.input === 0 && m.pricing?.output === 0)
        .map(m => ({
          id: m.id,
          object: m.object,
          context_window: m.context_window,
          max_output: m.max_output,
          pricing: m.pricing,
          supported_parameters: m.supported_parameters,
        }));

      // 返回标准格式：顶层为 data 和 object
      return Response.json({ data: models, object });
    }

    return fetch(new URL(url.pathname + url.search, "https://api.anannas.ai"), req);
  }
};
```