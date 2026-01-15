const fs = require('fs');
const path = require('path');

// 定义要扫描的目录
const SCAN_DIRS = ['note', '测试'];

// 常量定义
const NOTE_DIR_PREFIX = 'note/';
const MD_EXTENSION = '.md';
const H3_PREFIX = '### ';
const H4_PREFIX = '#### ';
const INDENT_SPACES = '  ';

// 工具函数：规范化路径（将反斜杠转换为正斜杠）
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}

// 工具函数：获取相对路径并规范化
function getRelativePath(filePath, rootDir) {
    return normalizePath(path.relative(rootDir, filePath));
}

/**
 * 扫描目录并返回存在的目录列表
 */
function getValidDirectories(rootDir) {
    return SCAN_DIRS.filter(dir => {
        const dirPath = path.join(rootDir, dir);
        if (!fs.existsSync(dirPath)) {
            console.warn(`警告: ${dir} 目录不存在！将被跳过`);
            return false;
        }
        return true;
    });
}

/**
 * 统一扫描目录，同时获取目录结构和文件信息
 */
function scanDirectory(dirPath, rootDir, mdFilesInfo = []) {
    const relativePath = getRelativePath(dirPath, rootDir);
    const name = path.basename(dirPath);
    const stats = fs.statSync(dirPath);

    if (!stats.isDirectory()) {
        return {
            name: name,
            type: 'file',
            path: relativePath
        };
    }

    const children = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (file.startsWith('.')) continue;

        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
            children.push(scanDirectory(filePath, rootDir, mdFilesInfo));
        } else if (file.toLowerCase().endsWith(MD_EXTENSION)) {
            const relativeFilePath = getRelativePath(filePath, rootDir);

            // 添加到侧边栏结构
            children.push({
                name: file,
                type: 'file',
                path: relativeFilePath
            });

            // 添加到文件信息列表
            const createTime = new Date(fileStats.mtime).toISOString().split('T')[0];
            mdFilesInfo.push({
                path: relativeFilePath,
                createTime: createTime,
                title: getTitle(filePath),
                dir: path.dirname(relativeFilePath)
            });
        }
    }

    return {
        name: name,
        type: 'folder',
        path: relativePath || name,
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

    const validDirs = getValidDirectories(rootDir);

    validDirs.forEach(folder => {
        const folderPath = path.join(rootDir, folder);
        structure.children.push(scanDirectory(folderPath, rootDir));
    });

    if (structure.children.length === 0) {
        console.error('错误: 没有找到有效的文件夹！');
        return;
    }

    const outputPath = path.join(rootDir, 'content-structure.json');
    fs.writeFileSync(outputPath, JSON.stringify(structure, null, 2));
    console.log(`文件结构已保存至: ${outputPath}\n`);
}

/**
 * 获取Markdown文件的标题
 */
function getTitle(filePath) {
    return path.basename(filePath, MD_EXTENSION);
}

/**
 * 按文件夹组织文章列表
 */
function organizeArticlesByFolder(mdFilesInfo) {
    const folderMap = {};

    mdFilesInfo.forEach(fileInfo => {
        const dir = fileInfo.dir;
        (folderMap[dir] = folderMap[dir] || []).push(fileInfo);
    });

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

    getValidDirectories(rootDir).forEach(dir => {
        console.log(`扫描目录: ${dir}`);
        scanDirectory(path.join(rootDir, dir), rootDir, mdFilesInfo);
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
            return Object.values(tree).map(node => {
                let content = '';

                if (depth === 0) {
                    const displayName = node.path.startsWith(NOTE_DIR_PREFIX) ?
                        node.path.substring(NOTE_DIR_PREFIX.length) : node.name;
                    content += `${H3_PREFIX}${displayName}\n\n`;
                } else {
                    content += `${INDENT_SPACES.repeat(depth - 1)}${H4_PREFIX}${node.name}\n`;
                }

                if (node.files?.length > 0) {
                    const indentSpaces = depth > 0 ? INDENT_SPACES.repeat(depth) : '';
                    node.files.forEach(fileInfo => {
                        const encodedPath = fileInfo.path.replace(/ /g, '%20');
                        content += `${indentSpaces}- [${fileInfo.title}](#${encodedPath}) ${fileInfo.createTime}\n`;
                        console.log(`=> ${fileInfo.createTime} #${encodedPath}`);
                    });
                    content += '\n';
                }

                if (Object.keys(node.children).length > 0) {
                    content += renderTree(node.children, depth + 1);
                }

                return content;
            }).join('');
        }

        // 按字母顺序排序根节点
        const sortedFolderTree = {};
        Object.keys(folderTree).sort().forEach(key => {
            sortedFolderTree[key] = folderTree[key];
        });

        // 渲染目录树并移除末尾多余的换行
        articleListContent = renderTree(sortedFolderTree).trimEnd();

    } else {
        articleListContent = "暂无文章，请添加文章到note目录。\n";
    }

    const indexPath = path.join(rootDir, 'index.md');
    const templatePath = path.join(rootDir, 'templates', 'index-template.md');
    let template = fs.readFileSync(templatePath, 'utf8');
    template = template.replace('{{ARTICLE_LIST}}', articleListContent);
    fs.writeFileSync(indexPath, template, 'utf8');
    console.log('首页文章列表已更新\n');
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