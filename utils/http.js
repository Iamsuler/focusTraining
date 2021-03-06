const http = {
  baseUrl: 'https://zhuanzhu.test.xczhang.com',
  header: {
    'Authorization': null
  },
  get: function (path, data, callback) {
    let Authorization = wx.getStorageSync('Authorization') || null
    Authorization = Authorization ? 'Bearer ' + Authorization : null
    wx.showLoading({
      title: '加载中'
    })
    wx.request({
      url: this.baseUrl + path,
      method: 'GET',
      data: data,
      header: {
        'Authorization': Authorization
      },
      success (res) {
        wx.hideLoading()
        return typeof callback === 'function' && callback(res.data)
      },
      fail (res) {
        wx.hideLoading();
        wx.showModal({
          title: '网络错误',
          content: '网络出错',
          showCancel: false
        })
      }
    })
  },
  post: function (path, data, callback) {
    let Authorization = wx.getStorageSync('Authorization') || null
    Authorization = Authorization ? 'Bearer ' + Authorization : null
    wx.showLoading({
      title: '加载中'
    })
    wx.request({
      url: this.baseUrl + path,
      method: 'POST',
      data: data,
      header: {
        'Authorization': Authorization
      },
      success (res) {
        wx.hideLoading()
        return typeof callback === 'function' && callback(res.data)
      },
      fail () {
        wx.hideLoading();
        wx.showModal({
          title: '网络错误',
          content: '网络出错',
          showCancel: false
        })
      }
    })
  }
}

export default http