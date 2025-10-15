# uv 安装

> uv 官方文档：https://docs.astral.sh/uv/getting-started/installation/

## 国内环境服务器安装：

先把 https://astral.sh/uv/install.sh 下载下来，找到并修改关键行。

找到下面这行（大约在第 31 行左右）：

```bash
INSTALLER_BASE_URL="${UV_INSTALLER_GITHUB_BASE_URL:-https://github.com}"
```

将它修改为：

```bash
INSTALLER_BASE_URL="${UV_INSTALLER_GITHUB_BASE_URL:-https://proxy.zhubaiwan.me/https://github.com}"
```

继续安装：
```bash
chmod +x uv-installer.sh
./uv-installer.sh
```

也就是把 github 代理一下，你可以使用这个项目在 cloudflare 上搭建一个自己的代理地址：https://github.com/ymyuuu/Cloudflare-Workers-Proxy ，也可以直接用我上面的链接（2026.01 域名到期失效）

## pip install 换源

可以尝试在 pyproject.toml 末尾添加：
```toml
[[tool.uv.index]]
url = "https://mirrors.aliyun.com/pypi/simple"
default = true
```
> 参考文档：https://blog.csdn.net/qq_43499921/article/details/152505617