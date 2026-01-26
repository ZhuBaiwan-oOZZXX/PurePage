# iKuuu 机场签到脚本

python 版代码：

```python
"""
new Env('ikuuu签到');
cron: 0 9 * * *
"""

import requests
import re
import time
import base64

# ================= 配置区域 =================
# 在这里直接填写您的邮箱和密码(支持多账户）
ACCOUNTS = [
    {"email": "你的邮箱", "pwd": "你的密码"},
]

# 域名配置
BASE_URL = "https://ikuuu.org"
LOGIN_URL = f"{BASE_URL}/auth/login"
CHECKIN_URL = f"{BASE_URL}/user/checkin"
USER_URL = f"{BASE_URL}/user"


def get_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Referer": BASE_URL,
        "Origin": BASE_URL,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    }


def run_checkin():
    log_content = ""
    print(f"检测到 {len(ACCOUNTS)} 个账号，开始执行任务...\n")

    for i, account in enumerate(ACCOUNTS):
        email = account.get("email")
        password = account.get("pwd")
        print(f"=== 开始处理第 {i + 1} 个账号: {email} ===")

        session = requests.session()
        headers = get_headers()

        try:
            # 1. 登录
            login_data = {"email": email, "passwd": password, "code": ""}
            login_resp = session.post(
                url=LOGIN_URL, headers=headers, data=login_data, timeout=10
            )

            try:
                login_json = login_resp.json()
            except ValueError as e:
                print(f"登录失败: 无法解析返回数据 - {e}")
                continue

            if login_json.get("ret") != 1:
                print(f"登录失败: {login_json.get('msg')}")
                continue

            print("登录成功，准备签到...")

            # 2. 执行签到
            checkin_resp = session.post(url=CHECKIN_URL, headers=headers, timeout=10)
            try:
                msg = checkin_resp.json().get("msg", "无返回消息")
            except ValueError as e:
                msg = f"签到接口返回异常 - {e}"
            print(f"签到结果: {msg}")

            # 3. 获取流量信息 (关键修改步骤)
            user_page_resp = session.get(url=USER_URL, headers=headers, timeout=10)
            raw_html = user_page_resp.text

            # === 解码处理开始 ===
            # 检测是否存在加密的 originBody
            origin_body_match = re.search(r'var originBody = "(.*?)";', raw_html)
            if origin_body_match:
                try:
                    # 提取 Base64 字符串
                    b64_str = origin_body_match.group(1)
                    # 解码 Base64
                    decoded_bytes = base64.b64decode(b64_str)
                    # 解码 URL 编码 (对应网页JS中的 decodeURIComponent)
                    # 网页逻辑是: base64 -> split/map -> decodeURIComponent
                    # Python中直接由 base64 -> utf-8 字符串通常就够了，但为了保险处理特殊字符：
                    final_html = decoded_bytes.decode("utf-8", errors="ignore")
                except Exception as e:
                    print(f"页面解密失败: {e}")
                    final_html = raw_html  # 解密失败则尝试用原HTML
            else:
                final_html = raw_html
            # === 解码处理结束 ===

            # 4. 正则匹配流量
            # 匹配逻辑：找到“剩余流量”这几个字，然后找它后面的第一个 counter
            traffic_match = re.search(
                r'剩余流量.*?<span class="counter">(.*?)</span>', final_html, re.S
            )

            if traffic_match:
                traffic_info = traffic_match.group(1) + " GB"
            else:
                # 备用匹配：尝试直接匹配所有 counter，取第一个（通常是剩余流量）
                backup_match = re.findall(
                    r'<span class="counter">(.*?)</span>', final_html, re.S
                )
                if backup_match:
                    traffic_info = backup_match[0] + " GB (可能不准)"
                else:
                    traffic_info = "提取失败 (HTML结构变化)"

            print(f"当前流量: {traffic_info}")
            log_content += (
                f"账号: {email}\n状态: {msg}\n剩余流量: {traffic_info}\n"
                + "-" * 20
                + "\n"
            )

        except Exception as e:
            print(f"账号 {email} 发生异常: {str(e)}")

        time.sleep(2)
        print("\n")

    return log_content


if __name__ == "__main__":
    run_checkin()
```

JS 版，可以 cloudflare worker 部署，实现自动签到：

```js
const BASE_URL = "https://ikuuu.org";
const LOGIN_URL = `${BASE_URL}/auth/login`;
const CHECKIN_URL = `${BASE_URL}/user/checkin`;
const USER_URL = `${BASE_URL}/user`;

const ACCOUNTS = [
    { email: "你的邮箱", pwd: "你的密码" },
];

function getHeaders(cookie = "") {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Referer": BASE_URL,
        "Origin": BASE_URL,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    };
    if (cookie) headers["Cookie"] = cookie;
    return headers;
}

function extractCookies(response) {
    const setCookie = response.headers.getSetCookie();
    if (!setCookie || setCookie.length === 0) return "";
    return setCookie.map(c => c.split(";")[0]).join("; ");
}

async function runCheckin() {
    let logContent = `检测到 ${ACCOUNTS.length} 个账号，开始执行任务...\n\n`;

    for (let i = 0; i < ACCOUNTS.length; i++) {
        const account = ACCOUNTS[i];
        logContent += `=== 开始处理第 ${i + 1} 个账号: ${account.email} ===\n`;

        try {
            const loginData = new URLSearchParams({
                email: account.email,
                passwd: account.pwd,
                code: ""
            });

            const loginResp = await fetch(LOGIN_URL, {
                method: "POST",
                headers: getHeaders(),
                body: loginData
            });

            const cookies = extractCookies(loginResp);
            const loginJson = await loginResp.json();

            if (loginJson.ret !== 1) {
                logContent += `登录失败: ${loginJson.msg}\n\n`;
                continue;
            }

            logContent += "登录成功，准备签到...\n";

            const checkinResp = await fetch(CHECKIN_URL, {
                method: "POST",
                headers: getHeaders(cookies)
            });

            const checkinJson = await checkinResp.json();
            logContent += `签到结果: ${checkinJson.msg || "无返回消息"}\n`;

            const userPageResp = await fetch(USER_URL, {
                method: "GET",
                headers: getHeaders(cookies)
            });

            const rawHtml = await userPageResp.text();
            let finalHtml = rawHtml;

            const originBodyMatch = rawHtml.match(/var originBody = "(.*?)";/);
            if (originBodyMatch) {
                try {
                    finalHtml = decodeURIComponent(escape(atob(originBodyMatch[1])));
                } catch (e) {
                    finalHtml = rawHtml;
                }
            }

            const trafficMatch = finalHtml.match(/剩余流量.*?<span class="counter">(.*?)<\/span>/s);
            let trafficInfo;
            if (trafficMatch) {
                trafficInfo = `${trafficMatch[1]} GB`;
            } else {
                const backupMatch = finalHtml.match(/<span class="counter">(.*?)<\/span>/);
                trafficInfo = backupMatch ? `${backupMatch[1]} GB (可能不准)` : "提取失败";
            }

            logContent += `当前流量: ${trafficInfo}\n`;
            logContent += "-".repeat(20) + "\n\n";

        } catch (e) {
            logContent += `账号 ${account.email} 发生异常: ${e.message}\n\n`;
        }
    }

    return logContent;
}

export default {
    async fetch(request, env, ctx) {
        const logContent = await runCheckin();
        return new Response(logContent, {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
    },

    async scheduled(event, env, ctx) {
        const logContent = await runCheckin();
        console.log(logContent);
    }
};
```

部署方式：
1. 新建一个 worker ，粘贴上面的 JS 代码
2. 在 worker 的设置页面，找到 `触发事件` 并点击
3. 在触发事件中选择 `Cron 触发器`
4. 可以选择 `计划` 和 `Cron 表达式` 两种定时任务。如果 `计划` 中没有你满意的方案，你可以让 AI 给你写 `Cron 表达式`。
5. 这里我选择  `Cron 表达式`，表达式为：`0 8 * * *`，意思是美国时间早上 8 点执行任务（北京时间下午 4 点）。
6. 无需绑定域名，自动执行任务。你也可以打开你的 workers.dev 域名，手动触发任务。

效果展示：https://github.com/ZhuBaiwan-oOZZXX/PurePage/blob/main/assets/ikuu签到.mp4