const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (app) => {
  const router = express.Router();
  const getDb = () => app.get('db');

  // 获取订单列表
  router.get('/', (req, res) => {
    try {
      const db = getDb();
      const { user_id, status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT o.*, u.nickname as user_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        WHERE 1=1
      `;
      
      if (user_id) {
        query += ` AND o.user_id = ${parseInt(user_id)}`;
      }
      
      if (status) {
        query += ` AND o.status = '${status}'`;
      }
      
      query += ` ORDER BY o.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const result = db.exec(query);
      const orders = result[0]?.values || [];
      
      // 转换为对象数组
      const orderColumns = ['id', 'order_no', 'user_id', 'total_amount', 'points_used', 'points_earned', 'status', 'created_at', 'updated_at', 'user_name'];
      const ordersObj = orders.map(row => {
        const order = {};
        orderColumns.forEach((col, i) => order[col] = row[i]);
        
        // 获取订单明细
        const itemsResult = db.exec(`
          SELECT oi.*, p.name as product_name 
          FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id 
          WHERE oi.order_id = ${order.id}
        `);
        
        const itemColumns = ['id', 'order_id', 'product_id', 'quantity', 'price', 'points_price', 'product_name'];
        order.items = (itemsResult[0]?.values || []).map(itemRow => {
          const item = {};
          itemColumns.forEach((col, i) => item[col] = itemRow[i]);
          return item;
        });
        
        return order;
      });
      
      // 获取总数
      let countQuery = `SELECT COUNT(*) FROM orders WHERE 1=1`;
      if (user_id) countQuery += ` AND user_id = ${parseInt(user_id)}`;
      if (status) countQuery += ` AND status = '${status}'`;
      
      const totalResult = db.exec(countQuery);
      const total = totalResult[0]?.values[0][0] || 0;
      
      res.json({
        success: true,
        data: ordersObj,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 获取订单详情
  router.get('/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.exec(`
        SELECT o.*, u.nickname as user_name, u.phone as user_phone
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        WHERE o.id = ${req.params.id}
      `);
      
      if (!result[0] || result[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }
      
      const columns = ['id', 'order_no', 'user_id', 'total_amount', 'points_used', 'points_earned', 'status', 'created_at', 'updated_at', 'user_name', 'user_phone'];
      const row = result[0].values[0];
      const order = {};
      columns.forEach((col, i) => order[col] = row[i]);
      
      // 获取订单明细
      const itemsResult = db.exec(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ${req.params.id}
      `);
      
      const itemColumns = ['id', 'order_id', 'product_id', 'quantity', 'price', 'points_price', 'product_name'];
      order.items = (itemsResult[0]?.values || []).map(itemRow => {
        const item = {};
        itemColumns.forEach((col, i) => item[col] = itemRow[i]);
        return item;
      });
      
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 创建订单
  router.post('/', (req, res) => {
    try {
      const db = getDb();
      const { user_id, items, points_used } = req.body;
      
      if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: '用户 ID 和商品列表必填' });
      }
      
      // 检查用户是否存在
      const userResult = db.exec(`SELECT * FROM users WHERE id = ${user_id}`);
      if (!userResult[0] || userResult[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      
      const user = {
        id: userResult[0].values[0][0],
        available_points: userResult[0].values[0][7]
      };
      
      // 检查积分是否足够
      if (points_used && points_used > user.available_points) {
        return res.status(400).json({ success: false, message: '积分余额不足' });
      }
      
      // 计算订单总额
      let totalAmount = 0;
      let pointsToEarn = 0;
      
      // 验证商品并计算总价
      items.forEach(item => {
        const productResult = db.exec(`SELECT * FROM products WHERE id = ${item.product_id}`);
        if (!productResult[0] || productResult[0].values.length === 0) {
          throw new Error(`商品 ${item.product_id} 不存在`);
        }
        
        const product = {
          id: productResult[0].values[0][0],
          name: productResult[0].values[0][1],
          stock: productResult[0].values[0][6],
          status: productResult[0].values[0][7],
          price: productResult[0].values[0][4]
        };
        
        if (product.stock < item.quantity) {
          throw new Error(`商品 ${product.name} 库存不足`);
        }
        if (product.status !== 'onsale') {
          throw new Error(`商品 ${product.name} 已下架`);
        }
        
        totalAmount += product.price * item.quantity;
        pointsToEarn += Math.floor(product.price);
      });
      
      // 减去使用的积分
      const finalAmount = totalAmount - (points_used || 0);
      
      // 生成订单号
      const orderNo = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
      
      // 创建订单
      db.run(`
        INSERT INTO orders (order_no, user_id, total_amount, points_used, points_earned, status)
        VALUES ('${orderNo}', ${user_id}, ${finalAmount}, ${points_used || 0}, ${pointsToEarn}, 'pending')
      `);
      
      const orderIdResult = db.exec('SELECT last_insert_rowid()');
      const orderId = orderIdResult[0].values[0][0];
      
      // 创建订单明细
      items.forEach(item => {
        const productResult = db.exec(`SELECT * FROM products WHERE id = ${item.product_id}`);
        const product = productResult[0].values[0];
        
        db.run(`
          INSERT INTO order_items (order_id, product_id, quantity, price, points_price)
          VALUES (${orderId}, ${item.product_id}, ${item.quantity}, ${product[4]}, ${product[5]})
        `);
        
        // 扣减库存
        db.run(`UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.product_id}`);
      });
      
      // 如果使用了积分，扣除积分
      if (points_used) {
        db.run(`UPDATE users SET available_points = available_points - ${points_used} WHERE id = ${user_id}`);
        
        // 获取更新后的余额
        const updatedUser = db.exec(`SELECT available_points FROM users WHERE id = ${user_id}`);
        const newBalance = updatedUser[0].values[0][0];
        
        // 记录积分流水
        db.run(`
          INSERT INTO points_records (user_id, type, amount, source, description, balance_after)
          VALUES (${user_id}, 'spend', ${points_used}, 'order', '订单消费积分', ${newBalance})
        `);
      }
      
      app.saveDb();
      
      res.json({ 
        success: true, 
        message: '订单创建成功',
        data: { 
          orderId, 
          orderNo,
          totalAmount: finalAmount,
          pointsToEarn
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 更新订单状态
  router.put('/:id/status', (req, res) => {
    try {
      const db = getDb();
      const { status } = req.body;
      const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: '无效的订单状态' });
      }
      
      const orderResult = db.exec(`SELECT * FROM orders WHERE id = ${req.params.id}`);
      if (!orderResult[0] || orderResult[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }
      
      const order = {
        id: orderResult[0].values[0][0],
        user_id: orderResult[0].values[0][2],
        points_earned: orderResult[0].values[0][5],
        points_used: orderResult[0].values[0][4],
        status: orderResult[0].values[0][6]
      };
      
      db.run(`UPDATE orders SET status = '${status}', updated_at = CURRENT_TIMESTAMP WHERE id = ${req.params.id}`);
      
      // 如果订单完成，发放积分
      if (status === 'completed' && order.status !== 'completed') {
        db.run(`
          UPDATE users 
          SET total_points = total_points + ${order.points_earned}, 
              available_points = available_points + ${order.points_earned}
          WHERE id = ${order.user_id}
        `);
        
        const user = db.exec(`SELECT available_points FROM users WHERE id = ${order.user_id}`);
        db.run(`
          INSERT INTO points_records (user_id, type, amount, source, description, balance_after)
          VALUES (${order.user_id}, 'earn', ${order.points_earned}, 'order', '订单完成奖励积分', ${user[0].values[0][0]})
        `);
      }
      
      // 如果订单取消，恢复库存
      if (status === 'cancelled' && order.status !== 'cancelled') {
        const itemsResult = db.exec(`SELECT * FROM order_items WHERE order_id = ${req.params.id}`);
        (itemsResult[0]?.values || []).forEach(item => {
          db.run(`UPDATE products SET stock = stock + ${item[3]} WHERE id = ${item[2]}`);
        });
        
        // 如果使用了积分，退还积分
        if (order.points_used > 0) {
          db.run(`UPDATE users SET available_points = available_points + ${order.points_used} WHERE id = ${order.user_id}`);
          
          const user = db.exec(`SELECT available_points FROM users WHERE id = ${order.user_id}`);
          db.run(`
            INSERT INTO points_records (user_id, type, amount, source, description, balance_after)
            VALUES (${order.user_id}, 'earn', ${order.points_used}, 'order_cancel', '订单取消退还积分', ${user[0].values[0][0]})
          `);
        }
      }
      
      app.saveDb();
      
      res.json({ success: true, message: `订单状态已更新为 ${status}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
