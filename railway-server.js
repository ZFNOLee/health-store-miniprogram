/**
 * Railway 统一服务器
 * 合并后端 API (端口 3000) + 前端静态文件服务
 * Railway 只需部署一个服务
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── 静态文件根目录（ Railway 上 __dirname 就是项目根目录） ──
const STATIC_ROOT = __dirname;

// ── 数据库路径 ──
const dbPath = path.join(__dirname, 'database/health-store.db');

// ── 初始化 SQL.js ──
let db;
let SQL;

// saveDb 定义为独立函数，与 app 无关，任何地方都可调用
function saveDb() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('数据库保存失败:', e.message);
  }
}

async function initDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('已加载现有数据库:', dbPath);
  } else {
    // 确保目录存在
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new SQL.Database();
    console.log('创建新数据库:', dbPath);
    // 初始化表结构（saveDb 已在上方定义，可以安全调用）
    initSchema();
  }

  // 挂载到 app 以便路由中使用（向后兼容）
  app.saveDb = saveDb;

  // 每 30 秒自动保存
  setInterval(saveDb, 30000);

  // 进程退出时保存
  process.on('SIGTERM', () => { saveDb(); process.exit(0); });
  process.on('SIGINT',  () => { saveDb(); process.exit(0); });

  app.set('db', db);
  app.set('sql', SQL);
}

// ── 初始化数据库 schema ──
function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      role TEXT DEFAULT 'user',
      member_level TEXT DEFAULT 'normal',
      total_points INTEGER DEFAULT 0,
      available_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // products 表：与 server/routes/products.js 保持一致
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      price REAL NOT NULL,
      points_price INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 100,
      status TEXT DEFAULT 'onsale',
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // orders 表：与 server/routes/orders.js 保持一致
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      points_used INTEGER DEFAULT 0,
      points_earned INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // order_items 表：与 server/routes/orders.js 保持一致
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      points_price INTEGER DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // points_records 表：与 server/routes/points.js 保持一致
  db.run(`
    CREATE TABLE IF NOT EXISTS points_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT,
      description TEXT,
      balance_after INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // member_levels 表：供积分等级查询
  db.run(`
    CREATE TABLE IF NOT EXISTS member_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_name TEXT NOT NULL,
      min_points INTEGER DEFAULT 0,
      discount REAL DEFAULT 1.0
    )
  `);

  // checkins 表：供每日签到使用
  db.run(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      checkin_date DATE NOT NULL,
      points_earned INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, checkin_date)
    )
  `);

  // categories 表
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // 插入测试数据
  insertTestData();

  // 保存初始化后的数据库（saveDb 是模块级函数，此时已可用）
  saveDb();
}

function insertTestData() {
  const existingUser = db.exec("SELECT id FROM users WHERE openid='admin_openid_001'");
  if (existingUser.length === 0 || existingUser[0].values.length === 0) {
    db.run(`INSERT OR IGNORE INTO users (openid, nickname, phone, role, member_level, total_points, available_points)
            VALUES ('admin_openid_001', '管理员', '13900000001', 'admin', 'diamond', 0, 0)`);
    db.run(`INSERT OR IGNORE INTO users (openid, nickname, phone, role, member_level, total_points, available_points)
            VALUES ('staff_openid_001', '店员', '13900000002', 'staff', 'normal', 0, 0)`);
    db.run(`INSERT OR IGNORE INTO users (openid, nickname, phone, role, member_level, total_points, available_points)
            VALUES ('test_openid_123', '测试用户', '13800138000', 'user', 'gold', 5500, 2000)`);
    console.log('✅ 测试账号已创建');
  }

  const existingProduct = db.exec("SELECT id FROM products LIMIT 1");
  if (existingProduct.length === 0 || existingProduct[0].values.length === 0) {
    // [name, description, price, points_price, stock]
    const products = [
      ['灵芝孢子粉', '增强免疫力，守护家人健康', 298, 30, 50],
      ['深海鱼油', '调节血脂，保护心脑血管', 168, 17, 80],
      ['燕窝胶原蛋白饮', '美容养颜，焕发青春活力', 358, 36, 30],
      ['铁皮石斛', '滋阴润肺，益胃生津', 198, 20, 60],
      ['西洋参含片', '补气养阴，清热生津', 128, 13, 100],
    ];
    products.forEach(p => {
      db.run(`INSERT INTO products (name, description, price, points_price, stock, status) VALUES (?, ?, ?, ?, ?, 'onsale')`,
        [p[0], p[1], p[2], p[3], p[4]]);
    });
    console.log('✅ 测试商品已创建');
  }

  // 插入会员等级配置
  const existingLevel = db.exec("SELECT id FROM member_levels LIMIT 1");
  if (existingLevel.length === 0 || existingLevel[0].values.length === 0) {
    db.run(`INSERT INTO member_levels (level_name, min_points, discount) VALUES ('normal', 0, 1.0)`);
    db.run(`INSERT INTO member_levels (level_name, min_points, discount) VALUES ('silver', 1000, 0.95)`);
    db.run(`INSERT INTO member_levels (level_name, min_points, discount) VALUES ('gold', 5000, 0.9)`);
    db.run(`INSERT INTO member_levels (level_name, min_points, discount) VALUES ('diamond', 10000, 0.85)`);
    console.log('✅ 会员等级配置已创建');
  }
}

// ── API 路由 ──
function setupRoutes() {
  // ── 全局中间件（必须在路由注册之前）──
  app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  const userRoutes    = require('./server/routes/users')(app);
  const productRoutes = require('./server/routes/products')(app);
  const pointsRoutes  = require('./server/routes/points')(app);
  const orderRoutes   = require('./server/routes/orders')(app);

  app.use('/api/users',    userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/points',   pointsRoutes);
  app.use('/api/orders',   orderRoutes);

  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'railway' });
  });

  // ── 静态文件服务（所有其他路径） ──
  app.use(express.static(STATIC_ROOT, {
    index: ['admin-page.html', 'index.html'],
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));

  // SPA fallback（未知路径返回 admin-page.html）
  app.get('*', (req, res) => {
    const indexPath = path.join(STATIC_ROOT, 'admin-page.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });

  // 错误处理
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  });
}

// ── 启动 ──
async function start() {
  await initDatabase();
  setupRoutes();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('🏥 大健康门店管理服务已启动 (Railway)');
    console.log(`📍 监听端口: ${PORT}`);
    console.log(`📊 数据库: ${dbPath}`);
    console.log(`🌐 静态文件: ${STATIC_ROOT}`);
    console.log(`⏰ 每 30 秒自动保存数据库`);
  });
}

start().catch(console.error);

module.exports = app;
