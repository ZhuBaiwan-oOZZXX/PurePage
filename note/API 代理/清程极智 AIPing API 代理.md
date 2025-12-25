# 清程极智 AIPing API 代理

新发现的一家国内的 AI 大模型聚合平台 AIPing，走邀请注册双方各得 20 元平台奖励金，我的邀请码：https://www.aiping.cn/#?invitation_code=AMTMFW

## 透明代理

这家现在有一些模型是完全免费、连代金券也不消耗的模型，特此做此代理，筛选出免费模型，其他请求透传给官方接口 https://aiping.cn/api

```js
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    
    // 处理根路径
    if (url.pathname === "/") {
      return new Response("Aiping AI Proxy", { status: 200 });
    }

    // 处理模型列表请求
    if (url.pathname === "/v1/models" || url.pathname === "/models") {
      const res = await fetch("https://aiping.cn/api/v1/models");
      if (!res.ok) return new Response(await res.text(), { status: res.status });
      
      const { data, object } = await res.json();
      const freeModels = data.filter(model => 
        model.price?.input_price_range?.[0] === 0 && 
        model.price?.input_price_range?.[1] === 0 &&
        model.price?.output_price_range?.[0] === 0 &&
        model.price?.output_price_range?.[1] === 0
      );
      
      return Response.json({ object, data: freeModels });
    }

    // 其他请求透明转发
    return fetch(new URL(url.pathname + url.search, "https://aiping.cn/api"), req);
  }
};
```