# PurePage - 极简静态博客

一个基于纯前端技术的极简静态博客系统，支持 Markdown 渲染、数学公式、代码高亮等功能。

## ✨ 功能特性

- **Markdown 支持** - 完整的 Markdown 语法渲染
- **数学公式** - 支持数学公式渲染 (MathJax)
- **图表绘制** - 支持 Mermaid 流程图、时序图等
- **代码高亮** - 代码语法高亮显示
- **响应式设计** - 适配桌面和移动设备

## 🚀 使用方法

### 1. 添加新文章

在 `note` 目录下创建你的 `.md` 笔记或文件夹。

### 2. 更新内容

运行以下命令更新侧边栏和首页：

```bash
node generate-content.js
```

### 3. 部署

1. Fork 本仓库
2. 在 Settings → Pages 中启用 GitHub Pages
3. Branch 选择 main 分支和根目录，点击 Save
4. 访问：`https://你的用户名.github.io/PurePage/`

> 你也可以部署在 Vercel 或者 Cloudflare Pages 等站点托管服务上

## ⚙️ 自定义配置

### 配置博客标题
修改 `index.html` 中 `<title>` 标签的博客标题，以及第 21 行的侧边栏标题：

```html
<title>朱百万oOZZXX</title>
...
<h3>朱百万oOZZXX</h3>
```

### 添加新的文章目录

推荐直接在 note 目录创建 `.md` 或者文件夹。如果要将内容放在 note 文件夹之外，需要自行添加到 `generate-content.js` 文件中的 `scanDirs` 数组中。

```javascript
const scanDirs = ['note', 'posts', 'docs']; // 添加更多目录
```


## 🔗 相关链接
- **原项目**: https://github.com/yym68686/PurePage
- **博客地址**: https://zhubaiwan-oozzxx.github.io/PurePage
