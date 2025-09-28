# PurePage - 极简静态博客系统

> 本项目基于 [yym68686/PurePage](https://github.com/yym68686/PurePage) 进行修改

PurePage 是一个极简主义的静态博客系统，完全基于原生 HTML、JavaScript 和 CSS 实现。

## ✨ 特性

- **Markdown 支持** - 完整的 Markdown 语法渲染
- **数学公式** - 集成 LaTeX 数学公式渲染
- **图表绘制** - 支持 Mermaid 流程图、时序图等
- **代码高亮** - 专业的代码语法高亮显示
- **响应式设计** - 完美适配桌面和移动设备

## 🚀 快速开始

### 1. 环境准备
确保系统已安装 Node.js 和 Python 3

### 2. 获取代码
```bash
git clone https://github.com/ZhuBaiwan-oOZZXX/PurePage.git
cd PurePage
```

## ⚙️ 配置说明

### 配置博客标题
修改 `index.html` 第 21 行的博客标题：
```html
<h3>你的博客名称</h3>
```

### 配置文章目录
如需添加自己的文章目录，需要同时修改两个配置文件：

1. 修改 `generate-sidebar-structure.js` 第 102 行的目录列表：
```javascript
const scanDirs = ['note', 'novel'];  // 添加或删除目录名
```

2. 修改 `init.py` 第 46 行的目录列表：
```python
scan_dirs = ['note', 'novel']  # 添加或删除目录名
```

## 📝 使用指南

### 添加新文章
1. 在已配置的目录下创建 `.md` 文件
2. 运行生成脚本更新导航和首页
   ```bash
   node generate-sidebar-structure.js
   python init.py
   ```
3. 提交并推送到 GitHub
   ```
   git add .
   git commit -m "添加新文章"
   git push
   ```

### 添加新目录
1. 创建目录：`mkdir 新目录名`
2. 修改配置文件中的目录列表
3. 添加文章并运行生成脚本

## 🌐 部署到 GitHub Pages

1. Fork 本仓库
2. 在 Settings → Pages 中启用 GitHub Pages
3. Branch 选择 main 分支和根目录
4. 访问：`https://你的用户名.github.io/PurePage/`

> 你也可以部署在 Vercel 或者 Cloudflare Pages 等站点托管服务上

## 🔗 相关链接
- **原项目**: https://github.com/yym68686/PurePage
- **博客地址**: https://zhubaiwan-oozzxx.github.io/PurePage
