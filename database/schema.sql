-- 大健康门店管理小程序数据库 Schema
-- 创建时间：2026-03-17

-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid VARCHAR(64) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    avatar VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK(role IN ('admin', 'staff', 'user')),
    member_level VARCHAR(20) DEFAULT 'normal' CHECK(member_level IN ('normal', 'silver', 'gold', 'diamond')),
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 会员等级配置表
CREATE TABLE member_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level_name VARCHAR(20) UNIQUE NOT NULL,
    min_points INTEGER DEFAULT 0,
    discount_rate DECIMAL(3,2) DEFAULT 1.0,
    benefits TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 积分流水表
CREATE TABLE points_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('earn', 'spend')),
    amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,
    description TEXT,
    balance_after INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 商品分类表
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- 商品表
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    points_price INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'onsale' CHECK(status IN ('onsale', 'offsale', 'draft')),
    images TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 订单表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    points_used INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 订单明细表
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    points_price INTEGER DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 签到记录表
CREATE TABLE checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    checkin_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, checkin_date)
);

-- 插入初始会员等级数据
INSERT INTO member_levels (level_name, min_points, discount_rate, benefits) VALUES
('normal', 0, 1.0, '基础会员权益'),
('silver', 1000, 0.95, '95 折 + 生日礼包'),
('gold', 5000, 0.90, '9 折 + 生日礼包 + 专属客服'),
('diamond', 10000, 0.85, '85 折 + 生日礼包 + 专属客服 + 免费体验');

-- 插入初始商品分类
INSERT INTO categories (name, parent_id, sort_order) VALUES
('保健食品', NULL, 1),
('健身器材', NULL, 2),
('健康服务', NULL, 3),
('维生素', 1, 1),
('蛋白粉', 1, 2),
('瑜伽用品', 2, 1),
('有氧器械', 2, 2);
