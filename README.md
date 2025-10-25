# PurePage - 极简静态博客

一个基于纯前端技术的极简静态博客系统，支持 Markdown 渲染、数学公式、代码高亮等功能。

## ✨ 功能特性

- **Markdown 支持** - 完整的 Markdown 语法渲染
- **数学公式** - 支持数学公式渲染 (MathJax)
- **图表绘制** - 支持 Mermaid 流程图、时序图等
- **代码高亮** - 代码语法高亮显示
- **响应式设计** - 适配桌面和移动设备

## 🚀 使用方法

### 1. Fork 并拉取到本地

首先 Fork 本仓库到你的 GitHub 账户，然后下载项目拉取到本地。

### 2. 修改博客与侧边栏标题

修改 [index.html](./index.html) 文件：

```html
<title>朱百万oOZZXX</title>
...
<h3>朱百万oOZZXX</h3>
```

### 3. 创建笔记

在 `note` 目录下创建你的 `.md` 笔记或文件夹，你可以随意添加、删除和修改笔记。

### 4. 添加标题目录（可选）

推荐直接在 note 目录创建 `.md` 或者文件夹。如果要将内容放在 note 文件夹之外，需要自行添加到 `generate-content.js` 文件中的 `scanDirs` 数组中。

```javascript
const scanDirs = ['note', 'posts', 'docs']; // 添加更多目录
```

### 5. 更新内容

每次修改完，运行以下命令更新侧边栏和首页：

```bash
node generate-content.js
```

### 6. 修改完后推送到你的 GitHub 地址

完成修改后，将内容提交并推送到你的 GitHub 仓库：

首次提交你可能需要执行：

```bash
git remote add origin https://github.com/你的用户名/PurePage.git
git add .
git commit -m "添加新文章和修改"
git push -f origin main
```

之后的每次提交：

```bash
git add .
git commit -m "添加新文章和修改"
git push origin main
```

### 7. 部署

1. 在 Settings → Pages 中启用 GitHub Pages
2. Branch 选择 main 分支和根目录，点击 Save
3. 访问：`https://你的用户名.github.io/PurePage/`

> 你也可以部署在 Vercel 或者 Cloudflare Pages 等站点托管服务上

## 🔗 相关链接
- **原项目**: https://github.com/yym68686/PurePage
- **博客地址**: https://zhubaiwan-oozzxx.github.io/PurePage