const app = getApp();
const apiBaseUrl = app.globalData.apiBaseUrl;

Page({
  data: {
    products: [],
    categories: [],
    currentCategory: 0,
    keyword: '',
    page: 1,
    limit: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadCategories();
    this.loadProducts();
  },

  // 加载分类
  async loadCategories() {
    try {
      const res = await wx.request({
        url: `${apiBaseUrl}/products/categories`,
        method: 'GET'
      });

      if (res.data.success) {
        this.setData({ categories: res.data.data });
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  // 加载商品
  async loadProducts(refresh = false) {
    if (this.data.loading || (!refresh && !this.data.hasMore)) return;

    this.setData({ loading: true });

    try {
      const { page, limit, currentCategory, keyword } = this.data;
      let url = `${apiBaseUrl}/products?page=${page}&limit=${limit}`;
      
      if (currentCategory !== 0) {
        url += `&category_id=${currentCategory}`;
      }
      
      if (keyword) {
        url += `&keyword=${keyword}`;
      }

      const res = await wx.request({
        url: url,
        method: 'GET'
      });

      if (res.data.success) {
        const newProducts = res.data.data;
        const hasMore = newProducts.length === limit;

        this.setData({
          products: refresh ? newProducts : [...this.data.products, ...newProducts],
          hasMore,
          page: refresh ? 1 : page + 1,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      this.setData({ loading: false });
    }
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    this.setData({
      currentCategory: categoryId,
      page: 1,
      products: []
    }, () => {
      this.loadProducts(true);
    });
  },

  // 搜索输入
  onSearch(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 搜索
  search() {
    this.setData({
      page: 1,
      products: []
    }, () => {
      this.loadProducts(true);
    });
  },

  // 加载更多
  loadMore() {
    this.loadProducts();
  },

  // 查看商品详情
  viewProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/detail?id=${productId}`
    });
  },

  // 购买
  buyProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/order?productId=${productId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadProducts(true);
    wx.stopPullDownRefresh();
  }
});
