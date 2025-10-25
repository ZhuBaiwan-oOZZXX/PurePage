import { processMathAndMarkdown, renderMathInElement } from './htmd/latex.js';

document.addEventListener('DOMContentLoaded', function() {
    // 元素获取
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const togglePin = document.getElementById('togglePin');
    const fileTree = document.getElementById('fileTree');
    const markdownContent = document.getElementById('markdown-content');
    const currentFileName = document.getElementById('currentFileName');
    const sidebarTitle = document.querySelector('.sidebar-header h3');

    // 状态管理
    let isPinned = false;
    const isMobile = () => window.innerWidth <= 768;

    // 初始化
    init();

    // 初始化函数
    function init() {
        checkUrlAndLoadContent();
        setupEventListeners();
        if (isMobile()) sidebar.classList.add('collapsed');
    }

    // 设置事件监听器
    function setupEventListeners() {
        sidebarToggle.addEventListener('click', toggleSidebar);
        togglePin.addEventListener('click', togglePinSidebar);
        sidebar.addEventListener('mouseleave', collapseSidebar);
        sidebarToggle.addEventListener('mouseenter', expandSidebar);
        sidebarTitle.addEventListener('click', goToHome);
        window.addEventListener('hashchange', checkUrlAndLoadContent);
        window.addEventListener('resize', handleResize);
        document.addEventListener('click', handleLinkClick);
        
        const content = document.getElementById('content');
        content.addEventListener('click', hideSidebarOnMobile);
        sidebar.addEventListener('click', stopPropagation);
    }

    // 侧边栏操作
    function toggleSidebar() {
        if (isMobile()) {
            sidebar.classList.toggle('expanded');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    }

    function togglePinSidebar() {
        if (isMobile()) {
            sidebar.classList.remove('expanded');
        } else {
            isPinned = !isPinned;
            togglePin.classList.toggle('pinned', isPinned);
            if (!isPinned) sidebar.classList.add('collapsed');
        }
    }

    function collapseSidebar() {
        if (!isPinned) sidebar.classList.add('collapsed');
    }

    function expandSidebar() {
        sidebar.classList.remove('collapsed');
    }

    function hideSidebarOnMobile(e) {
        if (isMobile() && !e.target.closest('a')) {
            sidebar.classList.remove('expanded');
        }
    }

    function stopPropagation(e) {
        e.stopPropagation();
    }

    function handleResize() {
        if (!isMobile()) {
            sidebar.classList.remove('expanded');
            if (!isPinned) sidebar.classList.add('collapsed');
        }
    }

    // 导航功能
    function goToHome() {
        loadFileContent('index.md');
        updateUrl('index.md');
        clearActiveFiles();
        if (isMobile()) sidebar.classList.remove('expanded');
    }

    // URL和内容管理
    function checkUrlAndLoadContent() {
        let path = window.location.hash.substring(1);
        
        if (!path) {
            loadFileContent('index.md');
            return;
        }

        // 解码URL路径
        path = decodeURIComponent(path);
        
        // 确保路径格式正确（移除不必要的./前缀）
        if (path.startsWith('./')) {
            path = path.substring(2);
        }

        loadFileContent(path);
    }

    function updateUrl(filePath) {
        const cleanPath = filePath.replace(/^\.\//, '');
        window.location.hash = cleanPath;
    }

    // 文件树管理
    async function loadFileTree() {
        try {
            const response = await fetch('content-structure.json');
            if (!response.ok) throw new Error(`加载文件结构失败: HTTP ${response.status}`);

            const fileStructure = await response.json();
            fileTree.innerHTML = generateFileTree(fileStructure);

            setupFileTreeEvents();
            highlightActiveFile();
            
        } catch (error) {
            fileTree.innerHTML = `<div class="error">加载文件失败: ${error.message}</div>`;
            console.error('加载文件结构失败:', error);
        }
    }

    function generateFileTree(item, level = 0) {
        if (item.name === 'root' && level === 0) {
            return item.children?.map(child => generateFileTree(child, level)).join('') || '';
        }

        if (item.type === 'folder') {
            return `
                <div class="file-tree-folder${level === 0 ? ' root-folder' : ''}" data-path="${item.path}">
                    <div class="file-tree-item" style="padding-left: ${15 + level * 10}px">
                        ${item.name}
                    </div>
                    <div class="file-tree-folder-content">
                        ${item.children?.map(child => generateFileTree(child, level + 1)).join('') || ''}
                    </div>
                </div>
            `;
        } else if (item.type === 'file') {
            return `
                <div class="file-tree-item file" data-path="${item.path}" style="padding-left: ${15 + level * 10}px">
                    ${item.name}
                </div>
            `;
        }
        return '';
    }

    function setupFileTreeEvents() {
        // 展开第一级文件夹
        document.querySelectorAll('.file-tree-folder').forEach(folder => {
            if (folder.parentElement.id === 'fileTree') {
                folder.classList.add('expanded');
            }
        });

        // 文件夹点击事件
        document.querySelectorAll('.file-tree-folder > .file-tree-item').forEach(folder => {
            folder.addEventListener('click', function(e) {
                e.stopPropagation();
                this.parentElement.classList.toggle('expanded');
            });
        });

        // 文件点击事件
        document.querySelectorAll('.file-tree-item.file').forEach(file => {
            file.addEventListener('click', function() {
                clearActiveFiles();
                this.classList.add('active');

                const filePath = this.getAttribute('data-path');
                loadFileContent(filePath);
                updateUrl(filePath);

                if (currentFileName) {
                    currentFileName.textContent = this.textContent.trim();
                }

                if (isMobile()) sidebar.classList.remove('expanded');
            });
        });
    }

    function clearActiveFiles() {
        document.querySelectorAll('.file-tree-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    function highlightActiveFile() {
        let path = window.location.hash.substring(1);
        if (!path) return;

        // 解码URL路径
        path = decodeURIComponent(path);
        
        // 确保路径格式一致（移除不必要的./前缀）
        if (path.startsWith('./')) {
            path = path.substring(2);
        }

        const fileElement = document.querySelector(`.file-tree-item.file[data-path="${path}"]`);
        if (fileElement) {
            clearActiveFiles();
            fileElement.classList.add('active');
            expandParentFolders(fileElement);
        }
    }

    function expandParentFolders(fileElement) {
        let parent = fileElement.parentElement;
        while (parent && parent.classList.contains('file-tree-folder-content')) {
            parent.parentElement.classList.add('expanded');
            parent = parent.parentElement.parentElement;
        }
    }

    // 内容加载
    async function loadFileContent(filePath) {
        try {
            markdownContent.innerHTML = '<div class="loading">加载内容中...</div>';
            const content = await fetchFileContent(filePath);
            const renderedContent = processMathAndMarkdown(content);
            markdownContent.innerHTML = renderedContent;
            await renderMathInElement(markdownContent);
        } catch (error) {
            markdownContent.innerHTML = `<div class="error">加载内容失败: ${error.message}</div>`;
        }
    }

    async function fetchFileContent(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`加载文件失败: HTTP ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error(`加载文件失败 ${filePath}:`, error);
            return `# 加载失败\n\n无法加载文件: ${filePath}\n\n错误: ${error.message}`;
        }
    }

    // 链接点击处理
    function handleLinkClick(e) {
        const link = e.target.closest('a');
        if (!link?.href) return;

        const href = link.getAttribute('href');
        if (href?.startsWith('#note/')) {
            e.preventDefault();
            const hashPath = href.substring(1);
            const decodedPath = decodeURIComponent(hashPath);
            const path = decodedPath;
            
            loadFileContent(path);
            updateUrl(path);
            highlightActiveFile();
            
            if (isMobile()) sidebar.classList.remove('expanded');
        }
    }

    // 初始化文件树
    loadFileTree();
});
