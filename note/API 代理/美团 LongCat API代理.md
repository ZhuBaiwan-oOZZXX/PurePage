# 美团 LongCat API 代理

API 获取页面：https://longcat.chat/platform/usage

每个账号每天 500 万 tokens 的额度（默认50 万 tokens，可免费申请额度），当日未用完的额度不会转结到下一天。

## 透明代理

由于官方 API 没有模型列表接口，特此做此代理增加模型列表返回，由于从网页元素中正则提取模型名称，获取模型列表速度稍慢，其他请求透传给官方接口 https://api.longcat.chat/openai

cloudflare workers 部署：

```js
const DOCS_URL = "https://longcat.chat/platform/docs/zh/";
const API_BASE = "https://api.longcat.chat/openai";

async function fetchModels() {
  const res = await fetch(DOCS_URL);
  const html = await res.text();

  const models = [];
  for (const row of html.matchAll(/<tr>[\s\S]*?<\/tr>/gi)) {
    const cell = row[0].match(/<t[dh]>([\s\S]*?)<\/t[dh]>/i)?.[1];
    const name = cell?.replace(/<.*?>/g, "").trim();
    if (name.includes("LongCat")) {
      models.push({ id: name, object: "model" });
    }
  }
  return models;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("模型列表请查看 https://longcat.chat/platform/docs/zh/#支持的模型", { status: 200 });
    }

    if (url.pathname === "/models" || url.pathname === "/v1/models") {
      const models = await fetchModels();
      return Response.json({
        data: models,
        object: "list",
      });
    }

    return fetch(API_BASE + url.pathname + url.search, request);
  },
};
```
