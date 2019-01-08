import http from "../../utils/http";

const app = getApp();

Page({
  data:{
    //页面数据初始化
    userInfo: null,
    focusCountToDay: 0,
    focusCountWeek: 0
    
  },
  getAllCount (opr = 'get-weekday') {
    let params = {
      opr: opr
    }
    app.http.get('/api/tongji/allCount', params, res => {
      let code = res.code
      if (code === 0) {
        let data = res.data
        if (opr === 'get-weekday') {
          this.setData({
            focusCountWeek: data.tasks_all_count
          })
        } else if (opr === 'get-today') {
          this.setData({
            focusCountToDay: data.tasks_all_count
          })
        }
      } else {
        this.showToast(res.message)
      }
    })
  },
  onLoad:function(options){
    //监听页面加载，页面初始化，options为页面跳转所带来的参数
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
    this.getAllCount('get-weekday')
    this.getAllCount('get-today')

  },
  onReady:function(){
    //监听页面渲染完成
  },
  onShow:function(){
    //监听页面显示
  },
  onHide:function(){
    //监听页面隐藏
  },
  onUnload:function(){
    //监听页面卸载
  }
})