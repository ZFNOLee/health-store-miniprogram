const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');

// 初始化路由
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const pointsRoutes = require('./routes/points');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 数据库路径
const dbPath = path.join(__dirname, '../database/health-store.db');

// 初始化 SQL.js 并加载数据库
let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('📍 已加载现有数据库');
  } else {
    db = new SQL.Database();
    console.log('📍 创建新数据库');
  }
  
  // 保存数据库的辅助函数
  app.saveDb = function() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  };
  
  // 定期保存（每 30 秒）
  setInterval(() => {
    app.saveDb();
  }, 30000);
  
  // 将数据库实例挂载到 app
  app.set('db', db);
  app.set('sql', SQL);
}

// 启动服务器
async function startServer() {
  await initDatabase();
  
  // API 路由
  app.use('/api/users', userRoutes(app));
  app.use('/api/products', productRoutes(app));
  app.use('/api/points', pointsRoutes(app));
  app.use('/api/orders', orderRoutes(app));
  
  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // 错误处理
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  
  app.listen(PORT, () => {
    console.log(`🏥 大健康门店管理服务已启动`);
    console.log(`📍 监听端口：${PORT}`);
    console.log(`📊 数据库路径：${dbPath}`);
    console.log(`💾 数据库将每 30 秒自动保存`);
  });
}

startServer().catch(console.error);

module.exports = app;
