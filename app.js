//app.js
import http from './utils/http'
App({
  http: http,
  // 显示没有授权警告
  // showUserInfoWarning: function () {
  //   wx.showModal({
  //     title: '提示',
  //     content: '小程序需要获取用户信息，点击确认前往设置或退出小程序？',
  //     showCancel: false,
  //     success: res => {
  //       if (res.confirm) {
  //         wx.openSetting()
  //       }
  //     }
  //   })
  // },
  login: function (code, encryptedData, iv) {
    let data = {
      encryptedData: encryptedData,
      iv: iv,
      code: code
    }
    http.post('/api/login', data, res => {
      if (res.code === 0) {
        wx.setStorage({
          key: 'Authorization',
          data: res.data.api_token
        })
        // http.header.Authorization = 'Bearer ' + res.data.api_token
      } else {
        this.wxlogin()
      }
    })
  },
  wxlogin () {
    let that = this
    // 登录
    wx.login({
      success: res => {
        let code = res.code
        wx.getUserInfo({
          success: result => {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            this.login(code, result.encryptedData, result.iv)
            that.globalData.userInfo = result.userInfo
          },
          fail: () => {
            this.showUserInfoWarning()
          }
        })
      }
    })
  },
  onLaunch: function () {
    // 展示本地存储能力
    // var logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)
  },
  globalData: {
    userInfo: null,
    isAuthorization: true
  }
})