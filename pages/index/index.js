//index.js
//获取应用实例
const app = getApp();
const throttle = function(func, wait, options) {
  /* options的默认值
   *  表示首次调用返回值方法时，会马上调用func；否则仅会记录当前时刻，当第二次调用的时间间隔超过wait时，才调用func。
   *  options.leading = true;
   * 表示当调用方法时，未到达wait指定的时间间隔，则启动计时器延迟调用func函数，若后续在既未达到wait指定的时间间隔和func函数又未被调用的情况下调用返回值方法，则被调用请求将被丢弃。
   *  options.trailing = true; 
   * 注意：当options.trailing = false时，效果与上面的简单实现效果相同
   */
  let context, args, result;
  let timeout = null;
  let previous = 0;
  if (!options) options = {};
  let later = function() {
    previous = options.leading === false ? 0 : _.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    let now = _.now();
    if (!previous && options.leading === false) previous = now;
    // 计算剩余时间
    let remaining = wait - (now - previous);
    context = this;
    args = arguments;
    // 当到达wait指定的时间间隔，则调用func函数
    // 精彩之处：按理来说remaining <= 0已经足够证明已经到达wait的时间间隔，但这里还考虑到假如客户端修改了系统时间则马上执行func函数。
    if (remaining <= 0 || remaining > wait) {
      // 由于setTimeout存在最小时间精度问题，因此会存在到达wait的时间间隔，但之前设置的setTimeout操作还没被执行，因此为保险起见，这里先清理setTimeout操作
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      // options.trailing=true时，延时执行func函数
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};


let countDownTimer = null;

Page({
  data: {
    isNotAuthorization: false,
    userInfo: {},
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    curTabIndex: 1,
    canvasParams: {
      width: 240,
      height: 240,
      originX: 120,
      originY: 120,
      originR: 90,
      ballR: 10,
      circleThinkness: 5,      //元环粗细
      acrossColor: "#ccc",      //底环颜色
      fillColor: "#5C9965",     //顶环颜色
      FontSize: 44              //文字大小
    },
    times: 300,
    isCountDown: false,
    abandonBtnTxt: '放弃',
    abandonStep: 1,

    resultSuccess: false,
    resultFail: false,
    
    plainTime: 10,
    realTime: 0,
    startTimeStamp: 0,

    weekRemainTime: {
      days: '0',
      hour: '00',
      min: '00'
    },

    // 记录上一个rad 用以判断是否在第四象限
    lastTimeStr: .166667,

    remainTimer: null,
    // 记录指针位置
    ballRegion: {
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 0,
    },
    inRegion: false,
    // sort排行
    sortList: [],
    // 统计
    focusResultDay: {
      time: 0,
      successCount: 0
    },
    focusResultWeek: {
      time: 0,
      successCount: 0
    },
    weekCountRatio: {
      time6_11: 0,
      time12_17: 0,
      time18_23: 0,
      time0_5: 0
    },
    chartBarResult: [{
      date: '',
      count: 0
    }, {
      date: '',
      count: 0
    }, {
      date: '',
      count: 0
    }, {
      date: '',
      count: 0
    }, {
      date: '',
      count: 0
    }, {
      date: '',
      count: 0
    }, {
      date: '',
      count: 0
    }],
    taskId: null

  },
  onShareAppMessage () {
    return {
      title: '自定义转发标题哈哈',
      path: "pages/index/index"
    }
  },
  handleShare () {
    this.onShareAppMessage();
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.isNotAuthorization) {
      this.setData({
        isNotAuthorization: true
      })
    }
    // if (app.globalData.userInfo) {
    //   this.setData({
    //     userInfo: app.globalData.userInfo
    //   })
    // } else if (this.data.canIUse) {
    //   // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //   // 所以此处加入 callback 以防止这种情况
    //   app.userInfoReadyCallback = res => {
    //     this.setData({
    //       userInfo: res.userInfo
    //     })
    //   }
    // } else {
    //   // 在没有 open-type=getUserInfo 版本的兼容处理
    //   wx.getUserInfo({
    //     success: res => {
    //       app.globalData.userInfo = res.userInfo
    //       this.setData({
    //         userInfo: res.userInfo
    //       })
    //     }
    //   })
    // }
    if (countDownTimer !== null) {
      this.clearCanvas()
    }
    this.initCanvas();

    this.drawWeekResult();
  },
  countDownRemainTime () {
    let now = new Date(),
        year = now.getFullYear(),
        month = now.getMonth(),
        day = now.getDate(),
        nowDayOfWeek = now.getDay();

    let lastDay = 7 - nowDayOfWeek,
        last = new Date(year, month, day + lastDay, 23, 59, 59);
    
    let remainTime = (last - now) / 1000,
        remainDays = Math.floor(remainTime / (24 * 60 * 60)),
        hour = Math.floor(remainTime % (24 * 60 * 60) / (60 * 60)),
        minute = Math.ceil(remainTime % (24 * 60 * 60) % (60 * 60) / 60);

    hour = hour < 10 ? `0${hour}` : hour;
    minute = minute < 10 ? `0${minute}` : minute;
    
    this.setData({
      weekRemainTime: {
        days: remainDays,
        hour: hour,
        min: minute
      }
    })
  },
  initCanvas () {
    let startAngle = this.data.plainTime / 60;
    let timeStr = this.data.plainTime < 10 ? '0' + this.data.plainTime + ':00' : this.data.plainTime + ':00';

    this.drawClock(startAngle, timeStr);
    this.drawCountDown(1, timeStr);

    this.calRegion(startAngle);
  },
  calOffset (r, d) {
    return {
      x: Math.sin(r)*d, 
      y: -Math.cos(r)*d
    };
  },
  formateTime (s) {
    let minites = Math.floor(s / 60), seconds = Math.ceil(s % 60);

    minites = minites >= 10 ? minites : `0${minites}`;
    seconds = seconds >= 10 ? seconds : `0${seconds}`;
    return `${minites}:${seconds}`
  },
  calRegion (endAngle) {
    let x = Math.sin(endAngle * 2 * Math.PI) * this.data.canvasParams.originR, 
        y = -Math.cos(endAngle * 2 * Math.PI) * this.data.canvasParams.originR;

    let x0 = x - 20,
        x1 = x + 20,
        y0 = y - 20,
        y1 = y + 20;
    this.setData({
      ballRegion: {
        x0: x0,
        x1: x1,
        y0: y0,
        y1: y1
      }
    })
  },
  drawClock (endAngle, timeStr) {
    endAngle = endAngle <= .166667 ? .166667 : endAngle;
    let context = wx.createCanvasContext('firstCanvas');

    // context.clearRect(0, 0, this.data.canvasParams.width, this.data.canvasParams.height);

    //底环 
    context.strokeStyle = this.data.canvasParams.acrossColor;
    context.lineWidth = this.data.canvasParams.circleThinkness;
    context.beginPath();
    context.arc(this.data.canvasParams.originX, this.data.canvasParams.originY, this.data.canvasParams.originR, 0, 2 * Math.PI, true);
    context.stroke();

    context.translate(120,120);
    context.save();

    // 绘制刻度
    for (let index = 0; index < 12; index++) {
      context.beginPath();
      context.moveTo(0,90);
      context.lineTo(0,80);
      context.lineWidth = 2;
      // context.strokeStyle = "blue";
      context.stroke();
      context.rotate(Math.PI/6);

    }

    context.rotate(endAngle * 2 * Math.PI);
    context.drawImage('/images/icon_pointer.png',-120,-120, 240, 240);
    context.restore();

    context.translate(-120,-120);
    

    //有色环
    context.strokeStyle = this.data.canvasParams.fillColor;
    context.lineWidth = this.data.canvasParams.circleThinkness;
    context.beginPath();
    context.arc(this.data.canvasParams.originX, this.data.canvasParams.originY, this.data.canvasParams.originR, -.5 * Math.PI, (endAngle*2-0.5)*Math.PI, false);
    context.stroke();

    //中间文字
    context.fillStyle = this.data.canvasParams.fillColor;
    context.font = this.data.canvasParams.FontSize + "px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    //计算数值的取值区间
    context.fillText(timeStr, this.data.canvasParams.originX, this.data.canvasParams.originY);

    //圆珠
    // context.fillStyle = this.data.canvasParams.fillColor;
    // context.beginPath();
    // let d = this.calOffset(endAngle * 2 * Math.PI, this.data.canvasParams.originR);


    // context.arc(this.data.canvasParams.originX + d.x, this.data.canvasParams.originY + d.y, this.data.canvasParams.ballR, 0, 2 * Math.PI, true);
    // context.fill();
    // let img=new Image();
    // img.src="/images/icon_pointer";

    context.draw()
  },
  drawCountDown (endAngle, timeStr) {
    let context = wx.createCanvasContext('countDown')

    // context.clearRect(0, 0, this.data.canvasParams.width, this.data.canvasParams.height)

    //底环 
    context.strokeStyle = this.data.canvasParams.acrossColor;
    context.lineWidth = this.data.canvasParams.circleThinkness;
    context.beginPath();
    context.arc(this.data.canvasParams.originX, this.data.canvasParams.originY, this.data.canvasParams.originR, 0, 2 * Math.PI, true);
    context.stroke();

    //有色环
    context.strokeStyle = this.data.canvasParams.fillColor;
    context.lineWidth = this.data.canvasParams.circleThinkness;
    context.beginPath();
    context.arc(this.data.canvasParams.originX, this.data.canvasParams.originY, this.data.canvasParams.originR, -.5 * Math.PI, (endAngle*2-0.5)*Math.PI, false);
    context.stroke();

    //中间文字
    context.fillStyle = this.data.canvasParams.fillColor;
    context.font = this.data.canvasParams.FontSize + "px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    //计算数值的取值区间
    context.fillText(timeStr, this.data.canvasParams.originX, this.data.canvasParams.originY);

    context.draw()
  },
  handleTouchStart (event) {
    let curX = event.touches[0].x - this.data.canvasParams.originX, curY = event.touches[0].y - this.data.canvasParams.originY;

    //计算弧度
    // let rad = Math.atan2(this.data.canvasParams.originX - curX, curY - this.data.canvasParams.originY);
    let ballRegion = this.data.ballRegion;

    if (curX > ballRegion.x0 && curX < ballRegion.x1 && curY > ballRegion.y0 && curY < ballRegion.y1) {
      this.setData({
        inRegion: true
      })
    } else {
      this.setData({
        inRegion: false
      })
    }

  },
  handleTouchMove (event) {
    if (!this.data.inRegion) {
      return false;
    }
    let curX = event.touches[0].x, curY = event.touches[0].y;
    //计算弧度
    let rad = Math.atan2(this.data.canvasParams.originX - curX, curY - this.data.canvasParams.originY);

    let endAngle = (Math.PI + rad) / (2 * Math.PI);
    let timeStr = Math.floor(endAngle * 60);

    if (timeStr <= 10) {
      timeStr = 10

      if (this.data.lastTimeStr > 45) {
        timeStr = 60;
        endAngle = 1;
      }
    } else {
      let num1 = Math.floor(timeStr / 5), num2 = timeStr % 5;
      timeStr = num2 >= 3 ? (num1 + 1) * 5 : num1 * 5;
    }
    
    this.setData({
      plainTime: timeStr,
      lastTimeStr: timeStr
    })

    throttle(this.drawClock(endAngle, `${timeStr}:00`), 1000)
  },
  handleTouchEnd (event) {

    if (!this.data.inRegion) {
      return false;
    }

    let curX = event.changedTouches[0].x, curY = event.changedTouches[0].y;
    //计算弧度
    let rad = Math.atan2(this.data.canvasParams.originX - curX, curY - this.data.canvasParams.originY);

    let endAngle = (Math.PI + rad) / (2 * Math.PI);

    let timeStr = Math.floor(endAngle * 60);

    if (timeStr <= 10) {
      timeStr = 10
    } else {
      let num1 = Math.floor(timeStr / 5), num2 = timeStr % 5;
      timeStr = num2 >= 3 ? (num1 + 1) * 5 : num1 * 5;
    }


    endAngle = timeStr / 60;

    this.drawClock(endAngle, `${timeStr}:00`);

    this.drawCountDown(1, `${timeStr}:00`)

    this.calRegion(endAngle);
  },
  createCountDown () {
    let params = {
      wish_time: this.data.plainTime
    }
    app.http.post('/api/create_task', params, res => {
      if (res.code === 0) {
        this.setData({
          taskId: res.data.id
        })
        this.startCountDown()
      } else {
        this.showToast(res.message)
      }
    })
  },
  startCountDown () {
    let PLAIN_TIME = this.data.plainTime * 60;
    const endTimeStamp = new Date().getTime() + PLAIN_TIME * 1000
    this.setData({
      startTimeStamp: new Date().getTime()
    })

    // let realTime = 0;

    countDownTimer = setInterval( () => {
      let nowTimeStamp = new Date().getTime()
      let remainTime = Math.ceil((endTimeStamp - nowTimeStamp) / 1000)
      remainTime = remainTime > 0 ? remainTime : 0
      let endAngle = remainTime / PLAIN_TIME;

      let timeStr = this.formateTime(remainTime);

      // let focusTime = this.data.plainTime - Math.ceil(remainTime / 60);

      // if (focusTime !== realTime) {
      //   realTime = focusTime;

      //   this.setData({
      //     realTime: realTime
      //   })
      // }
      if (endAngle <= 0) {
        clearInterval(countDownTimer)
        this.updateTask(1)
      }

      this.drawCountDown(endAngle, timeStr)
      // this.animationDraw(curAngle, endAngle, timeStr);

      // curAngle = endAngle;

    }, 1000)

    this.setData({
      isCountDown: true
    });
  },
  trainingSuccess () {
    this.setData({
      resultSuccess: true,
      isCountDown: false,
    })
    this.setAbandonStep(1)
    this.initCanvas();
  },
  // animationDraw(curAngle, endAngle, timeStr) {
  //   let index = 0, stepAngle = (curAngle - endAngle) / 30;

  //   let subStartAngle = curAngle;

  //   let timer = setInterval(() => {
  //     let subEndAngle = subStartAngle - stepAngle;

  //     subEndAngle = subEndAngle <= 0 ? 0 : subEndAngle;
  //     index++;

  //     this.drawCountDown(subEndAngle, timeStr)

  //     subStartAngle = subEndAngle;

  //     if (index === 30) {
  //       clearInterval(timer);
  //     }


  //   }, 20)
  // },
  updateTask (status, type) {
    let taskId = this.data.taskId
    let params = {
      status: status
    }
    app.http.post(`/api/update_task/${taskId}`, params, res => {
      if (res.code === 0) {
        if (status === 1) {
          this.trainingSuccess()
        } else if (status === -1) {
          let resultFail = type !== 'hide'
          this.setData({
            isCountDown: false,
            resultFail: resultFail
          })
        }
      } else {
        this.showToast(res.message)
      }
    })
  },
  setAbandonStep (step) {
    let list = ['', '放弃', '二思', '三思', '确认放弃' ]
    this.setData({
      abandonStep: step,
      abandonBtnTxt: list[step]
    })
  },
  handleAbandon () {
    let abandonStep = this.data.abandonStep
    if (abandonStep === 4) {
      this.confirmAbandon()
    } else {
      this.setAbandonStep(abandonStep + 1)
    }
  },
  clearCanvas () {
    let timeStr = this.data.plainTime < 10 ? '0' + this.data.plainTime + ':00' : this.data.plainTime + ':00';
    clearInterval(countDownTimer)

    this.drawCountDown(1, timeStr)
    this.setAbandonStep(1)
  },
  confirmAbandon (type) {
    let nowTimeStamp = new Date().getTime()
    let realTime = Math.floor((nowTimeStamp - this.data.startTimeStamp) / 60000)
    this.setData({
      realTime: realTime
    })
    this.clearCanvas()
    this.updateTask(-1, type)
  },
  closeModal (event) {
    let type = event.currentTarget.dataset.type;
    if (type === 'success') {
      this.setData({
        resultSuccess: false
      })
    } else if (type === 'fail') {
      this.setData({
        resultFail: false
      })
    }
  },
  showToast (msg) {
    wx.showToast({
      title: msg,
      icon: 'none',
    })
  },
  getSort () {
    let params = {
      opr: 'get-weekday'
    }
    app.http.get('/api/sort', params, res => {
      let code = res.code
      if (code === 0) {
        let data = res.data.data
        let list = []
        data.forEach(item => {
          list.push({
            id: item.id,
            avatar: item.avatar,
            nickname: item.nickname,
            task_success_count: item.task_success_count,
            task_fail_count: item.task_fail_count,
            task_success_complete_time_sum: item.task_success_complete_time_sum || 0
          })
        })
        this.setData({
          sortList: list
        })
      } else {
        this.showToast(res.message)
      }
    })
  },
  getAllCount (opr = null) {
    let params = {
      opr: opr
    }
    app.http.get('/api/tongji/allCount', params, res => {
      let code = res.code
      if (code === 0) {
        let data = res.data
        if (opr === 'get-weekday') {
          let time = (data.task_success_complete_time_sum / 60).toFixed(1)
          this.setData({
            focusResultWeek: {
              time: time,
              successCount: data.task_success_count
            }
          })
        } else if (opr === 'get-today') {
          this.setData({
            focusResultDay: {
              successCount: data.task_success_count,
              time: data.task_success_complete_time_sum || 0
            }
          })
        }
      } else {
        this.showToast(res.message)
      }
    })
  },
  getTongjiByDay () {
    app.http.get('/api/tongji/byDay', {}, res => {
      if (res.code === 0) {
        let data = res.data.groupData
        let list = []
        data.forEach(item => {
          let date = item.group_data.split('-')
          list.push({
            date: `${date[1]}-${date[2]}`,
            count: item.task_count
          })
        })
        this.setData({
          chartBarResult: list
        })
        this.drawWeekResult()
      } else {
        this.showToast(res.message)
      }
    })
  },
  getTongjiByTime () {
    let params = {
      opr: 'get-weekday'
    }
    app.http.get('/api/tongji/byTime', params, res => {
      if (res.code === 0) {
        let times_group = res.data.times_group
        let obj = {}
        for (const key in times_group) {
          if (times_group.hasOwnProperty(key)) {
            const item = times_group[key];
            obj[key] = Math.round(item.ratio * 100)
          }
        }
        this.setData({
          weekCountRatio: obj
        })
      } else {
        this.showToast(res.message)
      }
    })
  },
  switchTab (event) {
    let index = event.currentTarget.dataset.index;

    this.setData({
      curTabIndex: index
    })

    if (index === '3') {
      this.countDownRemainTime()
      this.data.remainTimer = setInterval(() => {
        this.countDownRemainTime()
      }, 1000);
      this.getSort()
    } else {
      clearInterval(this.data.remainTimer);
      if (index === '2') {
        this.getAllCount('get-weekday')
        this.getAllCount('get-today')
        this.getTongjiByDay()
        this.getTongjiByTime()
      }
    }
  },
  drawWeekResult () {
    let result = this.data.chartBarResult
    let length = result.length

    // 最大值
    for (var i = 0, maxValue = 0; i < length; i++) {
      parseInt(result[i].count) > maxValue && (maxValue = result[i].count);
    }

    let ratioH = maxValue > 0 ? (80 / maxValue).toFixed(4) : 0

    let ctx = wx.createCanvasContext('weekResult');


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font="11px Arial";

    for (let index = 0 ; index < length; index++) {
      const item = result[index];
      let itemX = 16 + index * 47;


      ctx.fillStyle = '#d2d2d2';
      ctx.fillText(item.date, itemX, 120);

      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(itemX - 8, 25, 16, 80);

      ctx.fillStyle = '#65AD6F';
      let itemY = 105 - Math.ceil(item.count * ratioH);
      ctx.fillRect(itemX - 8, itemY, 16, Math.ceil(item.count * ratioH));

      ctx.fillStyle = '#d2d2d2';
      ctx.fillText(item.count, itemX, itemY - 10);
    }

    // ctx.fillStyle="#FF0000";
    // ctx.fillRect(0,0,150,75);

    ctx.draw()

  },
  // getUserInfo
  setUserStorage () {
    wx.setStorage({
      key: 'userInfo',
      value: JSON.stringify(this.data.userInfo)
    })
  },
  getUserInfo (e) {
    if (e.detail.userInfo) {
      //用户按了允许授权按钮
      app.wxlogin()
      this.setData({
        isNotAuthorization: false
      })
    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击了“返回授权”')
          }
        }
      })
    }
  },
  onShow () {
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
  },
  onHide () {
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
    // this.data.isCountDown && this.confirmAbandon('hide')
  },
  navigatorTo (event) {
    let url = event.currentTarget.dataset.url
    let _this = this
    if (this.data.isCountDown) {
      wx.showModal({
        title: '提示',
        content: '是否放弃正在进行的任务',
        success(res) {
          if (res.confirm) {
            _this.confirmAbandon('hide')
            wx.navigateTo({
              url: url
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    } else {
      wx.navigateTo({
        url: url
      })
    }
  }
})