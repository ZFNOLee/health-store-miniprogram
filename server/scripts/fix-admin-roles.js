/**
 * 修复管理员/店员角色脚本
 * 将 admin_openid_001 设为 admin，staff_openid_001 设为 staff
 * 如果账号不存在则自动创建
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/health-store.db');

async function fixRoles() {
  const SQL = await initSqlJs();

  if (!fs.existsSync(dbPath)) {
    console.error('❌ 数据库文件不存在，请先运行 init-db.js');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // 查看当前账号状态
  console.log('📋 当前用户表：');
  const all = db.exec("SELECT id, openid, nickname, role FROM users");
  if (all[0]) {
    all[0].values.forEach(r => console.log(`  id=${r[0]}  openid=${r[1]}  nickname=${r[2]}  role=${r[3]}`));
  } else {
    console.log('  (空)');
  }

  // 修复或插入 admin 账号
  const adminCheck = db.exec("SELECT id FROM users WHERE openid = 'admin_openid_001'");
  if (adminCheck[0] && adminCheck[0].values.length > 0) {
    db.run("UPDATE users SET role = 'admin', nickname = '管理员', updated_at = CURRENT_TIMESTAMP WHERE openid = 'admin_openid_001'");
    console.log('✅ 已将 admin_openid_001 角色更新为 admin');
  } else {
    db.run("INSERT INTO users (openid, nickname, role, member_level, total_points, available_points) VALUES ('admin_openid_001', '管理员', 'admin', 'diamond', 0, 0)");
    console.log('✅ 已创建管理员账号 admin_openid_001 (role=admin)');
  }

  // 修复或插入 staff 账号
  const staffCheck = db.exec("SELECT id FROM users WHERE openid = 'staff_openid_001'");
  if (staffCheck[0] && staffCheck[0].values.length > 0) {
    db.run("UPDATE users SET role = 'staff', nickname = '店员', updated_at = CURRENT_TIMESTAMP WHERE openid = 'staff_openid_001'");
    console.log('✅ 已将 staff_openid_001 角色更新为 staff');
  } else {
    db.run("INSERT INTO users (openid, nickname, role, member_level, total_points, available_points) VALUES ('staff_openid_001', '店员', 'staff', 'normal', 0, 0)");
    console.log('✅ 已创建店员账号 staff_openid_001 (role=staff)');
  }

  // 保存数据库
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  db.close();

  console.log('\n📋 修复后用户表：');
  const db2 = new SQL.Database(fs.readFileSync(dbPath));
  const verify = db2.exec("SELECT id, openid, nickname, role FROM users");
  if (verify[0]) {
    verify[0].values.forEach(r => console.log(`  id=${r[0]}  openid=${r[1]}  nickname=${r[2]}  role=${r[3]}`));
  }
  db2.close();

  console.log('\n🎉 角色修复完成！现在可以正常登录管理后台了。');
}

fixRoles().catch(console.error);
