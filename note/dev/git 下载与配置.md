# git 下载与配置.md

- git 官网：https://git-scm.com/
- 下载过程选项可以参考：[git安装](https://www.bilibili.com/video/BV19EGkzWEV9)

Git 提交代码前必须设置用户名和邮箱，不然执行 `git commit` 会报错，所以我们全局配置用户名与邮箱，可以随便填写，但是不能为空。

```bash
# 设置全局用户名
git config --global user.name "朱百万oOZZXX"

# 设置全局邮箱
git config --global user.email "zhubaiwan.oozzxx@gmail.com"

# 设置全局默认分支为 main (可选)
git config --global init.defaultBranch main
```

配置完实际上是在电脑上的 `C:\Users\用户名\.gitconfig` 文件写入了以下信息：

```bash
[user]
	name = 朱百万oOZZXX
	email = zhubaiwan.oozzxx@gmail.com
[init]
	defaultBranch = main
```

你也可以用此命令查看全局配置：

```bash
git config --global --list
```

配置后好就可以正常使用啦~