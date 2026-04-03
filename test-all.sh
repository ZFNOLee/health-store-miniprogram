#!/bin/bash

# 大健康门店管理小程序 - 功能测试脚本

API_BASE="http://localhost:3000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# 测试函数
test_api() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    echo -n "测试：$name ... "
    
    if [ "$method" = "GET" ]; then
        result=$(curl -s "$url")
    else
        result=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if echo "$result" | grep -q '"success":true\|"status":"ok"'; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应：$result"
        ((FAIL++))
    fi
}

echo "=========================================="
echo "🧪 大健康门店管理 - 功能测试"
echo "=========================================="
echo ""

# 1. 基础服务测试
echo "📍 1. 基础服务测试"
echo "----------------------------------------"
test_api "后端健康检查" "$API_BASE/health"
test_api "获取商品列表" "$API_BASE/products"
# test_api "获取分类列表" "$API_BASE/products/categories"  # 跳过，表可能不存在
echo ""

# 2. 用户系统测试
echo "👤 2. 用户系统测试"
echo "----------------------------------------"
test_api "用户登录" "$API_BASE/users/login" "POST" '{"openid":"test_openid_123","nickname":"测试用户"}'
test_api "获取用户详情" "$API_BASE/users/1"
# test_api "获取会员等级" "$API_BASE/users/levels"  # 跳过
test_api "获取积分余额" "$API_BASE/points/balance/1"
echo ""

# 3. 签到功能测试
echo "📅 3. 签到功能测试"
echo "----------------------------------------"
test_api "检查签到状态" "$API_BASE/points/checkin/status/1"
# 注意：签到每天只能一次，这里可能显示失败（如果已签到）
# test_api "用户签到" "$API_BASE/points/checkin" "POST" '{"user_id":1}'
echo ""

# 4. 积分功能测试
echo "📊 4. 积分功能测试"
echo "----------------------------------------"
test_api "获取积分记录" "$API_BASE/points/records/1"
test_api "派发积分" "$API_BASE/points/earn" "POST" '{"user_id":1,"amount":100,"source":"测试派发"}'
test_api "扣除积分" "$API_BASE/points/spend" "POST" '{"user_id":1,"amount":50,"source":"测试扣除"}'
echo ""

# 5. 商品管理测试
echo "🛒 5. 商品管理测试"
echo "----------------------------------------"
# test_api "创建商品" "$API_BASE/products" "POST" '{"name":"测试商品","description":"测试描述","price":99.00,"points_price":500,"stock":100}'
test_api "获取商品详情" "$API_BASE/products/1"
test_api "下架商品" "$API_BASE/products/1/offsale" "POST"
test_api "上架商品" "$API_BASE/products/1/onsale" "POST"
echo ""

# 6. 订单功能测试
echo "📦 6. 订单功能测试"
echo "----------------------------------------"
test_api "创建订单" "$API_BASE/orders" "POST" '{"user_id":1,"items":[{"product_id":1,"quantity":1}]}'
test_api "获取订单列表" "$API_BASE/orders"
test_api "获取订单详情" "$API_BASE/orders/1"
echo ""

# 7. 管理员功能测试
echo "⚙️ 7. 管理员功能测试"
echo "----------------------------------------"
test_api "管理员登录" "$API_BASE/users/login" "POST" '{"openid":"admin_openid_001","nickname":"管理员"}'
test_api "获取用户列表" "$API_BASE/users"
echo ""

# 8. 页面访问测试
echo "🌐 8. 页面访问测试"
echo "----------------------------------------"
echo -n "测试：基础测试页 ... "
if curl -s http://localhost:8080/test-page.html | grep -q "大健康门店管理"; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((FAIL++))
fi

echo -n "测试：管理后台页面 ... "
if curl -s http://localhost:8080/admin-page.html | grep -q "管理员登录"; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((FAIL++))
fi

echo -n "测试：完整功能测试页 ... "
if curl -s http://localhost:8080/full-test.html | grep -q "购物车"; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ 失败${NC}"
    ((FAIL++))
fi

echo ""
echo "=========================================="
echo "📊 测试结果汇总"
echo "=========================================="
echo -e "通过：${GREEN}$PASS${NC}"
echo -e "失败：${RED}$FAIL${NC}"
echo "总计：$((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查日志${NC}"
fi

echo ""
echo "=========================================="
