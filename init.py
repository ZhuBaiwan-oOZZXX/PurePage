# 获得当前文件夹下所有markdown文件的目录
import os
import re
from datetime import datetime
# 跨平台清屏函数
import platform
def clear_screen():
    if platform.system() == "Windows":
        os.system("cls")
    else:
        os.system("clear")

clear_screen()

def generate_sitemap(url_list):
    print("generate sitemap...")
    # 定义网站 URL 和更新日期
    site_url = "https://zhuBaiwan-oOZZXX.github.io/PurePage/"
    lastmod = datetime.now().strftime('%Y-%m-%d')
    url_list = [""] + url_list
    urls = [site_url + item for item in url_list]

    # 生成 sitemap.xml 文件（修复中文编码问题）
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for url in urls:
            print("=>", url)
            f.write('  <url>\n')
            f.write('    <loc>{}</loc>\n'.format(url))
            f.write('    <lastmod>{}</lastmod>\n'.format(lastmod))
            f.write('    <changefreq>daily</changefreq>\n')
            f.write('  </url>\n')
        f.write('</urlset>\n')

def gettitle(text):
    regex = r"^#\s.*?$"
    matches = re.findall(regex, text, re.MULTILINE)[0]
    return matches[2:]

# 自动扫描所有目录下的markdown文件
path = os.path.dirname(os.path.abspath(__file__))
md_files = []
md_files_path = []
md_create_time = []

# 定义要扫描的目录列表（可以在这里添加新目录）
scan_dirs = ['note', 'novel']  # 添加新目录只需在这里添加目录名

def scan_md_files(directory, base_dir=""):
    """递归扫描目录下的所有markdown文件"""
    md_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.md'):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, path)
                # 将Windows路径分隔符转换为URL兼容的斜杠
                relative_path = relative_path.replace('\\', '/')
                md_files.append(relative_path)
    return md_files

for dir_name in scan_dirs:
    dir_path = os.path.join(path, dir_name)
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        print(f"扫描目录: {dir_name}")
        md_files_in_dir = scan_md_files(dir_path)
        for md_file in md_files_in_dir:
            file_path = os.path.join(path, md_file)
            # 使用os.path.normpath确保路径兼容性
            file_path = os.path.normpath(file_path)
            timestamp = os.path.getmtime(file_path)
            dt = datetime.fromtimestamp(timestamp)
            md_create_time += [dt.strftime("%Y-%m-%d")]
            md_files_path += [f"./{md_file}"]
            print("=>", dt.strftime("%Y-%m-%d"), f"./{md_file}")

if md_files_path:
    post_list = list(zip(md_files_path, md_create_time))
    post_sorted_list = sorted(post_list, key=lambda x: x[1], reverse=True)
else:
    post_sorted_list = []

regex = r"##\s文章列表\n\n(.*?)\n\n##"
with open("index.md", "r", encoding="utf-8") as f:
    md_content = f.read()
matches = re.finditer(regex, md_content, re.MULTILINE | re.DOTALL)
start = 0
end = 0
match_found = False

for matchNum, match in enumerate(matches, start=1):
    start = match.start(1)
    end = match.end(1)
    print(f"在{start}-{end}找到组{1}: {match.group(1)}")
    match_found = True
    break

if not match_found:
    print("未找到'## 文章列表'部分，将创建新的文章列表")
    # 查找"## 文章列表"的位置
    article_list_pos = md_content.find("## 文章列表")
    if article_list_pos != -1:
        # 找到"## 文章列表"后的第一个换行
        newline_pos = md_content.find("\n", article_list_pos)
        if newline_pos != -1:
            start = newline_pos + 1
            # 找到下一个"##"的位置
            next_section_pos = md_content.find("##", newline_pos + 1)
            if next_section_pos != -1:
                # 找到下一个"##"前的换行
                prev_newline_pos = md_content.rfind("\n", 0, next_section_pos)
                if prev_newline_pos != -1:
                    end = prev_newline_pos
                else:
                    end = next_section_pos
            else:
                end = len(md_content)

if post_sorted_list:
    new_content = ""
    for mdpath, create_time in post_sorted_list:
        # 确保路径使用正斜杠（跨平台兼容）
        mdpath = mdpath.replace('\\', '/')
        # 使用os.path.normpath确保文件路径兼容性
        file_path = os.path.normpath(mdpath)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                post_content = f.read()
            title = gettitle(post_content)
            new_content += f"- [{title}]({mdpath}) {create_time}\n"
        except FileNotFoundError:
            print(f"警告：文件 {file_path} 不存在，跳过")
        except Exception as e:
            print(f"警告：读取文件 {file_path} 时出错：{e}")
else:
    new_content = "暂无文章，请添加文章到note目录。"

# 确保新内容前后有适当的换行
if not new_content.endswith("\n"):
    new_content += "\n"
    
md_content = md_content[:start] + "\n" + new_content + md_content[end:]
with open("index.md", "w", encoding="utf-8") as f:
    f.write(md_content)

# 生成站点地图
md_files_path = [url[2:] for url in md_files_path]  # 移除"./"前缀
generate_sitemap(md_files_path)

# 跨平台Git命令（注释掉，需要时取消注释）
# if platform.system() == "Windows":
#     # Windows命令
#     os.system(f'cd /d "{path}" && git add . && git commit -m "%date% %time%" && git push origin HEAD')
# else:
#     # Linux/Mac命令
#     os.system(f'cd "{path}" && git add . && git commit -m "$(date)" && git push origin $(git name-rev --name-only HEAD)')