App({
  onLaunch() {
    // 初始化云开发环境（如果需要）
    // wx.cloud.init({ env: 'your-env-id' })
    
    // 检查登录状态
    this.checkLogin();
  },
  
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://localhost:3000/api',
    memberLevels: {
      normal: { name: '普通会员', icon: '🥉' },
      silver: { name: '银卡会员', icon: '🥈' },
      gold: { name: '金卡会员', icon: '🥇' },
      diamond: { name: '钻石会员', icon: '💎' }
    }
  },
  
  // 检查登录状态
  async checkLogin() {
    try {
      // 微信登录
      const { code } = await wx.login();
      
      // 这里应该调用后端接口换取 openid
      // 实际开发中需要后端对接微信接口
      const res = await wx.request({
        url: `${this.globalData.apiBaseUrl}/users/login`,
        method: 'POST',
        data: {
          openid: `test_openid_${Date.now()}`, // 测试用
          nickname: '微信用户'
        }
      });
      
      if (res.data.success) {
        this.globalData.userInfo = res.data.data;
        wx.setStorageSync('userInfo', res.data.data);
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
  },
  
  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo || wx.getStorageSync('userInfo');
  },
  
  // 更新用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  }
});
