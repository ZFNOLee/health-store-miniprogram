# 🚀 大健康门店管理小程序 - 本地部署完整指南

---

## 📋 目录

1. [环境要求](#环境要求)
2. [项目结构](#项目结构)
3. [快速启动](#快速启动)
4. [详细部署步骤](#详细部署步骤)
5. [访问方式](#访问方式)
6. [常见问题](#常见问题)
7. [手机访问](#手机访问)
8. [开机自启动](#开机自启动)

---

## 环境要求

### 必需软件

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| **Node.js** | v14.0 或更高 | 运行后端服务 |
| **Python 3** | v3.6 或更高 | HTTP 服务（可选） |
| **浏览器** | 最新版 Chrome/Edge | 访问测试页面 |

### 检查环境

```bash
# 检查 Node.js
node -v
# 应该显示：v14.x.x 或更高

# 检查 npm
npm -v
# 应该显示：6.x.x 或更高

# 检查 Python
python3 --version
# 应该显示：Python 3.x.x
```

---

## 项目结构

```
health-store-miniprogram/
├── server/                     # 后端服务
│   ├── index.js               # 主程序
│   ├── routes/                # API 路由
│   ├── scripts/               # 脚本
│   └── package.json           # 依赖配置
├── database/                   # 数据库
│   ├── schema.sql             # 数据库结构
│   └── health-store.db        # SQLite 数据库
├── miniprogram/               # 小程序前端
│   ├── pages/                 # 页面
│   └── app.js                 # 小程序入口
├── test-page.html             # 基础测试页
├── admin-page.html            # 管理后台
├── full-test.html             # 完整功能测试
├── test-login.html            # 登录测试页
├── start.sh                   # 启动脚本
└── README.md                  # 项目说明
```

---

## 快速启动（推荐）

### 方式一：一键启动脚本

```bash
# 进入项目目录
cd /home/admin/openclaw/workspace/health-store-miniprogram

# 运行启动脚本
bash start.sh
```

**启动后会自动运行：**
- ✅ 后端服务（端口 3000）
- ✅ HTTP 服务（端口 8080）

**访问地址：**
- 管理后台：http://localhost:8080/admin-page.html
- 完整测试：http://localhost:8080/full-test.html
- 基础测试：http://localhost:8080/test-page.html

---

## 详细部署步骤

### 步骤 1：安装依赖

```bash
# 进入后端目录
cd /home/admin/openclaw/workspace/health-store-miniprogram/server

# 安装 npm 依赖
npm install
```

**预计耗时：** 1-2 分钟  
**依赖大小：** 约 50MB

---

### 步骤 2：初始化数据库（首次部署）

```bash
# 进入后端目录
cd /home/admin/openclaw/workspace/health-store-miniprogram/server

# 运行数据库初始化脚本
node scripts/init-db.js
```

**成功后显示：**
```
✅ 数据库初始化完成！
📍 数据库路径：/home/admin/openclaw/workspace/health-store-miniprogram/database/health-store.db
📋 已创建的表：users, member_levels, points_records, categories, products, orders, order_items, checkins
📝 插入测试数据...
✅ 测试用户已创建
✅ 测试商品已创建
🎉 数据库初始化全部完成！
```

---

### 步骤 3：启动后端服务

```bash
# 方式 A：前台运行（可以看到日志）
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
node index.js

# 方式 B：后台运行（推荐）
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
nohup node index.js > /tmp/server.log 2>&1 &

# 方式 C：使用 PM2（生产环境推荐）
npm install -g pm2
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
pm2 start index.js --name health-store
```

**验证后端启动成功：**
```bash
curl http://localhost:3000/api/health
# 返回：{"status":"ok","timestamp":"..."}
```

---

### 步骤 4：启动 HTTP 服务

```bash
# 方式 A：使用 Python（推荐）
cd /home/admin/openclaw/workspace/health-store-miniprogram
python3 -m http.server 8080

# 方式 B：后台运行
cd /home/admin/openclaw/workspace/health-store-miniprogram
nohup python3 -m http.server 8080 > /tmp/http.log 2>&1 &

# 方式 C：使用 Node.js 的 http-server
npm install -g http-server
cd /home/admin/openclaw/workspace/health-store-miniprogram
http-server -p 8080
```

**验证 HTTP 服务启动成功：**
```bash
curl http://localhost:8080/test-page.html
# 返回 HTML 内容
```

---

## 访问方式

### 本地访问

| 页面 | 地址 | 用途 |
|------|------|------|
| 📊 **基础测试页** | http://localhost:8080/test-page.html | 签到、商品、积分 |
| 🛒 **完整功能测试** | http://localhost:8080/full-test.html | 购物车、下单、订单 |
| ⚙️ **管理后台** | http://localhost:8080/admin-page.html | 商品/用户/订单管理 |
| 🔐 **登录测试页** | http://localhost:8080/test-login.html | 测试登录功能 |

### 局域网访问（手机/其他设备）

**1. 获取本机 IP 地址**

```bash
# Linux
ip addr show | grep "inet "

# 或
hostname -I

# Windows
ipconfig

# Mac
ifconfig | grep "inet "
```

**假设获取到的 IP 是：192.168.1.100**

**2. 在手机浏览器访问：**

| 页面 | 地址 |
|------|------|
| 基础测试页 | http://192.168.1.100:8080/test-page.html |
| 完整功能测试 | http://192.168.1.100:8080/full-test.html |
| 管理后台 | http://192.168.1.100:8080/admin-page.html |

---

## 常见问题

### Q1: 端口被占用

**错误信息：** `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案：**
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改端口
# 编辑 server/index.js，修改 PORT 为其他值
```

---

### Q2: 数据库初始化失败

**错误信息：** `Error: ENOENT: no such file or directory`

**解决方案：**
```bash
# 创建数据库目录
mkdir -p /home/admin/openclaw/workspace/health-store-miniprogram/database

# 重新初始化
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
node scripts/init-db.js
```

---

### Q3: 后端服务无法启动

**检查步骤：**
```bash
# 1. 检查 Node.js 版本
node -v

# 2. 检查依赖是否安装
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
npm install

# 3. 查看详细错误
node index.js

# 4. 检查端口是否被占用
netstat -tlnp | grep 3000
```

---

### Q4: 页面无法访问

**检查步骤：**
```bash
# 1. 检查 HTTP 服务是否运行
curl http://localhost:8080/test-page.html

# 2. 检查后端服务是否运行
curl http://localhost:3000/api/health

# 3. 检查防火墙
# Linux
sudo ufw status

# 如果防火墙开启，添加规则
sudo ufw allow 3000
sudo ufw allow 8080
```

---

### Q5: 手机无法访问

**解决方案：**
```bash
# 1. 确保手机和电脑在同一 WiFi

# 2. 检查防火墙
sudo ufw allow 3000
sudo ufw allow 8080

# 3. 检查 IP 地址是否正确
hostname -I

# 4. 测试连接
# 在手机浏览器输入：http://电脑IP:8080/test-page.html
```

---

## 手机访问

### 方式一：局域网访问

**前提：** 手机和电脑连接同一 WiFi

**步骤：**
```
1. 获取电脑 IP 地址
   hostname -I
   # 例如：192.168.1.100

2. 在手机浏览器输入：
   http://192.168.1.100:8080/full-test.html

3. 添加到主屏幕（可选）
   - Safari: 分享 → 添加到主屏幕
   - Chrome: 菜单 → 添加到主屏幕
```

### 方式二：内网穿透（外网访问）

**使用 ngrok：**
```bash
# 安装 ngrok
npm install -g ngrok

# 启动内网穿透
ngrok http 8080

# 会生成一个公网地址
# 例如：https://abc123.ngrok.io
```

**使用 frp：**
```bash
# 需要有一台公网服务器
# 配置 frp 客户端
# 详细配置参考：https://github.com/fatedier/frp
```

---

## 开机自启动

### 方式一：Systemd 服务（Linux）

**1. 创建服务文件**

```bash
sudo nano /etc/systemd/system/health-store.service
```

**2. 添加以下内容**

```ini
[Unit]
Description=Health Store Mini Program
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/openclaw/workspace/health-store-miniprogram/server
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**3. 启用服务**

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable health-store

# 启动服务
sudo systemctl start health-store

# 查看状态
sudo systemctl status health-store
```

---

### 方式二：Crontab（简单方案）

```bash
# 编辑 crontab
crontab -e

# 添加开机启动任务
@reboot cd /home/admin/openclaw/workspace/health-store-miniprogram/server && nohup node index.js > /tmp/server.log 2>&1 &
@reboot cd /home/admin/openclaw/workspace/health-store-miniprogram && nohup python3 -m http.server 8080 > /tmp/http.log 2>&1 &
```

---

### 方式三：PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
pm2 start index.js --name health-store-api

# 配置开机自启动
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs health-store-api
```

---

## 性能优化

### 1. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /home/admin/openclaw/workspace/health-store-miniprogram;
        try_files $uri $uri/ =404;
    }
}
```

### 2. 启用 HTTPS

```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 数据库备份

```bash
# 创建备份脚本
cat > /home/admin/openclaw/workspace/health-store-miniprogram/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /home/admin/openclaw/workspace/health-store-miniprogram/database/health-store.db \
   /home/admin/openclaw/workspace/health-store-miniprogram/database/backup_${DATE}.db
echo "备份完成：backup_${DATE}.db"
EOF

chmod +x backup.sh

# 添加定时任务（每天凌晨 2 点）
crontab -e
0 2 * * * /home/admin/openclaw/workspace/health-store-miniprogram/backup.sh
```

---

## 监控和维护

### 查看日志

```bash
# 后端日志
tail -f /tmp/server.log

# HTTP 服务日志
tail -f /tmp/http.log

# PM2 日志
pm2 logs health-store-api
```

### 重启服务

```bash
# 手动重启
pkill -f "node index.js"
pkill -f "http.server"

# 重新启动
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
node index.js &

cd /home/admin/openclaw/workspace/health-store-miniprogram
python3 -m http.server 8080 &
```

### 检查运行状态

```bash
# 检查进程
ps aux | grep "node index.js"
ps aux | grep "http.server"

# 检查端口
netstat -tlnp | grep 3000
netstat -tlnp | grep 8080

# 健康检查
curl http://localhost:3000/api/health
```

---

## 部署检查清单

- [ ] Node.js 已安装（v14+）
- [ ] Python 3 已安装
- [ ] 依赖已安装（npm install）
- [ ] 数据库已初始化
- [ ] 后端服务已启动（端口 3000）
- [ ] HTTP 服务已启动（端口 8080）
- [ ] 防火墙已配置
- [ ] 本地访问测试通过
- [ ] 手机访问测试通过（如需要）
- [ ] 开机自启动已配置（如需要）

---

## 快速参考

### 启动命令

```bash
# 后端服务
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
node index.js

# HTTP 服务
cd /home/admin/openclaw/workspace/health-store-miniprogram
python3 -m http.server 8080
```

### 访问地址

```
本地访问：
- 管理后台：http://localhost:8080/admin-page.html
- 完整测试：http://localhost:8080/full-test.html
- 基础测试：http://localhost:8080/test-page.html

局域网访问：
- 管理后台：http://192.168.x.x:8080/admin-page.html
- 完整测试：http://192.168.x.x:8080/full-test.html
```

### 测试账号

| 角色 | OpenID | 权限 |
|------|--------|------|
| 管理员 | admin_openid_001 | 全部权限 |
| 店员 | staff_openid_001 | 部分权限 |
| 普通用户 | test_openid_123 | 基础权限 |

---

## 🎉 部署完成！

现在你的小程序已经在本地运行了！

**立即访问：**
- 📊 基础测试：http://localhost:8080/test-page.html
- 🛒 完整功能：http://localhost:8080/full-test.html
- ⚙️ 管理后台：http://localhost:8080/admin-page.html

**需要帮助？**
- 查看日志：`tail -f /tmp/server.log`
- 重启服务：`pkill -f "node index.js"` 然后重新启动
- 检查状态：`curl http://localhost:3000/api/health`
