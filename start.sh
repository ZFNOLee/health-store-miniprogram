#!/bin/bash

# 大健康门店管理小程序 - 快速启动脚本

echo "=========================================="
echo "🏥 大健康门店管理小程序 - 启动服务"
echo "=========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 Python3，请先安装 Python3"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 检查依赖
if [ ! -d "server/node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    cd server
    npm install
    cd ..
    echo "✅ 依赖安装完成"
    echo ""
fi

# 检查数据库
if [ ! -f "database/health-store.db" ]; then
    echo "📦 数据库不存在，正在初始化..."
    cd server
    node scripts/init-db.js
    cd ..
    echo "✅ 数据库初始化完成"
    echo ""
fi

# 停止旧进程
echo "🔄 清理旧进程..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "http.server" 2>/dev/null || true
sleep 1
echo "✅ 清理完成"
echo ""

# 启动后端服务
echo "🚀 启动后端服务（端口 3000）..."
cd server
nohup node index.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
cd ..
sleep 2

# 检查后端是否启动成功
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo "✅ 后端服务启动成功 (PID: $SERVER_PID)"
else
    echo "❌ 后端服务启动失败，请查看日志：/tmp/server.log"
    exit 1
fi

# 启动 HTTP 服务
echo "🚀 启动 HTTP 服务（端口 8080）..."
nohup python3 -m http.server 8080 > /tmp/http.log 2>&1 &
HTTP_PID=$!
sleep 2

# 检查 HTTP 服务是否启动成功
if curl -s http://localhost:8080/test-page.html | grep -q "大健康"; then
    echo "✅ HTTP 服务启动成功 (PID: $HTTP_PID)"
else
    echo "❌ HTTP 服务启动失败，请查看日志：/tmp/http.log"
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 服务启动完成！"
echo "=========================================="
echo ""
echo "📱 访问地址："
echo ""
echo "   📊 基础测试页：http://localhost:8080/test-page.html"
echo "   🛒 完整功能测试：http://localhost:8080/full-test.html"
echo "   ⚙️ 管理后台：http://localhost:8080/admin-page.html"
echo "   🔐 登录测试页：http://localhost:8080/test-login.html"
echo ""
echo "📊 服务状态："
echo "   后端服务：运行中 (PID: $SERVER_PID)"
echo "   HTTP 服务：运行中 (PID: $HTTP_PID)"
echo ""
echo "📝 日志文件："
echo "   后端日志：/tmp/server.log"
echo "   HTTP 日志：/tmp/http.log"
echo ""
echo "🛑 停止服务："
echo "   pkill -f 'node index.js'"
echo "   pkill -f 'http.server'"
echo ""
echo "=========================================="
echo ""

# 显示进程信息
ps aux | grep -E "node index.js|http.server" | grep -v grep
