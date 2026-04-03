# 🚀 快速启动 - 大健康门店管理小程序

---

## ⚡ 一键启动

```bash
cd /home/admin/openclaw/workspace/health-store-miniprogram
bash start.sh
```

---

## 📱 访问地址

| 页面 | 地址 |
|------|------|
| 📊 **基础测试** | http://localhost:8080/test-page.html |
| 🛒 **完整功能** | http://localhost:8080/full-test.html |
| ⚙️ **管理后台** | http://localhost:8080/admin-page.html |
| 🔐 **登录测试** | http://localhost:8080/test-login.html |

---

## 🛑 停止服务

```bash
pkill -f 'node index.js'
pkill -f 'http.server'
```

---

## 📊 查看状态

```bash
# 查看进程
ps aux | grep -E "node index.js|http.server"

# 健康检查
curl http://localhost:3000/api/health

# 查看日志
tail -f /tmp/server.log
```

---

## 📝 测试账号

| 角色 | OpenID | 用途 |
|------|--------|------|
| 👑 管理员 | admin_openid_001 | 管理后台登录 |
| 👨‍💼 店员 | staff_openid_001 | 管理后台登录 |
| 👤 普通用户 | test_openid_001 | 用户端测试 |

---

## 🔧 故障排查

### 后端启动失败
```bash
cd server
npm install
node index.js
```

### 页面无法访问
```bash
# 检查服务
curl http://localhost:3000/api/health
curl http://localhost:8080/test-page.html
```

### 端口被占用
```bash
# 查找并杀死占用进程
lsof -i :3000
kill -9 <PID>
```

---

## 📖 详细文档

完整部署指南：`DEPLOY.md`

---

**🎉 启动成功！立即访问管理后台测试功能！**
