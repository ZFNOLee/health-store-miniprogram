@echo off
chcp 65001 >nul
echo ==========================================
echo 🏥 大健康门店管理小程序 - Windows 部署
echo ==========================================
echo.

cd /d "%~dp0"

:: 检查 Node.js
echo 🔍 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到 Node.js
    echo 请先安装 Node.js (v14.0 或更高版本)
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到 Python
    echo 请安装 Python 3.6 或更高版本
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ Node.js: %NODE_VERSION%
echo ✅ Python: %PYTHON_VERSION%
echo.

:: 安装依赖
echo 📦 安装依赖...
cd server
if exist "node_modules" (
    echo 检测到已有依赖，是否重新安装？
    set /p reinstall="输入 Y 重新安装，其他键跳过："
    if /i "%reinstall%"=="Y" (
        call npm install
    ) else (
        echo 跳过依赖安装
    )
) else (
    call npm install
)
cd ..
echo ✅ 依赖安装完成
echo.

:: 初始化数据库
echo 📊 初始化数据库...
if exist "database\health-store.db" (
    echo ⚠️ 检测到已有数据库
    set /p reinit="输入 Y 重新初始化，其他键跳过："
    if /i "%reinit%"=="Y" (
        cd server
        node scripts\init-db.js
        cd ..
    )
) else (
    cd server
    node scripts\init-db.js
    cd ..
)
echo ✅ 数据库准备完成
echo.

:: 启动服务
echo 🚀 启动服务...
echo.

:: 停止旧进程
echo 停止旧进程...
taskkill /F /FI "WindowTitle eq *node index.js*" >nul 2>&1
taskkill /F /FI "WindowTitle eq *http.server*" >nul 2>&1
timeout /t 2 /nobreak >nul

:: 启动后端
echo 启动后端服务（端口 3000）...
cd server
start /B node index.js
cd ..
timeout /t 3 /nobreak >nul

:: 启动 HTTP
echo 启动 HTTP 服务（端口 8080）...
start /B python -m http.server 8080
timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo 🎉 部署完成！
echo ==========================================
echo.
echo 📱 访问地址：
echo.
echo    📊 基础测试页：http://localhost:8080/test-page.html
echo    🛒 完整功能测试：http://localhost:8080/full-test.html
echo    ⚙️ 管理后台：http://localhost:8080/admin-page.html
echo    🔐 登录测试页：http://localhost:8080/test-login.html
echo.
echo 🛑 停止服务：
echo    关闭所有 node.exe 和 python.exe 进程
echo.
echo 📖 帮助文档：
echo    查看 README.md 获取更多信息
echo.
echo ==========================================
echo.
echo 🎊 现在可以在浏览器中访问上述地址开始使用！
echo.
pause
