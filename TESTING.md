# 🧪 大健康门店管理小程序 - 测试指南

## ✅ 后端服务状态

**服务已启动！**
- 📍 地址：`http://localhost:3000`
- 📊 API 前缀：`/api`
- 💾 数据库：已初始化并包含测试数据

---

## 🚀 测试步骤

### 方式一：微信开发者工具（推荐）

#### 第 1 步：下载微信开发者工具

访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

选择对应系统版本下载并安装。

#### 第 2 步：导入项目

1. 打开微信开发者工具
2. 选择 **导入项目**
3. 项目路径：
   ```
   /home/admin/openclaw/workspace/health-store-miniprogram/miniprogram
   ```
4. AppID：选择 **测试号** 或 **无 AppID**（仅体验）
5. 点击 **导入**

#### 第 3 步：配置后端地址

打开 `miniprogram/app.js`，确认 `apiBaseUrl`：
```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3000/api',
  // ...
}
```

⚠️ **注意**：如果后端在远程服务器，需要改为公网地址。

#### 第 4 步：编译运行

点击工具栏的 **编译** 按钮，即可在模拟器中查看小程序！

#### 第 5 步：手机预览

1. 点击右上角 **预览** 按钮
2. 用微信扫码
3. 在手机上体验小程序

---

### 方式二：API 测试（无需微信工具）

#### 测试用户登录

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "openid": "test_openid_123",
    "nickname": "测试用户"
  }'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "openid": "test_openid_123",
    "nickname": "测试用户",
    "member_level": "gold",
    "available_points": 2000,
    "total_points": 5500
  }
}
```

#### 测试获取商品列表

```bash
curl http://localhost:3000/api/products
```

#### 测试获取积分余额

```bash
curl http://localhost:3000/api/points/balance/1
```

#### 测试签到

```bash
curl -X POST http://localhost:3000/api/points/checkin \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

---

## 📋 测试数据

### 测试用户

| 字段 | 值 |
|------|-----|
| ID | 1 |
| OpenID | test_openid_123 |
| 昵称 | 测试用户 |
| 手机号 | 13800138000 |
| 角色 | user |
| 会员等级 | gold（金卡） |
| 可用积分 | 2000 |
| 累计积分 | 5500 |

### 测试商品

| ID | 名称 | 价格 | 积分价 | 库存 |
|----|------|------|--------|------|
| 1 | 复合维生素片 | ¥99 | 500 积分 | 100 |
| 2 | 乳清蛋白粉 | ¥299 | 1500 积分 | 50 |
| 3 | 瑜伽垫 | ¥89 | 300 积分 | 200 |
| 4 | 哑铃套装 | ¥199 | 1000 积分 | 30 |
| 5 | 健康咨询服务 | ¥199 | 1000 积分 | 999 |

### 会员等级

| 等级 | 所需积分 | 折扣 | 权益 |
|------|----------|------|------|
| 普通会员 | 0 | 100% | 基础权益 |
| 银卡会员 | 1000 | 95% | 95 折 + 生日礼包 |
| 金卡会员 | 5000 | 90% | 9 折 + 生日礼包 + 专属客服 |
| 钻石会员 | 10000 | 85% | 85 折 + 全部权益 |

---

## 🎯 功能测试清单

### 首页功能
- [ ] 签到功能（每日 +10 积分）
- [ ] 会员等级显示
- [ ] 积分余额显示
- [ ] 热门商品展示
- [ ] 快捷入口跳转

### 商品功能
- [ ] 商品列表浏览
- [ ] 分类筛选
- [ ] 商品搜索
- [ ] 加载更多

### 积分功能
- [ ] 积分余额查询
- [ ] 积分明细查看
- [ ] 签到得积分
- [ ] 积分筛选（获得/消耗）

### 个人中心
- [ ] 用户信息显示
- [ ] 会员等级显示
- [ ] 统计数据展示
- [ ] 功能菜单跳转

### 管理后台（需要管理员权限）
- [ ] 商品管理
- [ ] 用户管理
- [ ] 订单管理
- [ ] 积分管理

---

## ⚠️ 常见问题

### Q1: 开发者工具提示"不在以下合法域名列表中"

**解决方案**：
1. 开发者工具 → 右上角 **详情**
2. **本地设置** → 勾选：
   - ✅ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
   - ✅ 开启调试模式

### Q2: 后端连接失败

**检查步骤**：
```bash
# 1. 检查服务是否运行
curl http://localhost:3000/api/health

# 2. 检查端口是否占用
netstat -tlnp | grep 3000

# 3. 查看后端日志
# 如果使用后台运行，查看输出日志
```

### Q3: 数据库修改后不生效

**解决方案**：
```bash
# 重启后端服务
cd /home/admin/openclaw/workspace/health-store-miniprogram/server
# 先停止现有服务，然后重新启动
node index.js
```

### Q4: 小程序数据不显示

**可能原因**：
- 后端服务未启动
- API 地址配置错误
- 网络请求被拦截

**解决方案**：
1. 检查 `app.js` 中的 `apiBaseUrl`
2. 开启开发者工具的调试模式
3. 查看控制台是否有报错

---

## 🔧 开发调试技巧

### 查看后端日志

服务运行时，所有请求都会输出到控制台：
```
GET /api/products 200 - 15.234 ms
POST /api/points/checkin 200 - 8.123 ms
```

### 小程序调试

1. 开发者工具 → **调试器** → **Console**
2. 查看网络请求：**Network** 标签
3. 查看 Storage：**Storage** 标签

### 数据库查看

使用 SQLite 工具打开：
```
/home/admin/openclaw/workspace/health-store-miniprogram/database/health-store.db
```

推荐工具：
- DB Browser for SQLite（跨平台）
- SQLiteStudio（跨平台）
- Navicat for SQLite

---

## 📱 手机真机测试

### 前提条件
- 手机和电脑在同一局域网
- 或后端服务部署到公网

### 步骤

1. 获取电脑局域网 IP：
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. 修改 `app.js`：
   ```javascript
   apiBaseUrl: 'http://192.168.x.x:3000/api'
   ```

3. 在开发者工具中点击 **预览**
4. 手机微信扫码

---

## 🎉 测试完成！

如果所有功能都正常工作，恭喜你！小程序已经可以使用了。

下一步：
1. 注册微信小程序账号
2. 配置正式 AppID
3. 部署后端到服务器
4. 提交审核发布

---

## 📞 需要帮助？

遇到问题可以：
- 查看后端日志
- 查看小程序控制台报错
- 检查网络连接
- 重启服务再试
