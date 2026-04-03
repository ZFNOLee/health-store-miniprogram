# 小程序二维码获取指南

## 📱 小程序码生成方式

小程序码（二维码）需要通过**微信官方后台**或**微信 API**生成，无法直接由代码生成。

## 方式一：微信小程序后台（推荐）

### 步骤：

1. **登录微信公众平台**
   - 访问：https://mp.weixin.qq.com
   - 使用管理员微信扫码登录

2. **进入小程序管理**
   - 选择你的小程序（或注册新小程序）

3. **生成小程序码**
   - 左侧菜单：**工具** → **生成小程序码**
   - 选择页面路径（如：`pages/index/index`）
   - 设置参数（可选）
   - 下载小程序码图片

4. **小程序码类型**
   - **小程序码**（圆形）：适用于扫描进入特定页面
   - **二维码**（方形）：适用于推广场景

## 方式二：通过 API 生成（开发用）

### 接口：`getUnlimitedQRCode`

```javascript
// 后端调用示例（Node.js）
const axios = require('axios');

async function getMiniProgramQRCode(page, scene) {
  // 1. 获取 access_token
  const tokenRes = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
  );
  const accessToken = tokenRes.data.access_token;

  // 2. 生成小程序码
  const qrRes = await axios.post(
    `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
    {
      scene: scene,      // 场景值（最多32字符）
      page: page,        // 页面路径
      width: 430,        // 二维码宽度
      auto_color: true,  // 自动配色
      is_hyaline: true   // 透明底色
    },
    { responseType: 'arraybuffer' }
  );

  // 3. 保存图片
  const fs = require('fs');
  fs.writeFileSync(`qrcode_${scene}.png`, qrRes.data);
  return `qrcode_${scene}.png`;
}

// 使用示例
getMiniProgramQRCode('pages/index/index', 'home');
```

### API 文档
- 官方文档：https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html
- 接口限制：每月 10 万次调用

## 方式三：开发版二维码（测试用）

### 在微信开发者工具中：

1. 打开微信开发者工具
2. 导入 `miniprogram/` 目录
3. 点击右上角 **预览** 按钮
4. 用手机微信扫码即可打开小程序

### 体验版二维码：

1. 开发者工具 → **上传** 代码
2. 登录微信后台 → **版本管理**
3. 将开发版设为**体验版**
4. 在 **成员管理** 中添加体验成员
5. 体验成员可在 **体验版二维码** 处扫码

## 📋 本项目小程序信息

| 项目 | 值 |
|------|-----|
| 小程序名称 | 大健康门店管理 |
| 首页路径 | `pages/index/index` |
| 商品页路径 | `pages/products/products` |
| 积分页路径 | `pages/points/points` |
| 用户页路径 | `pages/user/user` |
| 管理页路径 | `pages/admin/admin` |

## ⚠️ 注意事项

1. **需要小程序账号**：必须先注册微信小程序账号
2. **AppID 配置**：在 `project.config.json` 中填写你的 AppID
3. **服务器域名**：在微信后台配置后端 API 域名白名单
4. **审核发布**：正式版需要提交微信审核

## 🚀 快速测试（无需小程序账号）

如果只是演示/测试，可以：

1. **使用微信开发者工具的预览功能**
   - 生成临时二维码，有效期 2 小时
   
2. **转换为 H5 页面**
   - 使用 uni-app 或 Taro 框架可编译为 H5
   - 直接通过 URL 访问

3. **使用小程序模拟器**
   - 开发者工具自带模拟器
   - 可直接在电脑上测试所有功能

## 📞 需要帮助？

如果你需要：
- 协助注册小程序账号
- 配置 AppID 和项目文件
- 部署后端服务到公网
- 生成体验版二维码

请告诉我，我可以继续帮你完成！
