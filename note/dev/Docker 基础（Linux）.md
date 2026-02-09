# Docker 基础（Linux）

## 安装

一键安装命令：

```bash
sudo curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
```

备用：

```bash
sudo curl -fsSL https://gitee.com/tech-shrimp/docker_installer/releases/download/latest/linux.sh | bash -s docker --mirror Aliyun
```

安装完成后启动 Docker 服务：

```bash
sudo service docker start
```

## 换源

```bash
sudo vi /etc/docker/daemon.json
```

输入以下内容，按 ESC，输入 `:wq` 保存退出

```json
{
  "registry-mirrors": [
    "https://docker.m.ixdev.cn",
    "https://hub.rat.dev",
    "https://docker.xuanyuan.me",
    "https://mirror.ccs.tencentyun.com",
    "https://docker.1ms.run",
    "https://docker.fnnas.com",
    "https://docker.m.daocloud.io"
  ]
}
```

换源后需要重启 Docker 服务：

```bash
sudo service docker restart
```

## Docker 常用命令与参数

> 遇到不清楚的命令就用 `--help` 参数查看命令用法
> 停止、启动、重启、删除容器时无需再次指定挂载卷、端口映射、环境变量等参数，因为这些参数在容器创建时已经确定

- 查看 Docker 信息与版本：`docker info`、`docker version`、`docker --version`、`docker -v`
- 查看 Docker 镜像列表：`docker images`、`docker image ls`、`docker image list`
  - `-a`、`--all`：显示所有镜像（包含未使用的）
  - `--digests`：显示镜像的摘要信息
  - `-q`：只显示镜像 ID
- 拉取镜像：`docker pull <镜像名称>`、`docker image pull <镜像名称>`
- 删除镜像：`docker rmi <镜像ID>`、`docker image rm <镜像ID>`、`docker image remove <镜像ID>`
  - `-f`、`--force`：强制删除镜像，即使有容器在运行
- 创建并启动容器：`docker run <镜像名称>`、`docker container run <镜像名称>`
  - `-d`、`--detach`：在后台运行容器
  - `-p`、`--publish`：将容器端口映射到主机端口，格式为 `[宿主机IP:]宿主机端口:容器端口`
    - `[宿主机IP:]`：可选，默认值为 `0.0.0.0`，表示监听所有 IP 地址，`127.0.0.1` 表示仅监听本地回环地址，也可以指定具体的 IP 地址
  - `-v`、`--volume`：将宿主机目录挂载到容器目录
  - `-e`、`--env`：设置环境变量
  - `--name <容器名称>`：为容器指定一个名称
  - `-it`：进入交互模式，分配一个伪终端
  - `--rm`：容器退出后自动删除容器
  - `--restart <重启策略>`：容器退出后自动重启容器，可选值为 `always`（总是重启）、`unless-stopped`（除非手动停止，否则总是重启）等
  - `--network <网络名称>`：将容器连接到指定的网络，可以是已存在的网络，也可以是新创建的网络（默认值为 `bridge`）。默认存在的网络：
    - `bridge`：桥接网络，默认值
    - `host`：主机网络，容器直接使用主机的网络栈，容器的端口直接映射到宿主机的端口
    - `none`：无网络，容器没有网络接口
- 停止容器：`docker stop <容器ID>`、`docker container stop <容器ID>`
- 启动容器：`docker start <容器ID>`、`docker container start <容器ID>`
- 重启容器：`docker restart <容器ID>`、`docker container restart <容器ID>`
- 删除容器：`docker rm <容器ID>`、`docker container rm <容器ID>`、`docker container remove <容器ID>`
  - `-f`、`--force`：强制删除容器，即使容器还在运行中
- 查看 Docker 容器列表：`docker ps`
  - `-a`、`--all`：显示所有容器（包含已停止的）
  - `-q`、`--quiet`：只显示容器 ID
- 管理挂载卷：`docker volume`
  - `create`：创建一个新的挂载卷
  - `inspect`：显示挂载卷的详细信息
  - `ls`、`list`：列出所有挂载卷
  - `prune`：删除未使用的挂载卷
    - `-a`、`--all`：删除所有未使用的挂载卷
    - `-f`、`--force`：无需确认提示
  - `rm`、`remove`：删除指定的挂载卷
- 查看容器日志：`docker logs <容器ID>`、`docker container logs <容器ID>`
  - `-f`、`--follow`：实时查看日志，新日志会持续输出
  - `--tail <行数>`：仅显示最后几行日志，默认值为 `10`
- 管理容器网络：`docker network`
  - `create <网络名称>`：创建一个新的网络
  - `ls`、`list`：列出所有网络
  - `rm`、`remove <网络名称>`：删除指定的网络
- 获取容器详细信息：`docker inspect <容器ID>`，看不懂可以交给 AI 分析
- 容器内执行命令：`docker exec <容器ID> <命令>`，例如：
  - `docker exec -it <容器ID> ps -ef` 查看容器内进程
  - `docker exec -it <容器ID> /bin/sh` 进入容器的 Shell
  - `docker exec -it <容器ID> bash` 进入容器的 Bash shell
- 构建镜像：`docker build <路径>`、`docker image build <路径>`（例如 `docker build -t myimage .`）
  - `-t <镜像名称>`、`--tag <镜像名称>`：为镜像指定一个名称
  - `-f <Dockerfile路径>`、`--file <Dockerfile路径>`：指定 Dockerfile 路径，默认值为当前目录下的 Dockerfile
  - `--no-cache`：不使用缓存，强制重新构建镜像

## 实战部署

### 实战一：拉取与运行 Nginx 容器

```bash
docker pull nginx
docker run nginx # 前一条命令可省略，本地不存在会自动拉取镜像
docker ps # 查看运行中的容器
docker stop <容器ID> # 停止容器
```

### 实战二：映射端口，更多参数使用

```bash
docker run -d -p 80:80 nginx
```

### 实战三：挂载主机目录到容器目录

```bash
docker run -d -p 80:80 -v /website/html:/usr/share/nginx/html nginx

cd /website/html
echo '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>页面标题</title>
  </head>
  <body>
    <h1>我的第一个标题</h1>
    <p>我的第一个段落。</p>
  </body>
</html>
' > index.html
```

### 实战四：使用挂载卷存储数据

```bash
docker volume create nginx_html
docker run -d -p 80:80 -v nginx_html:/usr/share/nginx/html nginx

docker volume inspect nginx_html # 查看挂载卷详细信息，可以看到挂载卷的路径
cd /var/lib/docker/volumes/nginx_html/_data # 请查看真实的挂载卷路径，不同系统可能不同
ls # 可以看到 50x.html  index.html，挂载卷第一次使用且为空时，Docker 会将容器内对应目录的内容复制到该挂载卷中
rm index.html
echo '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>页面标题</title>
  </head>
  <body>
    <h1>我的第一个标题</h1>
    <p>我的第一个段落。</p>
  </body>
</html>
' > index.html
```

### 实战五：部署 MongoDB 容器

```bash
docker run -d \
--name my_mongodb \
-p 27017:27017 \
-e MONGO_INITDB_ROOT_USERNAME=tech \
-e MONGO_INITDB_ROOT_PASSWORD=shrimp \
mongo
```

然后可以本地用 Python 测试一下连接 MongoDB 是否成功，记得安装 `pymongo` 库

```python
from pymongo import MongoClient

# 替换为你的公网IP、端口号、用户名、密码
client = MongoClient("mongodb://tech:shrimp@111.229.91.250:27017/")

try:
    # 发送一个ping命令来测试连接
    client.admin.command("ping")
    print("✅ MongoDB连接成功!")
except Exception as e:
    print(f"❌ 连接失败: {e}")
finally:
    client.close()
```

### 实战六：调试容器

```bash
# alpine 是一个基于 Alpine Linux 的轻量级 Linux 发行版，这里我们用来调试容器
docker run -it --rm alpine # 进入交互模式，退出后容器会自动删除；可新开终端窗口查看效果
exit
docker ps
```

```bash
# 接实战五：查看容器内进程
docker ps
docker exec -it <容器ID> ps -ef  # 部分精简的容器可能不支持 -ef 参数，可改用 ps aux
```

```bash
docker run -d -p 80:80 nginx
docker exec -it <容器ID> /bin/sh # 进入容器的 Shell
cd /usr/share/nginx/html
ls # 可以看到 50x.html  index.html
vi index.html # 修改 index.html 文件，但会报错，因为容器内部没有 vi 工具
# 可以先 rm index.html ，然后用 echo 命令重写 index.html 文件，或者我们安装 vi
cat /etc/os-release # 查看容器的操作系统信息，此处我的容器系统为 Debian
apt update # 更新软件包索引
apt install vim # 安装 Vim 编辑器
vi index.html
```

### 实战七：容器子网与互联

```bash
# 创建一个网络
docker network create network1

# 这里我们没有映射端口
docker run -d \
--name my_mongodb \
-e MONGO_INITDB_ROOT_USERNAME=tech \
-e MONGO_INITDB_ROOT_PASSWORD=shrimp \
--network network1 \
mongo
```

```bash
# mongo-express 是一个管理 MongoDB 的 Web 客户端
docker run -d \
--name my_mongodb_express \
-p 8081:8081 \
-e ME_CONFIG_MONGODB_SERVER=my_mongodb \
-e ME_CONFIG_MONGODB_ADMINUSERNAME=tech \
-e ME_CONFIG_MONGODB_ADMINPASSWORD=shrimp \
--network network1 \
mongo-express
```

打开 `http://[你的公网IP]:8081/`，输入用户名 `admin`，密码 `pass`，可以看到 MongoDB Express 的页面。

```bash
docker exec -it my_mongodb_express /bin/sh
ping my_mongodb # 无需指定 IP 地址即可 ping 通，说明 Docker 子网内部有一个 DNS 机制，可以把容器名解析为 IP 地址
# 可以用 nslookup 命令查看 my_mongodb 的 ip 地址
nslookup my_mongodb
exit
```

### 实战八：host 网络模式

```bash
docker run -d --network host --name nginx_host nginx
# 本例中没有映射端口，而是用 host 网络模式，直接使用主机的端口 80 访问
# 打开 http://[你的公网IP]:80/ 可以看到 nginx 的欢迎页面

# 进入容器查看 ip 地址
docker exec -it nginx_host /bin/sh
apt update
apt install iproute2
ip a
exit
```

## 清理资源（谨慎操作）

- 停止所有运行中的容器：`docker stop $(docker ps -aq)`
- 删除所有容器（包括停止的）：`docker rm $(docker ps -aq)`
- 删除所有镜像：`docker rmi $(docker images -q)`
- 删除所有挂载卷：`docker volume prune`
- 删除所有网络：`docker network prune`
- 清理缓存和未使用的数据：`docker system prune -a --volumes`

一次性完成清理：

```bash
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi $(docker images -q)
docker system prune -a --volumes -f
```

## Docker Compose 常用命令

> 明白了 Docker 后，Docker Compose 就比较好理解了，它是 Docker 官方提供的一个工具，用于定义和运行多个容器的应用。

- `docker compose up`：启动服务，如果容器已存在且正在运行，则不会创建新的容器
  - `-d`：在后台运行服务
  - `-f <文件路径>`、`--file <文件路径>`：指定 yaml 文件路径，默认值为当前目录下的 docker-compose.yml
- `docker compose restart`：重启服务
- `docker compose stop`：停止服务
- `docker compose down`：停止并删除服务

## 一个 Docker 与 Docker Compose 转换的例子

### Docker 方式部署

```bash
# 创建一个网络
docker network create network1

# 启动一个 MongoDB 容器
docker run -d \
--name my_mongodb \
-e MONGO_INITDB_ROOT_USERNAME=name \
-e MONGO_INITDB_ROOT_PASSWORD=pass \
-v /my/datadir:/data/db \
--network network1 \
mongo

# 启动一个 MongoDB Express 容器
docker run -d \
--name my_mongodb_express \
-p 8081:8081 \
-e ME_CONFIG_MONGODB_SERVER=my_mongodb \
-e ME_CONFIG_MONGODB_ADMINUSERNAME=name \
-e ME_CONFIG_MONGODB_ADMINPASSWORD=pass \
--network network1 \
mongo-express
```

### Docker Compose 方式部署

首先在目录下创建一个 `docker-compose.yml` 文件，内容如下：

```yaml
services:
  my_mongodb:
    image: mongo
    environment:
      MONGO_INITDB_ROOT_USERNAME: name
      MONGO_INITDB_ROOT_PASSWORD: pass
    volumes:
      - /my/datadir:/data/db
  my_mongodb_express:
    image: mongo-express
    ports:
      - 8081:8081
    environment:
      ME_CONFIG_MONGODB_SERVER: my_mongodb
      ME_CONFIG_MONGODB_ADMINUSERNAME: name
      ME_CONFIG_MONGODB_ADMINPASSWORD: pass
    depends_on: # 确保被依赖的容器先启动，再启动该容器
      - my_mongodb
```

然后在该目录下执行 `docker compose up -d` 启动服务。

Docker Compose 会自动创建一个子网，容器之间可以通过服务名称进行通信。也可以指定子网，例如：

```yaml
services:
  my_mongodb:
    # ...
    networks:
      - network1
  my_mongodb_express:
    # ...
    networks:
      - network1
networks:
  network1:
    name: network1
    driver: bridge
```

## 参考

- [tech-shrimp/docker_installer](https://github.com/tech-shrimp/docker_installer)
- [40分钟的Docker实战攻略，一期视频精通Docker](https://www.bilibili.com/video/BV1THKyzBER6)
- [容器镜像监控](https://status.anye.xyz)
