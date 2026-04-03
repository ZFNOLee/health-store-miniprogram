const express = require('express');

module.exports = (app) => {
  const router = express.Router();
  const getDb = () => app.get('db');

  // 获取用户积分余额
  router.get('/balance/:userId', (req, res) => {
    try {
      const db = getDb();
      const result = db.exec(`SELECT id, available_points, total_points FROM users WHERE id = ${req.params.userId}`);
      
      if (!result[0] || result[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const row = result[0].values[0];
      res.json({
        success: true,
        data: {
          userId: row[0],
          availablePoints: row[1],
          totalPoints: row[2]
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 获取积分流水
  router.get('/records/:userId', (req, res) => {
    try {
      const db = getDb();
      const { type, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `SELECT * FROM points_records WHERE user_id = ${req.params.userId}`;
      
      if (type) {
        query += ` AND type = '${type}'`;
      }
      
      query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const result = db.exec(query);
      const records = result[0]?.values || [];
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM points_records WHERE user_id = ${req.params.userId}`;
      const totalResult = db.exec(countQuery);
      const total = totalResult[0]?.values[0][0] || 0;
      
      // 转换为对象数组
      const columns = ['id', 'user_id', 'type', 'amount', 'source', 'description', 'balance_after', 'created_at'];
      const recordsObj = records.map(row => {
        const record = {};
        columns.forEach((col, i) => record[col] = row[i]);
        return record;
      });
      
      res.json({
        success: true,
        data: recordsObj,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 派发积分
  router.post('/earn', (req, res) => {
    try {
      const db = getDb();
      const { user_id, amount, source, description } = req.body;
      
      if (!user_id || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: '用户 ID 和积分数量必填' });
      }
      
      // 检查用户是否存在
      const userResult = db.exec(`SELECT * FROM users WHERE id = ${user_id}`);
      if (!userResult[0] || userResult[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      // 更新用户积分
      db.run(`
        UPDATE users 
        SET total_points = total_points + ${amount}, 
            available_points = available_points + ${amount},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user_id}
      `);
      
      // 获取更新后的余额
      const updatedUser = db.exec(`SELECT available_points FROM users WHERE id = ${user_id}`);
      const newBalance = updatedUser[0].values[0][0];
      
      // 记录积分流水
      db.run(`
        INSERT INTO points_records (user_id, type, amount, source, description, balance_after)
        VALUES (${user_id}, 'earn', ${amount}, '${source || 'manual'}', '${description || ''}', ${newBalance})
      `);
      
      // 检查并更新会员等级
      const levelResult = db.exec(`
        SELECT level_name FROM member_levels 
        WHERE min_points <= (SELECT total_points FROM users WHERE id = ${user_id})
        ORDER BY min_points DESC LIMIT 1
      `);
      
      if (levelResult[0] && levelResult[0].values.length > 0) {
        const newLevel = levelResult[0].values[0][0];
        db.run(`UPDATE users SET member_level = '${newLevel}' WHERE id = ${user_id}`);
      }
      
      app.saveDb();
      
      res.json({ 
        success: true, 
        message: `成功派发 ${amount} 积分`,
        data: { userId: user_id, amount, newBalance }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 消费积分
  router.post('/spend', (req, res) => {
    try {
      const db = getDb();
      const { user_id, amount, source, description } = req.body;
      
      if (!user_id || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: '用户 ID 和积分数量必填' });
      }
      
      // 检查用户是否存在
      const userResult = db.exec(`SELECT * FROM users WHERE id = ${user_id}`);
      if (!userResult[0] || userResult[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const currentPoints = userResult[0].values[0][7]; // available_points
      
      if (currentPoints < amount) {
        return res.status(400).json({ success: false, message: '积分余额不足' });
      }
      
      // 更新用户积分
      db.run(`
        UPDATE users 
        SET available_points = available_points - ${amount},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user_id}
      `);
      
      // 获取更新后的余额
      const updatedUser = db.exec(`SELECT available_points FROM users WHERE id = ${user_id}`);
      const newBalance = updatedUser[0].values[0][0];
      
      // 记录积分流水
      db.run(`
        INSERT INTO points_records (user_id, type, amount, source, description, balance_after)
        VALUES (${user_id}, 'spend', ${amount}, '${source || 'manual'}', '${description || ''}', ${newBalance})
      `);
      
      app.saveDb();
      
      res.json({ 
        success: true, 
        message: `成功消费 ${amount} 积分`,
        data: { userId: user_id, amount, newBalance }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 签到获取积分
  router.post('/checkin', (req, res) => {
    try {
      const db = getDb();
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({ success: false, message: '用户 ID 必填' });
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // 检查是否已签到
      const existingCheckin = db.exec(`SELECT * FROM checkins WHERE user_id = ${user_id} AND checkin_date = '${today}'`);
      if (existingCheckin[0] && existingCheckin[0].values.length > 0) {
        return res.status(400).json({ success: false, message: '今日已签到' });
      }
      
      const pointsEarned = 10; // 签到奖励 10 积分
      
      // 插入签到记录
      db.run(`INSERT INTO checkins (user_id, checkin_date, points_earned) VALUES (${user_id}, '${today}', ${pointsEarned})`);
      
      // 更新用户积分
      db.run(`
        UPDATE users 
        SET total_points = total_points + ${pointsEarned}, 
            available_points = available_points + ${pointsEarned},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user_id}
      `);
      
      // 获取更新后的余额
      const updatedUser = db.exec(`SELECT available_points FROM users WHERE id = ${user_id}`);
      const newBalance = updatedUser[0].values[0][0];
      
      // 记录积分流水
      db.run(`
        INSERT INTO points_records (user_id, type, amount, source, description, balance_after)
        VALUES (${user_id}, 'earn', ${pointsEarned}, 'checkin', '每日签到', ${newBalance})
      `);
      
      app.saveDb();
      
      res.json({ 
        success: true, 
        message: '签到成功，获得 10 积分',
        data: { pointsEarned, newBalance }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 检查签到状态
  router.get('/checkin/status/:userId', (req, res) => {
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      const result = db.exec(`SELECT * FROM checkins WHERE user_id = ${req.params.userId} AND checkin_date = '${today}'`);
      
      res.json({
        success: true,
        data: {
          checkedIn: result[0] && result[0].values.length > 0,
          checkinDate: result[0]?.values[0]?.[2] || null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
