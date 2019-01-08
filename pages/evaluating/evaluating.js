//获取应用实例
const app = getApp();

Page({
  data:{
    //页面数据初始化
    isResult: false,
    startTime: 0,
    endTime: 0,
    questionList: [],
    paperId: null,
    // 结果
    rightQuestionCount: 0,
    errorQuestionCount: 0,
    allQustionCount: 0,
    userScore: 0,
    exceedRatio: 0,
    userType: ''
  },
  showToast (msg) {
    wx.showToast({
      title: msg,
      icon: 'none',
    })
  },
  getPaper () {
    app.http.get('/api/q_and_a/paper', {}, res => {
      if (res.code === 0) {
        let questions = res.data.questions
        let list = []
        questions.forEach(item => {
          let options = item.options
          let optionsList = []
          for (const key in options) {
            if (options.hasOwnProperty(key)) {
              optionsList.push({
                name: options[key],
                value: key
              })
            }
          }
          list.push({
            id: item.id,
            options: optionsList,
            title: item.title
          })
        })
        this.setData({
          questionList: list,
          paperId: res.data.id,
          startTime: new Date().getTime()
        })
      } else {
        this.showToast(res.message)
      }
    })
  },
  onLoad:function(options){
    //监听页面加载，页面初始化，options为页面跳转所带来的参数
    this.getPaper()
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
  submitPaper (answers) {
    let endTime = new Date().getTime()
    let useTime = (endTime - this.data.startTime) / 1000
    let params = {
      paper_id: this.data.paperId,
      all_use_time: Math.ceil(useTime),
      answers: JSON.stringify(answers)
    }
    app.http.post('/api/q_and_a/save_train', params, res => {
      if (res.code === 0) {
        let data = res.data
        this.setData({
          rightQuestionCount: data.right_count,
          errorQuestionCount: data.error_count,
          allQustionCount: data.questions_count,
          userScore: data.right_ratio * 100,
          exceedRatio: data.chaoguonv * 100,
          userType: '',
          isResult: true
        })
      } else {
        this.showToast(res.message)
      }
    })
  },
  formSubmit (event) {
    let object = event.detail.value;
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        if (!object[key]) {
          wx.showToast({
            title: '请认真填写全部问题',
            icon: 'none'
          })
          break;
        }
      }
    }
    this.submitPaper(object)
  }
})