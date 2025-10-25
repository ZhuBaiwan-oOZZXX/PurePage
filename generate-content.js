const fs = require('fs');
const path = require('path');

/**
 * 获取指定目录的递归文件结构
 */
function getDirectoryStructure(dirPath, rootDir) {
    const relativePath = path.relative(rootDir, dirPath);
    const name = path.basename(dirPath);

    // 检查是否为目录
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
        return {
            name: name,
            type: 'file',
            path: relativePath.replace(/\\/g, '/')
        };
    }

    // 处理目录
    const children = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        // 跳过隐藏文件
        if (file.startsWith('.')) continue;

        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
            children.push(getDirectoryStructure(filePath, rootDir));
        } else {
            // 只包含markdown文件
            if (file.toLowerCase().endsWith('.md')) {
                const relativeFilePath = path.relative(rootDir, filePath);
                children.push({
                    name: file,
                    type: 'file',
                    path: relativeFilePath.replace(/\\/g, '/')
                });
            }
        }
    }

    return {
        name: name,
        type: 'folder',
        path: relativePath.replace(/\\/g, '/') || name,
        children: children
    };
}

/**
 * 生成侧边栏文件结构
 */
function generateSidebarStructure() {
    const rootDir = path.resolve(__dirname);
    const structure = {
        name: 'root',
        type: 'folder',
        path: '',
        children: []
    };

    try {
        // 定义要扫描的目录
        const scanDirs = ['note'];
        
        scanDirs.forEach(folder => {
            const folderPath = path.join(rootDir, folder);
            if (!fs.existsSync(folderPath)) {
                console.warn(`警告: ${folder} 目录不存在！将被跳过`);
                return;
            }

            const folderStructure = getDirectoryStructure(folderPath, rootDir);
            structure.children.push(folderStructure);
        });

        if (structure.children.length === 0) {
            console.error('错误: 没有找到有效的文件夹！');
            return;
        }

        // 输出JSON文件
        const outputPath = path.join(rootDir, 'content-structure.json');
        fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
        console.log(`文件结构已保存至: ${outputPath}`);

    } catch (error) {
        console.error('生成文件结构时出错:', error);
    }
}

/**
 * 获取Markdown文件的标题
 */
function getTitle(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : path.basename(filePath, '.md');
    } catch (error) {
        console.error(`读取文件标题失败 ${filePath}:`, error);
        return path.basename(filePath, '.md');
    }
}

/**
 * 生成首页文章列表和站点地图
 */
function generateIndexAndSitemap() {
    const rootDir = path.resolve(__dirname);
    const mdFiles = [];
    const mdFilesPath = [];
    const mdCreateTime = [];

    // 定义要扫描的目录
    const scanDirs = ['note'];

    function scanMdFiles(directory) {
        const files = fs.readdirSync(directory, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(directory, file.name);
            if (file.isDirectory()) {
                scanMdFiles(filePath);
            } else if (file.name.toLowerCase().endsWith('.md')) {
                const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                mdFilesPath.push(relativePath);
                
                const stats = fs.statSync(filePath);
                mdCreateTime.push(new Date(stats.mtime).toISOString().split('T')[0]);
            }
        }
    }

    scanDirs.forEach(dir => {
        const dirPath = path.join(rootDir, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`扫描目录: ${dir}`);
            scanMdFiles(dirPath);
        }
    });

    // 生成文章列表
    let articleListContent = '';
    if (mdFilesPath.length > 0) {
        const postList = mdFilesPath.map((path, index) => [path, mdCreateTime[index]]);
        const postSortedList = postList.sort((a, b) => new Date(b[1]) - new Date(a[1]));

        for (const [mdPath, createTime] of postSortedList) {
            const cleanPath = mdPath.replace('\\', '/');
            const filePath = path.join(rootDir, cleanPath);
            try {
                const title = getTitle(filePath);
                // 只对空格进行编码，其他字符保持原样
                const encodedPath = cleanPath.replace(/ /g, '%20');
                articleListContent += `- [${title}](#${encodedPath}) ${createTime}\n`;
                console.log(`=> ${createTime} #${encodedPath}`);
            } catch (error) {
                console.error(`警告：读取文件 ${filePath} 时出错：${error}`);
            }
        }
    } else {
        articleListContent = "暂无文章，请添加文章到note目录。\n";
    }

    // 完全重写index.md文件
    try {
        const indexPath = path.join(rootDir, 'index.md');
        const template = `# 欢迎来到我的博客

> 一个基于 [PurePage](https://github.com/ZhuBaiwan-oOZZXX/PurePage) 的极简静态博客

## 文章列表

${articleListContent}

## 开始写作

要添加新文章，只需在 note 目录下创建 \`.md\` 文件，然后运行：

\`\`\`bash
# 更新侧边栏和首页
node generate-content.js
\`\`\`

创建其他目录请参考项目 [README.md](https://github.com/ZhuBaiwan-oOZZXX/PurePage) 文件。

## 联系我

- 邮箱：zhubaiwan.oozzxx@gmail.com
- GitHub：ZhuBaiwan-oOZZXX

---

*感谢访问我的博客！*`;

        fs.writeFileSync(indexPath, template, 'utf8');
        console.log('首页文章列表已更新');
    } catch (error) {
        console.error('更新首页失败:', error);
    }

    // 生成站点地图
    try {
        const siteUrl = "https://zhubaiwan-oozzxx.github.io/PurePage/";
        const lastmod = new Date().toISOString().split('T')[0];
        const urls = [""].concat(mdFilesPath.map(p => p.replace(/^\.\//, '')));

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        for (const url of urls) {
            const fullUrl = siteUrl + url;
            console.log("=>", fullUrl);
            sitemap += '  <url>\n';
            sitemap += `    <loc>${fullUrl}</loc>\n`;
            sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
            sitemap += '    <changefreq>daily</changefreq>\n';
            sitemap += '  </url>\n';
        }
        
        sitemap += '</urlset>\n';
        
        fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemap, 'utf8');
        console.log('\n站点地图已生成');
    } catch (error) {
        console.error('生成站点地图失败:', error);
    }
}

// 主函数
function main() {
    console.log('开始生成内容...\n');
    
    // 生成侧边栏结构
    console.log('1. 生成侧边栏结构...');
    generateSidebarStructure();
    
    console.log('\n2. 生成首页文章列表和站点地图...');
    generateIndexAndSitemap();
    
    console.log('\n内容生成完成！');
}

// 执行主函数
main();