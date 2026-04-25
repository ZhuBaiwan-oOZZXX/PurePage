# iKuuu 机场签到脚本

> 代码比较长，原来的 python 版本就不提供了。

JS 版，可以 cloudflare worker 部署，实现自动签到：

```js
const BASE_URL = "https://ikuuu.org";
const LOGIN_URL = `${BASE_URL}/auth/login`;
const CHECKIN_URL = `${BASE_URL}/user/checkin`;
const USER_URL = `${BASE_URL}/user`;

const CAPTCHA_ID = "cc96d05ba8b60f9112f76e18526fcb73";
const GEETEST_BASE = "https://gcaptcha4.geetest.com";

const RSA_N = BigInt(
  "0x00C1E3934D1614465B33053E7F48EE4EC87B14B95EF88947713D25EECBFF7E74C7977D02DC1D9451F79DD5D1C10C29ACB6A9B4D6FB7D0A0279B6719E1772565F09AF627715919221AEF91899CAE08C0D686D748B20A3603BE2318CA6BC2B59706592A9219D0BF05C9F65023A21D2330807252AE0066D59CEEFA5F2748EA80BAB81",
);
const RSA_E = BigInt("0x10001");

const ACCOUNTS = [
  { email: "你的邮箱1", pwd: "你的密码" },
  { email: "你的邮箱2", pwd: "你的密码" }, // 多个账号继续添加，没有就删除这行
];

async function md5(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randUid() {
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += Math.floor(65536 * (1 + Math.random()))
      .toString(16)
      .padStart(4, "0")
      .slice(-4);
  }
  return result;
}

function parseLotNumber(lotNumber) {
  const mapping = { "(n[24:27])+.+(n[29:29]+n[27:27]+n[15:15]+n[9:9])": "n[1:8]" };

  function parseSlice(s) {
    return s.split(":").map((x) => parseInt(x));
  }

  function extract(part) {
    const match = part.match(/\[(.*?)\]/);
    return match ? match[1] : "";
  }

  function parse(s) {
    const parts = s.split("+.+");
    const parsed = [];
    for (const part of parts) {
      if (part.includes("+")) {
        const subs = part.split("+");
        parsed.push(subs.map((sub) => parseSlice(extract(sub))));
      } else {
        parsed.push([parseSlice(extract(part))]);
      }
    }
    return parsed;
  }

  function buildStr(parsed, num) {
    const result = [];
    for (const p of parsed) {
      const current = [];
      for (const s of p) {
        const start = s[0];
        const end = s.length > 1 ? s[1] + 1 : start + 1;
        current.push(num.slice(start, end));
      }
      result.push(current.join(""));
    }
    return result.join(".");
  }

  for (const [k, v] of Object.entries(mapping)) {
    const lot = parse(k);
    const lotRes = parse(v);
    const i = buildStr(lot, lotNumber);
    const r = buildStr(lotRes, lotNumber);
    const parts = i.split(".");
    const a = {};
    let current = a;
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = r;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
    return a;
  }
  return {};
}

async function generatePow(lotNumber, captchaId, hashFunc, version, bits, date) {
  const prefix = "0".repeat(Math.floor(bits / 4));
  const powString = `${version}|${bits}|${hashFunc}|${date}|${captchaId}|${lotNumber}||`;

  while (true) {
    const h = randUid();
    let hashedValue;
    if (hashFunc === "md5") {
      hashedValue = await md5(powString + h);
    } else if (hashFunc === "sha1") {
      const msgBuffer = new TextEncoder().encode(powString + h);
      const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
      hashedValue = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else if (hashFunc === "sha256") {
      const msgBuffer = new TextEncoder().encode(powString + h);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      hashedValue = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      throw new Error(`Unknown hash function: ${hashFunc}`);
    }

    if (hashedValue.startsWith(prefix)) {
      return { pow_msg: powString + h, pow_sign: hashedValue };
    }
  }
}

function bigIntToBytes(bigInt, length) {
  const bytes = new Uint8Array(length);
  let temp = bigInt;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }
  return bytes;
}

function bytesToBigInt(bytes) {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte);
  }
  return result;
}

function pkcs1v15Pad(message, keySize) {
  const messageBytes = new TextEncoder().encode(message);
  const maxMessageLength = keySize - 11;
  if (messageBytes.length > maxMessageLength) {
    throw new Error("Message too long for RSA key");
  }

  const paddingLength = keySize - messageBytes.length - 3;
  const padded = new Uint8Array(keySize);
  padded[0] = 0x00;
  padded[1] = 0x02;

  for (let i = 2; i < 2 + paddingLength; i++) {
    padded[i] = Math.floor(Math.random() * 255) + 1;
  }

  padded[2 + paddingLength] = 0x00;
  padded.set(messageBytes, 3 + paddingLength);

  return padded;
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  base = base % modulus;

  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent >>= 1n;
    base = (base * base) % modulus;
  }

  return result;
}

function rsaEncrypt(message) {
  const keySize = 128;
  const padded = pkcs1v15Pad(message, keySize);
  const m = bytesToBigInt(padded);
  const c = modPow(m, RSA_E, RSA_N);
  return bigIntToBytes(c, keySize);
}

async function aesEncrypt(plaintext, key) {
  const keyData = new TextEncoder().encode(key);
  const iv = new TextEncoder().encode("0000000000000000");
  const data = new TextEncoder().encode(plaintext);

  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "AES-CBC" }, false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, data);

  return new Uint8Array(encrypted);
}

async function generateW(data, captchaId) {
  const lotNumber = data.lot_number;
  const powDetail = data.pow_detail;

  const powResult = await generatePow(lotNumber, captchaId, powDetail.hashfunc, powDetail.version, powDetail.bits, powDetail.datetime);

  const base = {
    "9zXN": "NYzS",
    ...powResult,
    ...parseLotNumber(lotNumber),
    biht: "1426265548",
    device_id: "",
    em: { cp: 0, ek: "11", nt: 0, ph: 0, sc: 0, si: 0, wd: 1 },
    gee_guard: {
      roe: { auh: "3", aup: "3", cdc: "3", egp: "3", res: "3", rew: "3", sep: "3", snh: "3" },
    },
    ep: "123",
    geetest: "captcha",
    lang: "zh",
    lot_number: lotNumber,
    passtime: Math.floor(Math.random() * 600) + 600,
    userresponse: Math.random() * 2 + 1,
  };

  const randomUid = randUid();
  const encryptedData = await aesEncrypt(JSON.stringify(base), randomUid);
  const encryptedKey = rsaEncrypt(randomUid);

  return (
    Array.from(encryptedData)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("") +
    Array.from(encryptedKey)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function parseJsonp(text, callback) {
  try {
    const prefix = `${callback}(`;
    const suffix = ")";
    if (text.startsWith(prefix) && text.endsWith(suffix)) {
      const jsonStr = text.slice(prefix.length, -suffix.length);
      const parsed = JSON.parse(jsonStr);
      return parsed.data;
    }
    const parsed = JSON.parse(text);
    return parsed.data;
  } catch (e) {
    throw new Error(`JSONP parse failed: ${text.substring(0, 200)}`);
  }
}

async function solveGeetest() {
  const callback = `geetest_${Math.floor(Math.random() * 10000) + Date.now()}`;
  const challenge = crypto.randomUUID();

  const loadUrl = `${GEETEST_BASE}/load?captcha_id=${CAPTCHA_ID}&challenge=${challenge}&client_type=web&lang=zh-cn&callback=${callback}`;
  const loadResp = await fetch(loadUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://ikuuu.org/",
      Accept: "*/*",
    },
  });
  const loadText = await loadResp.text();

  let loadData;
  try {
    loadData = parseJsonp(loadText, callback);
  } catch (e) {
    throw new Error(`Load failed: ${e.message}`);
  }

  if (!loadData) {
    throw new Error("Load returned no data");
  }

  if (loadData.captcha_type !== "ai") {
    throw new Error(`Unexpected captcha type: ${loadData.captcha_type}`);
  }

  const w = await generateW(loadData, CAPTCHA_ID);

  const verifyCallback = `geetest_${Math.floor(Math.random() * 10000) + Date.now()}`;
  const verifyUrl = `${GEETEST_BASE}/verify?callback=${verifyCallback}&captcha_id=${CAPTCHA_ID}&client_type=web&lot_number=${loadData.lot_number}&risk_type=ai&payload=${loadData.payload || ""}&process_token=${loadData.process_token || ""}&payload_protocol=1&pt=1&w=${w}`;

  const verifyResp = await fetch(verifyUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: "https://ikuuu.org/",
      Accept: "*/*",
    },
  });
  const verifyText = await verifyResp.text();

  let verifyData;
  try {
    verifyData = parseJsonp(verifyText, verifyCallback);
  } catch (e) {
    throw new Error(`Verify parse failed: ${verifyText.substring(0, 300)}`);
  }

  if (!verifyData) {
    throw new Error(`Verify no data: ${verifyText.substring(0, 300)}`);
  }

  if (verifyData.result === "success") {
    const seccode = verifyData.seccode || {};
    return {
      lot_number: seccode.lot_number || "",
      captcha_output: seccode.captcha_output || "",
      pass_token: seccode.pass_token || "",
      gen_time: seccode.gen_time || "",
    };
  }
  throw new Error(`Geetest verification failed: ${JSON.stringify(verifyData)}`);
}

function getHeaders(cookie = "") {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (cookie) headers["Cookie"] = cookie;
  return headers;
}

function extractCookies(response) {
  const setCookie = response.headers.getSetCookie();
  if (!setCookie || setCookie.length === 0) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function runCheckin() {
  let logContent = `检测到 ${ACCOUNTS.length} 个账号，开始执行任务...\n\n`;

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const account = ACCOUNTS[i];
    logContent += `=== 第 ${i + 1} 个账号: ${account.email} ===\n`;

    try {
      logContent += "[*] 正在过验证码...\n";
      const captchaResult = await solveGeetest();
      logContent += "[+] 验证码通过\n";

      const loginData = new URLSearchParams({
        host: "ikuuu.org",
        email: account.email,
        passwd: account.pwd,
        code: "",
        remember_me: "on",
        pageLoadedAt: Date.now().toString(),
        "captcha_result[lot_number]": captchaResult.lot_number,
        "captcha_result[captcha_output]": captchaResult.captcha_output,
        "captcha_result[pass_token]": captchaResult.pass_token,
        "captcha_result[gen_time]": captchaResult.gen_time,
      });

      const loginResp = await fetch(LOGIN_URL, {
        method: "POST",
        headers: getHeaders(),
        body: loginData,
      });

      const cookies = extractCookies(loginResp);
      const loginJson = await loginResp.json();

      if (loginJson.ret !== 1) {
        logContent += `登录失败: ${loginJson.msg}\n\n`;
        continue;
      }

      logContent += "[+] 登录成功\n";

      const checkinResp = await fetch(CHECKIN_URL, {
        method: "POST",
        headers: getHeaders(cookies),
      });

      const checkinJson = await checkinResp.json();
      logContent += `[+] 签到: ${checkinJson.msg || "无返回消息"}\n`;

      const userPageResp = await fetch(USER_URL, {
        method: "GET",
        headers: getHeaders(cookies),
      });

      let finalHtml = await userPageResp.text();
      const originBodyMatch = finalHtml.match(/var originBody = "(.*?)";/);
      if (originBodyMatch) {
        try {
          finalHtml = decodeURIComponent(escape(atob(originBodyMatch[1])));
        } catch (e) {}
      }

      const trafficMatch = finalHtml.match(/剩余流量.*?<span class="counter">(.*?)<\/span>/s);
      const trafficInfo = trafficMatch ? `${trafficMatch[1]} GB` : "提取失败";
      logContent += `[*] 流量: ${trafficInfo}\n\n`;
    } catch (e) {
      logContent += `[-] 异常: ${e.message}\n\n`;
    }
  }

  return logContent;
}

export default {
  async fetch(request, env, ctx) {
    const logContent = await runCheckin();
    return new Response(logContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },

  async scheduled(event, env, ctx) {
    const logContent = await runCheckin();
    console.log(logContent);
  },
};
```

部署方式：

1. 新建一个 worker ，粘贴上面的 JS 代码
2. 在 worker 的设置页面，找到 `触发事件` 并点击
3. 在触发事件中选择 `Cron 触发器`
4. 可以选择 `计划` 和 `Cron 表达式` 两种定时任务。如果 `计划` 中没有你满意的方案，你可以让 AI 给你写 `Cron 表达式`。
5. 这里我选择 `Cron 表达式`，表达式为：`0 8 * * *`，意思是美国时间早上 8 点执行任务（北京时间下午 4 点）。
6. 无需绑定域名，自动执行任务。你也可以打开你的 workers.dev 域名，手动触发任务。
