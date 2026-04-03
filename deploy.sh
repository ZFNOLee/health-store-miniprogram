#!/bin/bash

# 大健康门店管理小程序 - 一键部署脚本

echo "=========================================="
echo "🏥 大健康门店管理小程序 - 一键部署"
echo "=========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Node.js
echo "🔍 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js"
    echo "请先安装 Node.js (v14.0 或更高版本)"
    echo "下载地址：https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 Python3"
    echo "请安装 Python3 (v3.6 或更高版本)"
    exit 1
fi

NODE_VERSION=$(node -v)
PYTHON_VERSION=$(python3 --version)
echo "✅ Node.js: $NODE_VERSION"
echo "✅ Python3: $PYTHON_VERSION"
echo ""

# 安装依赖
echo "📦 安装依赖..."
cd server
if [ -d "node_modules" ]; then
    echo "检测到已有依赖，是否重新安装？"
    select yn in "是" "否"; do
        case $yn in
            是 ) npm install; break;;
            否 ) echo "跳过依赖安装"; break;;
        esac
    done
else
    npm install
fi
cd ..
echo "✅ 依赖安装完成"
echo ""

# 初始化数据库
echo "📊 初始化数据库..."
if [ -f "database/health-store.db" ]; then
    echo "⚠️ 检测到已有数据库"
    echo "选择操作："
    select yn in "保留现有数据库" "重新初始化（覆盖）"; do
        case $yn in
            "保留现有数据库" ) echo "保留数据库"; break;;
            "重新初始化（覆盖）" ) 
                cd server
                node scripts/init-db.js
                cd ..
                break;;
        esac
    done
else
    cd server
    node scripts/init-db.js
    cd ..
fi
echo "✅ 数据库准备完成"
echo ""

# 启动服务
echo "🚀 启动服务..."
echo ""

# 停止旧进程
pkill -f "node index.js" 2>/dev/null || true
pkill -f "http.server" 2>/dev/null || true
sleep 1

# 启动后端
echo "启动后端服务（端口 3000）..."
cd server
nohup node index.js > /tmp/health-server.log 2>&1 &
SERVER_PID=$!
cd ..
sleep 2

# 检查后端
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo "✅ 后端服务启动成功 (PID: $SERVER_PID)"
else
    echo "❌ 后端服务启动失败"
    echo "查看日志：tail -f /tmp/health-server.log"
    exit 1
fi

# 启动 HTTP
echo "启动 HTTP 服务（端口 8080）..."
nohup python3 -m http.server 8080 > /tmp/health-http.log 2>&1 &
HTTP_PID=$!
sleep 2

# 检查 HTTP
if curl -s http://localhost:8080/test-page.html | grep -q "大健康"; then
    echo "✅ HTTP 服务启动成功 (PID: $HTTP_PID)"
else
    echo "❌ HTTP 服务启动失败"
    echo "查看日志：tail -f /tmp/health-http.log"
    exit 1
fi

echo ""
echo "=========================================="
echo "🎉 部署完成！"
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
echo "   后端日志：tail -f /tmp/health-server.log"
echo "   HTTP 日志：tail -f /tmp/health-http.log"
echo ""
echo "🛑 停止服务："
echo "   pkill -f 'node index.js'"
echo "   pkill -f 'http.server'"
echo ""
echo "📖 帮助文档："
echo "   查看 README.md 获取更多信息"
echo "   查看 DEPLOY.md 获取详细部署指南"
echo ""
echo "=========================================="
echo ""

# 显示进程
ps aux | grep -E "node index.js|http.server" | grep -v grep

echo ""
echo "🎊 现在可以在浏览器中访问上述地址开始使用！"
