# TG 获取 Channel ID 与 TG_BOT_TOKEN

部署 [CloudFlare-ImgBed](https://cfbed.sanyue.de/deployment/prerequisites.html) 可以使用 TG 作为上传渠道，需要获取创建的 Channel ID 和 TG_BOT_TOKEN。

## 从 TG Web URL 获取 Channel ID

1. 登陆 [Telegram 网页版](https://web.telegram.org)
2. 找到需要的 Channel，在 URL 中获取 Channel ID，如：https://web.telegram.org/k/#-2436957814
3. `2436957814` 前加上 `-100` 前缀，得到 `-1002436957814` 即为 `Channel ID`

## 从 @BotFather 获取 TG_BOT_TOKEN

1. 在 Telegram 中搜索 [@BotFather](https://t.me/BotFather)
2. 输入 `/newbot` 命令创建一个新的 Bot；输入 `/mybots` 查看已创建的 Bot
3. 在弹出的 Bot 信息框中选择 API Token 即为 `TG_BOT_TOKEN`