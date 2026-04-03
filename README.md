# 大健康门店管理小程序

一个完整的门店管理解决方案，包含用户管理、积分管理、商品管理三大核心模块。

## 📋 功能特性

### 1. 用户管理
- ✅ 权限管理（管理员/店员/普通用户）
- ✅ 会员等级系统（普通/银卡/金卡/钻石）
- ✅ 会员权益配置
- ✅ 微信登录集成

### 2. 积分管理
- ✅ 积分派发（消费/签到/活动）
- ✅ 积分消费（兑换商品/抵扣现金）
- ✅ 积分流水记录
- ✅ 自动等级升级

### 3. 商品管理
- ✅ 商品上架/下架
- ✅ 商品分类
- ✅ 库存管理
- ✅ 价格管理
- ✅ 积分兑换价

### 4. 订单管理
- ✅ 订单创建
- ✅ 订单状态跟踪
- ✅ 积分奖励发放
- ✅ 库存自动扣减

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0
- npm >= 8.0
- 微信开发者工具

### 方式一：Docker 部署（推荐）

```bash
# 进入项目目录
cd health-store-miniprogram

# 初始化数据库
docker-compose run --rm init-db

# 启动后端服务
docker-compose up -d

# 查看日志
docker-compose logs -f server
```

后端服务将运行在 `http://localhost:3000`

### 方式二：本地开发

```bash
# 进入服务器目录
cd server

# 安装依赖
npm install

# 初始化数据库
npm run init-db

# 启动服务
npm start
# 或开发模式
npm run dev
```

### 小程序配置

1. 打开微信开发者工具
2. 导入 `miniprogram/` 目录
3. 修改 `app.js` 中的 `apiBaseUrl` 为实际后端地址
4. 编译运行

## 📁 项目结构

```
health-store-miniprogram/
├── miniprogram/              # 小程序前端
│   ├── pages/
│   │   ├── index/           # 首页
│   │   ├── user/            # 个人中心
│   │   ├── points/          # 积分页面
│   │   ├── products/        # 商品列表
│   │   └── admin/           # 管理后台
│   ├── components/          # 公共组件
│   ├── utils/               # 工具函数
│   └── app.js               # 小程序入口
├── server/                   # 后端服务
│   ├── routes/              # API 路由
│   │   ├── users.js         # 用户管理
│   │   ├── products.js      # 商品管理
│   │   ├── points.js        # 积分管理
│   │   └── orders.js        # 订单管理
│   ├── models/              # 数据模型
│   ├── index.js             # 服务入口
│   └── package.json
├── database/
│   └── schema.sql           # 数据库结构
├── docker-compose.yml        # Docker 配置
└── README.md
```

## 🔌 API 接口

### 用户管理
- `POST /api/users/login` - 用户登录
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户信息
- `GET /api/users/levels` - 获取会员等级配置

### 商品管理
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情
- `POST /api/products` - 创建商品
- `PUT /api/products/:id` - 更新商品
- `POST /api/products/:id/onsale` - 上架商品
- `POST /api/products/:id/offsale` - 下架商品

### 积分管理
- `GET /api/points/balance/:userId` - 获取积分余额
- `GET /api/points/records/:userId` - 获取积分流水
- `POST /api/points/earn` - 派发积分
- `POST /api/points/spend` - 消费积分
- `POST /api/points/checkin` - 签到

### 订单管理
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id/status` - 更新订单状态

## 📊 数据库

使用 SQLite 轻量级数据库，默认存储在 `database/health-store.db`

### 主要数据表
- `users` - 用户表
- `member_levels` - 会员等级配置
- `points_records` - 积分流水
- `products` - 商品表
- `categories` - 商品分类
- `orders` - 订单表
- `order_items` - 订单明细
- `checkins` - 签到记录

## 🔐 默认测试账号

数据库初始化后会自动创建测试用户：
- OpenID: `test_openid_123`
- 角色：普通用户
- 会员等级：金卡
- 可用积分：2000

## 🛠️ 开发说明

### 添加新功能
1. 在 `server/routes/` 创建新的路由文件
2. 在 `server/index.js` 中注册路由
3. 在 `miniprogram/pages/` 创建对应页面
4. 更新数据库 schema（如需要）

### 部署到生产环境
1. 修改 `apiBaseUrl` 为生产环境地址
2. 配置 HTTPS
3. 配置域名白名单（微信小程序后台）
4. 使用 Docker 或 PM2 部署后端服务

## 📝 注意事项

1. **微信小程序配置**：需要在微信后台配置服务器域名
2. **登录对接**：示例使用测试 openid，生产环境需对接微信登录接口
3. **数据安全**：生产环境请添加 JWT 认证和权限验证
4. **数据库备份**：定期备份 `database/health-store.db`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
