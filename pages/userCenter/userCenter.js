const app = getApp();

Page({
  data:{
    //页面数据初始化
    userInfo: null,
    focusCount: 0,
    focusTime: 0
    
  },
  getAllCount (opr = null) {
    let params = {
      opr: opr
    }
    app.http.get('/api/tongji/allCount', params, res => {
      let code = res.code
      if (code === 0) {
        let data = res.data
        let time = (data.task_all_complete_time_sum / 60).toFixed(1)
        this.setData({
          focusCount: data.task_success_count || 0,
          focusTime: time
        })
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
    this.getAllCount()

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