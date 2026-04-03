const app = getApp();
const apiBaseUrl = app.globalData.apiBaseUrl;

Page({
  data: {
    userInfo: null,
    checkedIn: false,
    availablePoints: 0,
    totalPoints: 0,
    memberLevelName: '普通会员',
    hotProducts: [],
    isAdmin: false
  },

  onLoad() {
    this.loadUserInfo();
    this.loadHotProducts();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = app.getUserInfo();
    if (!userInfo) {
      return;
    }

    this.setData({ userInfo });

    // 获取积分余额
    try {
      const res = await wx.request({
        url: `${apiBaseUrl}/points/balance/${userInfo.id}`,
        method: 'GET'
      });

      if (res.data.success) {
        this.setData({
          availablePoints: res.data.data.availablePoints,
          totalPoints: res.data.data.totalPoints
        });
      }

      // 获取会员等级名称
      const levelConfig = app.globalData.memberLevels[userInfo.member_level];
      if (levelConfig) {
        this.setData({
          memberLevelName: `${levelConfig.icon} ${levelConfig.name}`
        });
      }

      // 检查是否是管理员
      this.setData({
        isAdmin: userInfo.role === 'admin' || userInfo.role === 'staff'
      });

    } catch (error) {
      console.error('获取积分信息失败:', error);
    }

    // 检查签到状态
    this.checkCheckinStatus();
  },

  // 检查签到状态
  async checkCheckinStatus() {
    try {
      const userInfo = app.getUserInfo();
      if (!userInfo) return;

      const res = await wx.request({
        url: `${apiBaseUrl}/points/checkin/status/${userInfo.id}`,
        method: 'GET'
      });

      if (res.data.success) {
        this.setData({ checkedIn: res.data.data.checkedIn });
      }
    } catch (error) {
      console.error('检查签到状态失败:', error);
    }
  },

  // 签到
  async doCheckin() {
    if (this.data.checkedIn) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }

    const userInfo = app.getUserInfo();
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const res = await wx.request({
        url: `${apiBaseUrl}/points/checkin`,
        method: 'POST',
        data: { user_id: userInfo.id }
      });

      if (res.data.success) {
        this.setData({ 
          checkedIn: true,
          availablePoints: res.data.data.newBalance
        });
        wx.showToast({ title: '签到成功 +10 积分', icon: 'success' });
      } else {
        wx.showToast({ title: res.data.message, icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: '签到失败', icon: 'none' });
    }
  },

  // 加载热门商品
  async loadHotProducts() {
    try {
      const res = await wx.request({
        url: `${apiBaseUrl}/products?limit=4`,
        method: 'GET'
      });

      if (res.data.success) {
        this.setData({ hotProducts: res.data.data });
      }
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  },

  // 跳转页面
  goToPage(e) {
    const page = e.currentTarget.dataset.page;
    wx.switchTab({ url: page });
  },

  // 查看商品详情
  viewProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/detail?id=${productId}`
    });
  }
});
