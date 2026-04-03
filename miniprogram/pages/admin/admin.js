const app = getApp();
const apiBaseUrl = app.globalData.apiBaseUrl;

Page({
  data: {
    userInfo: null,
    stats: {
      productCount: 0,
      userCount: 0,
      orderCount: 0,
      todayPoints: 0
    }
  },

  onLoad() {
    this.checkAdmin();
    this.loadStats();
  },

  // 检查管理员权限
  checkAdmin() {
    const userInfo = app.getUserInfo();
    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'staff')) {
      wx.showModal({
        title: '权限不足',
        content: '您没有管理后台的访问权限',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/index/index' });
        }
      });
      return false;
    }
    this.setData({ userInfo });
    return true;
  },

  // 加载统计数据
  async loadStats() {
    try {
      // 获取商品数量
      const productsRes = await wx.request({
        url: `${apiBaseUrl}/products?limit=1`,
        method: 'GET'
      });
      
      // 获取用户数量
      const usersRes = await wx.request({
        url: `${apiBaseUrl}/users?limit=1`,
        method: 'GET'
      });
      
      // 获取订单数量
      const ordersRes = await wx.request({
        url: `${apiBaseUrl}/orders?limit=1`,
        method: 'GET'
      });

      this.setData({
        stats: {
          productCount: productsRes.data?.pagination?.total || 0,
          userCount: usersRes.data?.pagination?.total || 0,
          orderCount: ordersRes.data?.pagination?.total || 0,
          todayPoints: 0 // 实际应从后端获取
        }
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 跳转页面
  goToPage(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: page });
  },

  // 添加商品
  goToAddProduct() {
    wx.navigateTo({ url: '/pages/admin/product-edit' });
  },

  // 导出数据
  exportData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    });
  }
});
