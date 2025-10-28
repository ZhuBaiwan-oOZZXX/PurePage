# 心流 iflow API 代理

登录页面：https://platform.iflow.cn/profile?tab=apiKey

模型列表：https://platform.iflow.cn/models

心流的 API 密钥限时免费，但官方限制每七天需要手动重置密钥，否则七天过后会空回。


## 透明代理

由于官方 API 没有模型列表接口，特此做此代理，从官网网页上获取模型列表，其他请求透传给官方接口 https://apis.iflow.cn

```js
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response("Hello World", { status: 200 });
    }

    if (url.pathname === "/v1/models" || url.pathname === "/models") {
      const res = await fetch("https://iflow.cn/api/platform/models/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = (await res.json()).data;
      const models = [];
      for (const cat of Object.values(data)) {
        for (const m of cat) {
          const name = m.modelName.trim();
          if (!name) continue;
          let tags = { modelSize: "", modelSeqLength: "" };
          try { tags = JSON.parse(m.modelTags)[0] || tags; } catch {}
          models.push({
            id: name,
            object: "model",
            max_output: tags.modelSize,
            context_window: tags.modelSeqLength,
          });
        }
      }
      return Response.json({ data: models, object: "list" });
    }

    return fetch("https://apis.iflow.cn" + url.pathname + url.search, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
  }
};
```