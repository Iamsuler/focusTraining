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
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    curTabIndex: 1,
    canvasParams: {
      width: 240,
      height: 240,
      originX: 120,
      originY: 120,
      originR: 90,
      circleThinkness: 10,      //元环粗细
      acrossColor: "#ccc",      //底环颜色
      fillColor: "#5C9965",     //顶环颜色
      Begin: .5,//(0-1)        //起始位置
      FontSize: 44              //文字大小
    },
    times: 300,
    isCountDown: false,
    isAbandon: false,

    resultSuccess: false,
    resultFail: false,
    
    plainTime: 15,
    realTime: 15,
    fucosRemainMinite: 15,

    weekRemainTime: {
      days: '0',
      hour: '00',
      min: '00'
    },

    remainTimer: null,
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
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

    let lastDay = 6 - nowDayOfWeek,
        last = new Date(year, month, day + lastDay, 23, 59, 59);
    
    let remainTime = (last - now) / 1000,
        remainDays = Math.floor(remainTime / (24 * 60 * 60)),
        hour = Math.floor(remainTime % (24 * 60 * 60) / (60 * 60)),
        minute = Math.ceil(remainTime % (24 * 60 * 60) % (60 * 60) / 60);
    
    console.log(remainDays, hour, minute);

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
    this.drawCountDown(1, timeStr)
  },
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
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
  drawClock (endAngle, timeStr) {
    let context = wx.createCanvasContext('firstCanvas');

    // context.clearRect(0, 0, this.data.canvasParams.width, this.data.canvasParams.height);

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

    //圆珠
    // context.fillStyle = this.data.canvasParams.fillColor;
    // context.beginPath();
    // let d = this.calOffset(endAngle * 2 * Math.PI, originR);
    // console.log(d);
    // context.arc(originX + d.x, originY + d.y, ballR, 0, 2 * Math.PI, true);
    // context.fill();
    // let img=new Image();
    // img.src="/images/icon_pointer";

    context.drawImage('/images/icon_pointer.svg',0,0);

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
    let curX = event.touches[0].x, curY = event.touches[0].y;
    //计算弧度
    let rad = Math.atan2(this.data.canvasParams.originY - curY, curX - this.data.canvasParams.originX);

    // this.drawClock((Math.PI + rad) / (2 * Math.PI));
  },
  handleTouchMove (event) {
    let curX = event.touches[0].x, curY = event.touches[0].y;
    //计算弧度
    let rad = Math.atan2(this.data.canvasParams.originX - curX, curY - this.data.canvasParams.originY);

    let endAngle = (Math.PI + rad) / (2 * Math.PI);
    let timeStr = Math.floor(endAngle * 60);
    
    this.setData({
      plainTime: timeStr
    })
    
    timeStr = timeStr < 10 ? `0${timeStr}:00` : `${timeStr}:00`;
    console.log(endAngle)

    if (endAngle >= 1 || endAngle <= 0) {
      return false;
    }

    throttle(this.drawClock(endAngle, timeStr), 1000)
  },
  startCountDown () {

    let startTimes = this.data.plainTime * 60, PLAIN_TIME = startTimes, curAngle = 1;

    let realTime = 0;

    countDownTimer = setInterval( () => {
      let endAngle = --startTimes / PLAIN_TIME;

      let timeStr = this.formateTime(startTimes);

      let focusTime = this.data.plainTime - Math.ceil(startTimes / 60);

      if (focusTime !== realTime) {
        realTime = focusTime;

        console.log(realTime)
        this.setData({
          realTime: realTime
        })
      }

      this.animationDraw(curAngle, endAngle, timeStr);

      curAngle = endAngle;
      
      if (endAngle === 0) {
        clearInterval(countDownTimer)

        setTimeout(() => {
          this.trainingSuccess();
        }, 1000)
      }

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

    this.initCanvas();
  },
  animationDraw(curAngle, endAngle, timeStr) {
    let index = 0, stepAngle = (curAngle - endAngle) / 30;

    let subStartAngle = curAngle;

    let timer = setInterval(() => {
      let subEndAngle = subStartAngle - stepAngle;

      subEndAngle = subEndAngle <= 0 ? 0 : subEndAngle;
      index++;

      this.drawCountDown(subEndAngle, timeStr)

      subStartAngle = subEndAngle;

      if (index === 30) {
        clearInterval(timer);
      }


    }, 20)
  },
  handleAbandon (event) {
    let isAbandon = event.currentTarget.dataset.type === '1' ? true : false;
    this.setData({
      isAbandon: isAbandon
    })


    this.initCanvas();
  },
  confirmAbandon () {
    let timeStr = this.data.plainTime < 10 ? '0' + this.data.plainTime + ':00' : this.data.plainTime + ':00';

    clearInterval(countDownTimer)

    this.drawCountDown(1, timeStr)
    this.setData({
      isCountDown: false,
      resultFail: true
    })
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
    } else {

      clearInterval(this.data.remainTimer);
    }
  },
  drawWeekResult () {
    let result = [
      {
        data: '05-25',
        time: 3
      },
      {
        data: '05-26',
        time: 4
      },
      {
        data: '05-27',
        time: 0
      },
      {
        data: '05-28',
        time: 1
      },
      {
        data: '05-29',
        time: 3
      },
      {
        data: '05-30',
        time: 2
      },
      {
        data: '05-31',
        time: 6
      },
    ]

    // 最大值
    for (var i = 0, maxValue = Number.MIN_VALUE; i < 7; i++) {
      parseInt(result[i].time) > maxValue && (maxValue = result[i].time);
    }

    let ratioH = (80 / maxValue).toFixed(4);

    let ctx = wx.createCanvasContext('weekResult');


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font="11px Arial";

    for (let index = 0 ; index < 7; index++) {
      const item = result[index];
      let itemX = 16 + index * 47;


      ctx.fillStyle = '#d2d2d2';
      ctx.fillText(item.data, itemX, 120);

      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(itemX - 8, 25, 16, 80);

      ctx.fillStyle = '#65AD6F';
      let itemY = 105 - Math.ceil(item.time * ratioH);
      ctx.fillRect(itemX - 8, itemY, 16, Math.ceil(item.time * ratioH));

      ctx.fillStyle = '#d2d2d2';
      ctx.fillText(item.time, itemX, itemY - 10);
    }

    // ctx.fillStyle="#FF0000";
    // ctx.fillRect(0,0,150,75);

    ctx.draw()

  }
})