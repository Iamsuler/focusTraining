Page({
  data:{
    //页面数据初始化
    isResult: false
  },
  onLoad:function(options){
    //监听页面加载，页面初始化，options为页面跳转所带来的参数
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
  },
  formSubmit (event) {
    console.log(event)

    let object = event.detail.value;

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        if (!object[key]) {
          console.log(key)
          wx.showToast({
            title: '请认真填写全部问题',
            icon: 'none'
          })
          break;
        }
      }
    }
  }
})