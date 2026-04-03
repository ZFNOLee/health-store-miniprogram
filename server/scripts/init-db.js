const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/health-store.db');
const schemaPath = path.join(__dirname, '../../database/schema.sql');

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 删除旧数据库（如果需要重置）
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  已删除旧数据库');
  }
  
  // 创建新数据库
  const db = new SQL.Database();
  
  // 读取并执行 schema
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.run(schema);
  
  console.log('✅ 数据库初始化完成！');
  console.log(`📍 数据库路径：${dbPath}`);
  
  // 验证表是否创建成功
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.length > 0) {
    console.log('📋 已创建的表:', tables[0].values.map(t => t[0]).join(', '));
  }
  
  // 插入测试数据
  console.log('\n📝 插入测试数据...');
  
  // 测试用户（管理员 / 店员 / 普通用户）
  db.run(`
    INSERT INTO users (openid, nickname, phone, role, member_level, total_points, available_points)
    VALUES ('admin_openid_001', '管理员', '13900000001', 'admin', 'diamond', 0, 0)
  `);
  db.run(`
    INSERT INTO users (openid, nickname, phone, role, member_level, total_points, available_points)
    VALUES ('staff_openid_001', '店员', '13900000002', 'staff', 'normal', 0, 0)
  `);
  db.run(`
    INSERT INTO users (openid, nickname, phone, role, member_level, total_points, available_points)
    VALUES ('test_openid_123', '测试用户', '13800138000', 'user', 'gold', 5500, 2000)
  `);
  console.log('✅ 测试用户已创建（管理员 + 店员 + 普通用户）');
  
  // 测试商品
  const testProducts = [
    ['复合维生素片', '每日必需的营养补充', 4, 99.00, 500, 100],
    ['乳清蛋白粉', '高蛋白低脂肪', 5, 299.00, 1500, 50],
    ['瑜伽垫', '防滑加厚瑜伽垫', 6, 89.00, 300, 200],
    ['哑铃套装', '可调节重量哑铃', 7, 199.00, 1000, 30],
    ['健康咨询服务', '专业营养师一对一咨询', 3, 199.00, 1000, 999]
  ];
  
  testProducts.forEach(p => {
    db.run(`
      INSERT INTO products (name, description, category_id, price, points_price, stock, status)
      VALUES ('${p[0]}', '${p[1]}', ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]}, 'onsale')
    `);
  });
  console.log('✅ 测试商品已创建');
  
  // 保存数据库
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  db.close();
  
  console.log('\n🎉 数据库初始化全部完成！');
  console.log(`💾 数据库已保存到：${dbPath}`);
}

initDatabase().catch(console.error);
