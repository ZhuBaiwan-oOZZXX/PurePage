# Poe 大模型 API 代理

## 透明代理

做此代理筛选出所有的免费的模型，其他请求透传给官方接口

cloudflare workers 部署：

```js
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const BASE = "https://api.poe.com";

    if (url.pathname === "/") {
      return new Response("Hello World", { status: 200 });
    }

    if (url.pathname === "/models" || url.pathname === "/v1/models") {
      const res = await fetch(`${BASE}/v1/models${url.search}`, req);
      if (!res.ok) return new Response(await res.text(), { status: res.status });
      const data = await res.json();
      const free = data.data?.filter((m) => m.pricing?.request === "0.00") || [];
      return Response.json({ object: data.object, free });
    }

    return fetch(`${BASE}${url.pathname}${url.search}`, req);
  },
};
```
