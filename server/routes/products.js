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
      
      let query = `SELECT p.* FROM products p WHERE 1=1`;
      
      if (category_id) {
        query += ` AND p.category_id = ${parseInt(category_id)}`;
      }
      
      // 管理后台传 status=all 则不过滤，默认只看上架
      if (status && status !== 'all') {
        query += ` AND p.status = '${status}'`;
      } else if (!status) {
        query += ` AND p.status = 'onsale'`;
      }
      
      if (keyword) {
        query += ` AND (p.name LIKE '%${keyword}%' OR p.description LIKE '%${keyword}%')`;
      }
      
      query += ` ORDER BY p.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      const result = db.exec(query);
      const products = result[0]?.values || [];
      const cols = result[0]?.columns || [];
      
      // 使用真实列名映射，而非硬编码下标
      const productsObj = products.map(row => {
        const product = {};
        cols.forEach((col, i) => product[col] = row[i]);
        return product;
      });
      
      // 获取总数
      let countBase = `SELECT COUNT(*) FROM products WHERE 1=1`;
      if (category_id) countBase += ` AND category_id = ${parseInt(category_id)}`;
      if (status && status !== 'all') countBase += ` AND status = '${status}'`;
      else if (!status) countBase += ` AND status = 'onsale'`;
      if (keyword) countBase += ` AND (name LIKE '%${keyword}%' OR description LIKE '%${keyword}%')`;
      const totalResult = db.exec(countBase);
      const total = totalResult[0]?.values[0][0] || 0;
      
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
      const result = db.exec(`SELECT * FROM products WHERE id = ${parseInt(req.params.id)}`);
      
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
      
      db.run(
        `INSERT INTO products (name, description, category_id, price, points_price, stock, status, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description || '', category_id || null, parseFloat(price), parseInt(points_price) || 0, parseInt(stock) || 0, status || 'onsale', images || '']
      );
      app.saveDb();
      
      // 用 name 和创建时间查询刚插入的商品，避免 last_insert_rowid 类型问题
      const productResult = db.exec(
        `SELECT * FROM products WHERE name = ? ORDER BY id DESC LIMIT 1`,
        [name]
      );
      
      if (!productResult[0] || productResult[0].values.length === 0) {
        return res.json({ success: true, message: '商品创建成功', data: { name, price } });
      }
      
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
