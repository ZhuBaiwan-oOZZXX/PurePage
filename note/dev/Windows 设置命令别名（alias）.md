# Windows 设置命令别名（alias）

我要在 PowerShell 中**永久**生效 py 别名指向 python 命令，这样我在 PowerShell 中输入 py 就相当于输入 python 命令。

例如，我要查看 python 版本，我可以输入：

```bash
python --version
```

不过我想更加简洁一点，我只需要输入 py 就可以查看 python 版本，变成：

```bash
py --version
```

我们打开 PowerShell 配置文件，输入：

```bash
if (-not (Test-Path $PROFILE)) { New-Item -Path $PROFILE -Type File -Force }
notepad $PROFILE
```

以上命令的意思是如果 PowerShell 配置文件不存在，就创建一个空文件，然后用记事本打开 PowerShell 配置文件。

在弹出的记事本中，添加下面的内容：

```bash
# 永久设置 py 别名指向 python（$* 确保传递所有参数，比如 py script.py 生效）
Set-Alias -Name py -Value python
```

添加后，`Ctrl+S` 保存记事本并关闭。

之后，我们需要重启打开 PowerShell，输入：

```bash
py --version
```

如果可以看到 python 版本，说明设置成功。