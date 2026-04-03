const app = getApp();
const apiBaseUrl = app.globalData.apiBaseUrl;

Page({
  data: {
    userInfo: null,
    availablePoints: 0,
    totalPoints: 0,
    memberLevelName: '',
    orderCount: 0,
    isAdmin: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = app.getUserInfo();
    if (!userInfo) {
      // 未登录，跳转到登录页
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    this.setData({ 
      userInfo,
      isAdmin: userInfo.role === 'admin' || userInfo.role === 'staff'
    });

    // 获取积分信息
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

      // 获取订单数量
      this.loadOrderCount();
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 加载订单数量
  async loadOrderCount() {
    try {
      const res = await wx.request({
        url: `${apiBaseUrl}/orders?user_id=${this.data.userInfo.id}&limit=1`,
        method: 'GET'
      });

      if (res.data.success) {
        this.setData({
          orderCount: res.data.pagination.total
        });
      }
    } catch (error) {
      console.error('加载订单数失败:', error);
    }
  },

  // 跳转页面
  goToPage(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: page });
  },

  // 联系客服
  contactUs() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },

  // 关于我们
  aboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '大健康门店管理小程序 v1.0\n\n为您提供优质的健康产品和服务，积分兑换更多优惠！',
      showCancel: false
    });
  }
});
