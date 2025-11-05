const fs = require('fs');
const path = require('path');

// 定义要扫描的目录
const SCAN_DIRS = ['note', '测试'];

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
        SCAN_DIRS.forEach(folder => {
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
        console.log(`文件结构已保存至: ${outputPath}\n`);

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
 * 递归获取目录中的所有markdown文件信息
 */
function getMdFilesInfo(directory, rootDir) {
    const result = [];
    const files = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const file of files) {
        const filePath = path.join(directory, file.name);
        if (file.isDirectory()) {
            result.push(...getMdFilesInfo(filePath, rootDir));
        } else if (file.name.toLowerCase().endsWith('.md')) {
            const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
            const stats = fs.statSync(filePath);
            const createTime = new Date(stats.mtime).toISOString().split('T')[0];
            const title = getTitle(filePath);
            
            result.push({
                path: relativePath,
                createTime: createTime,
                title: title,
                dir: path.dirname(relativePath)
            });
        }
    }
    
    return result;
}

/**
 * 按文件夹组织文章列表
 */
function organizeArticlesByFolder(mdFilesInfo) {
    const folderMap = {};
    
    // 按文件夹分组并排序
    mdFilesInfo.forEach(fileInfo => {
        const dir = fileInfo.dir;
        if (!folderMap[dir]) {
            folderMap[dir] = [];
        }
        folderMap[dir].push(fileInfo);
    });
    
    // 对每个文件夹内的文章按时间排序
    Object.values(folderMap).forEach(files => {
        files.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    });
    
    return folderMap;
}

/**
 * 生成首页文章列表
 */
function generateIndex() {
    const rootDir = path.resolve(__dirname);
    const mdFilesInfo = [];

    SCAN_DIRS.forEach(dir => {
        const dirPath = path.join(rootDir, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`扫描目录: ${dir}`);
            mdFilesInfo.push(...getMdFilesInfo(dirPath, rootDir));
        }
    });

    // 生成按文件夹分类的文章列表
    let articleListContent = '';
    if (mdFilesInfo.length > 0) {
        const folderMap = organizeArticlesByFolder(mdFilesInfo);
        
        // 构建目录树结构
        const folderTree = {};
        
        // 初始化树结构
        Object.keys(folderMap).forEach(folderPath => {
            const parts = folderPath.split('/');
            let currentNode = folderTree;
            
            // 逐级创建目录节点
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!currentNode[part]) {
                    currentNode[part] = {
                        name: part,
                        path: parts.slice(0, i + 1).join('/'),
                        children: {},
                        files: []
                    };
                }
                
                // 如果是最后一级，添加文件列表
                if (i === parts.length - 1) {
                    currentNode[part].files = folderMap[folderPath];
                }
                
                currentNode = currentNode[part].children;
            }
        });
        
        // 递归渲染目录树
        function renderTree(tree, depth = 0) {
            let content = '';
            
            Object.values(tree).forEach(node => {
                // 显示目录名（带适当的标题级别）
                if (depth === 0) {
                    // 根目录级别
                    const displayName = node.path.startsWith('note/') ? 
                        node.path.substring(5) : node.name;
                    content += `### ${displayName}\n\n`;
                } else {
                    // 子目录级别使用四级标题
                    const indentSpaces = '  '.repeat(depth - 1);
                    content += `${indentSpaces}#### ${node.name}\n`;
                }
                
                // 显示该目录下的文件
                if (node.files && node.files.length > 0) {
                    const indentSpaces = depth > 0 ? '  '.repeat(depth) : '';
                    node.files.forEach(fileInfo => {
                        const encodedPath = fileInfo.path.replace(/ /g, '%20');
                        content += `${indentSpaces}- [${fileInfo.title}](#${encodedPath}) ${fileInfo.createTime}\n`;
                        console.log(`=> ${fileInfo.createTime} #${encodedPath}`);
                    });
                    content += '\n';
                }
                
                // 递归渲染子目录
                if (Object.keys(node.children).length > 0) {
                    content += renderTree(node.children, depth + 1);
                }
            });
            
            return content;
        }
        
        // 按字母顺序排序根节点
        const sortedFolderTree = {};
        const keys = Object.keys(folderTree);
        keys.sort().forEach(key => {
            sortedFolderTree[key] = folderTree[key];
        });
        
        // 渲染目录树并移除末尾多余的换行
        articleListContent = renderTree(sortedFolderTree).trimEnd();
        
    } else {
        articleListContent = "暂无文章，请添加文章到note目录。\n";
    }

    // 完全重写index.md文件
    try {
        const indexPath = path.join(rootDir, 'index.md');
        // 从模板文件读取模板内容
        const templatePath = path.join(rootDir, 'templates', 'index-template.md');
        let template = fs.readFileSync(templatePath, 'utf8');
        // 替换文章列表占位符
        template = template.replace('{{ARTICLE_LIST}}', articleListContent);

        fs.writeFileSync(indexPath, template, 'utf8');
        console.log('首页文章列表已更新\n');
    } catch (error) {
        console.error('更新首页失败:\n', error);
    }
}

// 主函数
function main() {
    console.log('开始生成内容...\n');
    
    // 生成侧边栏结构
    console.log('1. 生成侧边栏结构...');
    generateSidebarStructure();
    
    console.log('2. 生成首页文章列表...');
    generateIndex();
}

// 执行主函数
main();