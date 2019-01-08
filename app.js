//app.js
import http from './utils/http'
App({
  http: http,
  // 显示没有授权警告
  showUserInfoWarning: function () {
    wx.showModal({
      title: '提示',
      content: '小程序需要获取用户信息，点击确认前往设置或退出小程序？',
      showCancel: false,
      success: res => {
        if (res.confirm) {
          wx.openSetting()
        }
      }
    })
  },
  login: function (code, encryptedData, iv) {
    let data = {
      encryptedData: encryptedData,
      iv: iv,
      code: code
    }
    http.post('/api/login', data, res => {
      if (res.code === 0) {
        http.header.Authorization = 'Bearer ' + res.data.api_token
      }
    })
  },
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        let code = res.code
        wx.getUserInfo({
          success: result => {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            this.login(code, result.encryptedData, result.iv)
          },
          fail: () => {
            this.showUserInfoWarning()
          }
        })
      }
    })
    
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null
  }
})