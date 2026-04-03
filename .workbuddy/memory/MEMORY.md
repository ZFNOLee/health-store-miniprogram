# 项目长期记忆 - 大健康门店管理小程序

## 项目信息
- **项目名称**：大健康门店管理小程序 v1.0
- **项目路径**：`C:\Users\zhoushulan\Desktop\health-store-miniprogram-v1.0\health-store-miniprogram`
- **技术栈**：Node.js + Express + sql.js (SQLite) + HTML/JS 前端

## 本地运行方式（已验证可用）

### 启动后端（端口 3000）
```powershell
cd server
node index.js
```

### 启动前端（端口 8080）
```powershell
# 在项目根目录运行
node serve-static.js
```

### 初始化/重置数据库
```powershell
cd server
node scripts/init-db.js
```

## 访问地址
- 管理后台：http://localhost:8080/admin-page.html
- 基础测试：http://localhost:8080/test-page.html
- 完整功能：http://localhost:8080/full-test.html
- 登录测试：http://localhost:8080/test-login.html
- 后端 API：http://localhost:3000/api/health

## 测试账号
| 角色 | OpenID |
|------|--------|
| 管理员 | admin_openid_001 |
| 店员 | staff_openid_001 |
| 普通用户 | test_openid_123 |

## 注意事项
- 系统未安装 Python，前端静态服务用项目根目录的 `serve-static.js` 代替
- 数据库文件：`database/health-store.db`（sql.js 格式，每30秒自动保存）
- Node.js v22.22.1，npm 10.9.4
