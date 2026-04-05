const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (app) => {
  const router = express.Router();
  const getDb = () => app.get('db');

  // 获取用户列表（管理员）
  router.get('/', (req, res) => {
    try {
      const db = getDb();
      const { role, member_level, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }
      
      if (member_level) {
        query += ' AND member_level = ?';
        params.push(member_level);
      }
      
      query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const users = db.exec(query)[0]?.values || [];
      const totalResult = db.exec('SELECT COUNT(*) as count FROM users');
      const total = totalResult[0]?.values[0][0] || 0;
      
      // 转换为对象数组
      const columns = ['id', 'openid', 'nickname', 'avatar', 'phone', 'role', 'member_level', 'total_points', 'available_points', 'created_at', 'updated_at'];
      const usersObj = users.map(row => {
        const user = {};
        columns.forEach((col, i) => user[col] = row[i]);
        return user;
      });
      
      res.json({
        success: true,
        data: usersObj,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 获取用户详情
  router.get('/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.exec(`SELECT * FROM users WHERE id = ${req.params.id}`);
      
      if (!result[0] || result[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const columns = result[0].columns;
      const row = result[0].values[0];
      const user = {};
      columns.forEach((col, i) => user[col] = row[i]);
      
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 通过 openid 获取或创建用户
  router.post('/login', (req, res) => {
    try {
      const db = getDb();
      const { openid, nickname, avatar, phone } = req.body;
      
      if (!openid) {
        return res.status(400).json({ success: false, message: 'openid 必填' });
      }
      
      // 检查用户是否存在
      let result = db.exec(`SELECT * FROM users WHERE openid = '${openid}'`);
      
      if (!result[0] || result[0].values.length === 0) {
        // 创建新用户
        db.run(`
          INSERT INTO users (openid, nickname, avatar, phone)
          VALUES ('${openid}', '${nickname || '新用户'}', '${avatar || ''}', '${phone || ''}')
        `);
        app.saveDb();
        
        result = db.exec(`SELECT * FROM users WHERE openid = '${openid}'`);
      } else {
        // 更新用户信息（保留 role / member_level / 已有 nickname，不覆盖）
        const existingUser = result[0].values[0];
        const existingNickname = existingUser[2]; // nickname
        const existingAvatar   = existingUser[3]; // avatar
        const existingPhone    = existingUser[4]; // phone
        const existingRole     = existingUser[5]; // role
        const existingLevel    = existingUser[6]; // member_level

        // 只有当传入值非空且与已有值不同时才更新 nickname/avatar/phone
        const newNickname = (nickname && nickname.trim() && nickname !== existingNickname)
          ? nickname.trim() : existingNickname;
        const newAvatar   = avatar  || existingAvatar;
        const newPhone    = phone   || existingPhone;

        db.run(`
          UPDATE users SET nickname = ?,
                           avatar = ?,
                           phone = ?,
                           role = ?,
                           member_level = ?,
                           updated_at = CURRENT_TIMESTAMP
          WHERE openid = ?
        `, [newNickname, newAvatar, newPhone, existingRole, existingLevel, openid]);
        app.saveDb();
        
        result = db.exec(`SELECT * FROM users WHERE openid = '${openid}'`);
      }
      
      const columns = result[0].columns;
      const row = result[0].values[0];
      const user = {};
      columns.forEach((col, i) => user[col] = row[i]);
      
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 获取会员等级配置
  router.get('/levels', (req, res) => {
    try {
      const db = getDb();
      const result = db.exec('SELECT * FROM member_levels ORDER BY min_points');
      
      if (!result[0]) {
        return res.json({ success: true, data: [] });
      }
      
      const columns = result[0].columns || [];
      const levels = (result[0].values || []).map(row => {
        const level = {};
        columns.forEach((col, i) => level[col] = row[i]);
        return level;
      });
      
      res.json({ success: true, data: levels });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 调整用户等级
  router.put('/:id/level', (req, res) => {
    try {
      const db = getDb();
      const { member_level } = req.body;
      const validLevels = ['normal', 'silver', 'gold', 'diamond'];
      if (!member_level || !validLevels.includes(member_level)) {
        return res.status(400).json({ success: false, message: '无效的会员等级' });
      }
      const result = db.exec(`SELECT id FROM users WHERE id = ${parseInt(req.params.id)}`);
      if (!result[0] || result[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      db.run(`UPDATE users SET member_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [member_level, parseInt(req.params.id)]);
      app.saveDb();
      res.json({ success: true, message: '会员等级已更新' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
