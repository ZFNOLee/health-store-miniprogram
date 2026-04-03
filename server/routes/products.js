const express = require('express');

module.exports = (app) => {
  const router = express.Router();
  const getDb = () => app.get('db');

  // 获取商品列表
  router.get('/', (req, res) => {
    try {
      const db = getDb();
      const { category_id, status, keyword, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE 1=1
      `;
      
      // 检查 categories 表是否存在
      try {
        db.exec('SELECT 1 FROM categories LIMIT 1');
      } catch (e) {
        // 如果表不存在，使用简化查询
        query = `SELECT p.*, '' as category_name FROM products p WHERE 1=1`;
      }
      
      if (category_id) {
        query += ` AND p.category_id = ${parseInt(category_id)}`;
      }
      
      if (status) {
        query += ` AND p.status = '${status}'`;
      } else {
        query += " AND p.status = 'onsale'";
      }
      
      if (keyword) {
        query += ` AND (p.name LIKE '%${keyword}%' OR p.description LIKE '%${keyword}%')`;
      }
      
      query += ` ORDER BY p.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const result = db.exec(query);
      const products = result[0]?.values || [];
      
      // 获取总数
      const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
      const totalResult = db.exec(countQuery);
      const total = totalResult[0]?.values[0][0] || 0;
      
      // 转换为对象数组
      const columns = ['id', 'name', 'description', 'category_id', 'price', 'points_price', 'stock', 'status', 'images', 'created_at', 'updated_at', 'category_name'];
      const productsObj = products.map(row => {
        const product = {};
        columns.forEach((col, i) => product[col] = row[i]);
        return product;
      });
      
      res.json({
        success: true,
        data: productsObj,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 获取商品详情
  router.get('/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.exec(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ${req.params.id}
      `);
      
      if (!result[0] || result[0].values.length === 0) {
        return res.status(404).json({ success: false, message: '商品不存在' });
      }
      
      const columns = result[0].columns;
      const row = result[0].values[0];
      const product = {};
      columns.forEach((col, i) => product[col] = row[i]);
      
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 创建商品
  router.post('/', (req, res) => {
    try {
      const db = getDb();
      const { name, description, category_id, price, points_price, stock, status, images } = req.body;
      
      if (!name || !price) {
        return res.status(400).json({ success: false, message: '商品名称和价格必填' });
      }
      
      db.run(`
        INSERT INTO products (name, description, category_id, price, points_price, stock, status, images)
        VALUES ('${name}', '${description || ''}', ${category_id || 'NULL'}, ${price}, ${points_price || 0}, ${stock || 0}, '${status || 'draft'}', '${images || ''}')
      `);
      app.saveDb();
      
      const result = db.exec('SELECT last_insert_rowid()');
      const newId = result[0].values[0][0];
      
      const productResult = db.exec(`SELECT * FROM products WHERE id = ${newId}`);
      const columns = productResult[0].columns;
      const row = productResult[0].values[0];
      const product = {};
      columns.forEach((col, i) => product[col] = row[i]);
      
      res.json({ success: true, data: product, message: '商品创建成功' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 更新商品
  router.put('/:id', (req, res) => {
    try {
      const db = getDb();
      const { name, description, category_id, price, points_price, stock, status, images } = req.body;
      
      const fields = [];
      if (name) fields.push(`name = '${name}'`);
      if (description) fields.push(`description = '${description}'`);
      if (category_id) fields.push(`category_id = ${category_id}`);
      if (price) fields.push(`price = ${price}`);
      if (points_price !== undefined) fields.push(`points_price = ${points_price}`);
      if (stock !== undefined) fields.push(`stock = ${stock}`);
      if (status) fields.push(`status = '${status}'`);
      if (images !== undefined) fields.push(`images = '${images}'`);
      
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ${req.params.id}`);
      app.saveDb();
      
      const result = db.exec(`SELECT * FROM products WHERE id = ${req.params.id}`);
      const columns = result[0].columns;
      const row = result[0].values[0];
      const product = {};
      columns.forEach((col, i) => product[col] = row[i]);
      
      res.json({ success: true, data: product, message: '商品更新成功' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 上架商品
  router.post('/:id/onsale', (req, res) => {
    try {
      const db = getDb();
      db.run(`UPDATE products SET status = 'onsale', updated_at = CURRENT_TIMESTAMP WHERE id = ${req.params.id}`);
      app.saveDb();
      res.json({ success: true, message: '商品已上架' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 下架商品
  router.post('/:id/offsale', (req, res) => {
    try {
      const db = getDb();
      db.run(`UPDATE products SET status = 'offsale', updated_at = CURRENT_TIMESTAMP WHERE id = ${req.params.id}`);
      app.saveDb();
      res.json({ success: true, message: '商品已下架' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 删除商品
  router.delete('/:id', (req, res) => {
    try {
      const db = getDb();
      db.run(`DELETE FROM products WHERE id = ${req.params.id}`);
      app.saveDb();
      res.json({ success: true, message: '商品已删除' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 获取分类列表
  router.get('/categories', (req, res) => {
    try {
      const db = getDb();
      const result = db.exec('SELECT * FROM categories ORDER BY sort_order, id');
      
      if (!result[0]) {
        return res.json({ success: true, data: [] });
      }
      
      const columns = result[0].columns || [];
      const categories = (result[0].values || []).map(row => {
        const cat = {};
        columns.forEach((col, i) => cat[col] = row[i]);
        return cat;
      });
      
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
