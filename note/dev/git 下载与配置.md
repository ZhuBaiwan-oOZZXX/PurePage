# git 下载与配置.md

- git 官网：https://git-scm.com/
- 下载过程选项可以参考：[git安装](https://www.bilibili.com/video/BV19EGkzWEV9)

Git 提交代码前必须设置用户名和邮箱，不然执行 `git commit` 会报错，所以我们局配置用户名与邮箱，但可以不是真实的信息。

```bash
# 设置全局用户名
git config --global user.name "朱百万oOZZXX"

# 设置全局邮箱
git config --global user.email "zhubaiwan.oozzxx@gmail.com"
```

配置完实际上是在电脑上的 `C:\Users\用户名\.gitconfig` 文件写入了以下信息：

```bash
[user]
	name = 朱百万oOZZXX
	email = zhubaiwan.oozzxx@gmail.com
```

配置后好就可以正常使用啦