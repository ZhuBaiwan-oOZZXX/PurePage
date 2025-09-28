# 获得当前文件夹下所有markdown文件的目录
# 用法：python Deploy.py
import os
import re
from datetime import datetime
# Windows系统使用cls，Linux/Mac使用clear
import platform
if platform.system() == "Windows":
    os.system("cls")
else:
    os.system("clear")

def generate_sitemap(url_list):
    print("generate sitemap...")
    # 定义网站 URL 和更新日期
    site_url = "https://zhuBaiwan-oOZZXX.github.io/PurePage/"
    lastmod = datetime.now().strftime('%Y-%m-%d')
    url_list = [""] + url_list
    urls = [site_url + item for item in url_list]

    # 生成 sitemap.xml 文件
    with open('sitemap.xml', 'w') as f:
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
path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
md_files = []
md_files_path = []
md_create_time = []

# 定义要扫描的目录列表（可以在这里添加新目录）
scan_dirs = ['note', 'novel']  # 添加新目录只需在这里添加目录名

for dir_name in scan_dirs:
    dir_path = os.path.join(path, dir_name)
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        print(f"扫描目录: {dir_name}")
        all_files = os.listdir(dir_path)
        for file in all_files:
            if file.lower().endswith('.md'):
                file_path = os.path.join(dir_path, file)
                timestamp = os.path.getmtime(file_path)
                dt = datetime.fromtimestamp(timestamp)
                md_create_time += [dt.strftime("%Y-%m-%d")]
                md_files_path += [f"./{dir_name}/{file}"]
                print("=>", dt.strftime("%Y-%m-%d"), f"./{dir_name}/{file}")

if md_files_path:
    post_list = list(zip(md_files_path, md_create_time))
    post_sorted_list = sorted(post_list, key=lambda x: x[1], reverse=True)
else:
    post_sorted_list = []

regex = r"##\s文章列表\n(\n*(-\s.*\n)*\n*)##"
with open("index.md", "r", encoding="utf-8") as f:
    md_content = f.read()
matches = re.finditer(regex, md_content, re.MULTILINE)
start = 0
end = 0
for matchNum, match in enumerate(matches, start=1):
    start = match.start(1)
    end = match.end(1)
    print ("在{start}-{end}找到组{groupNum}: {group}".format(groupNum = 1, start = match.start(1), end = match.end(1), group = match.group(1)))
    break

if post_sorted_list:
    new_content = ""
    for mdpath, create_time in post_sorted_list:
        with open(mdpath, "r", encoding="utf-8") as f:
            post_content = f.read()
        title = gettitle(post_content)
        new_content += f"- [{title}]({mdpath}) {create_time}\n"
else:
    new_content = "暂无文章，请添加文章到note目录。"

md_content = md_content[:start] + "\n" + new_content + "\n" + md_content[end:]
with open("index.md", "w", encoding="utf-8") as f:
    f.write(md_content)

# 生成站点地图
md_files_path = [url[2:] for url in md_files_path]  # 移除"./"前缀
generate_sitemap(md_files_path)

# os.system(f'cd {path} && git add . && git commit -m "$(date)" && git push origin $(git name-rev --name-only HEAD)')