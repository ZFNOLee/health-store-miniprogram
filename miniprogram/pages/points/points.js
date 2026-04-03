const app = getApp();
const apiBaseUrl = app.globalData.apiBaseUrl;

Page({
  data: {
    userInfo: null,
    availablePoints: 0,
    totalPoints: 0,
    memberLevelName: '',
    progressPercent: 0,
    nextLevelPoints: 0,
    records: [],
    filterType: 'all',
    page: 1,
    limit: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    const userInfo = app.getUserInfo();
    if (userInfo) {
      this.setData({ userInfo });
      this.loadPointsInfo();
      this.loadRecords();
    }
  },

  onShow() {
    this.loadPointsInfo();
  },

  // 加载积分信息
  async loadPointsInfo() {
    if (!this.data.userInfo) return;

    try {
      const res = await wx.request({
        url: `${apiBaseUrl}/points/balance/${this.data.userInfo.id}`,
        method: 'GET'
      });

      if (res.data.success) {
        const { availablePoints, totalPoints } = res.data.data;
        this.setData({ availablePoints, totalPoints });
        this.calculateLevelProgress(totalPoints);
      }

      this.loadRecords(true);
    } catch (error) {
      console.error('加载积分信息失败:', error);
    }
  },

  // 计算等级进度
  calculateLevelProgress(totalPoints) {
    const levels = [
      { name: '普通会员', min: 0 },
      { name: '银卡会员', min: 1000 },
      { name: '金卡会员', min: 5000 },
      { name: '钻石会员', min: 10000 }
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i].min) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1];
        break;
      }
    }

    const memberLevel = app.globalData.memberLevels[this.data.userInfo?.member_level];
    this.setData({
      memberLevelName: memberLevel ? `${memberLevel.icon} ${memberLevel.name}` : '普通会员',
      progressPercent: nextLevel 
        ? ((totalPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 
        : 100,
      nextLevelPoints: nextLevel ? nextLevel.min - totalPoints : 0
    });
  },

  // 加载积分记录
  async loadRecords(refresh = false) {
    if (this.data.loading || (!refresh && !this.data.hasMore)) return;

    this.setData({ loading: true });

    try {
      const { page, limit, filterType } = this.data;
      let url = `${apiBaseUrl}/points/records/${this.data.userInfo.id}?page=${page}&limit=${limit}`;
      
      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }

      const res = await wx.request({
        url: url,
        method: 'GET'
      });

      if (res.data.success) {
        const newRecords = res.data.data;
        const hasMore = newRecords.length === limit;

        this.setData({
          records: refresh ? newRecords : [...this.data.records, ...newRecords],
          hasMore,
          page: refresh ? 1 : page + 1,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载记录失败:', error);
      this.setData({ loading: false });
    }
  },

  // 设置筛选
  setFilter(e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({
      filterType,
      page: 1,
      records: []
    }, () => {
      this.loadRecords(true);
    });
  },

  // 加载更多
  loadMore() {
    this.loadRecords();
  },

  // 去签到
  goToSignin() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 去兑换
  goToExchange() {
    wx.switchTab({ url: '/pages/products/products' });
  }
});
