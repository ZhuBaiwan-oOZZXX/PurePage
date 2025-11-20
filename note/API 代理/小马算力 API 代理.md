# 小马算力 API 代理

新发现了一个 AI 大模型聚合平台，叫做：小马算力，现在注册双方各得价值 50 元的算力金，我的邀请码：https://www.tokenpony.cn/7fpBoqFV

活动时间：2025 年 11 月 12 日 - 11 月 30 日
- 注册账号 - 获得 20 元算力金
- 每日签到 - 每日可领 10 元算力金
- 邀请 1 位新用户 - 邀请人和被邀请人均获得 50 元算力金

活动页详情：https://www.tokenpony.cn/#/1112

## 透明代理

~~由于官方 API 没有模型列表接口，特此做此代理，从官网网页上获取模型列表，其他请求透传给官方接口 https://api.tokenpony.cn~~ 

官方已添加模型列表接口，代码已经失去了意义。

cloudflare workers 部署：

```js
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response("Hello World", { status: 200 });
    }

    if (url.pathname === "/v1/models" || url.pathname === "/models") {
      const res = await fetch("https://www.tokenpony.cn/cgw/token-pony-model/web/model/info/web/queryPage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const raw = await res.json();
      const list = raw.data?.list || [];
      const models = list.map(m => ({
        id: m.name.trim(),
        object: "model",
        context_window: `${m.contextLength}${m.unit}`,
        input_price_per_million: m.minInputPrice,
        output_price_per_million: m.minOutputPrice,
      }));
      return Response.json({ data: models, object: "list" });
    }

    return fetch("https://api.tokenpony.cn" + url.pathname + url.search, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
  }
};
```