const App = new Vue({
  el: '#app',
  template: '#template',
  data: {
    socket: null,
    player: null,
    goEasyConnect: null,
    videoList: ['https://cloud189-shzh-gz-person.oos-gdsz.ctyunapi.cn/8eee2ba1-7811-476c-a0c8-08eb969742ce?response-content-disposition=attachment%3Bfilename%3D%22æçå¤©æå¥³åS01E01.mp4%22&x-amz-CLIENTNETWORK=UNKNOWN&x-amz-CLOUDTYPEIN=CORP&x-amz-CLIENTTYPEIN=UNKNOWN&Signature=tfkq0AkCngZP/dnEMMuM3EmIut4%3D&AWSAccessKeyId=18bd696e8df5d7a48893&Expires=1612890581&x-amz-limitrate=102400&response-content-type=video/mp4&x-amz-FSIZE=852159740&x-amz-UID=2512194266080&x-amz-UFID=51360310901228307'],
    videoSrc: 'https://cloud189-shzh-gz-person.oos-gdsz.ctyunapi.cn/8eee2ba1-7811-476c-a0c8-08eb969742ce?response-content-disposition=attachment%3Bfilename%3D%22æçå¤©æå¥³åS01E01.mp4%22&x-amz-CLIENTNETWORK=UNKNOWN&x-amz-CLOUDTYPEIN=CORP&x-amz-CLIENTTYPEIN=UNKNOWN&Signature=tfkq0AkCngZP/dnEMMuM3EmIut4%3D&AWSAccessKeyId=18bd696e8df5d7a48893&Expires=1612890581&x-amz-limitrate=102400&response-content-type=video/mp4&x-amz-FSIZE=852159740&x-amz-UID=2512194266080&x-amz-UFID=51360310901228307',
    playing: false,
    controlParam: {
      user: '',
      action: '',
      time: '',
    },
    userId: '',
    channel: 'channel1', //GoEasy channel
    appkey: 'BC-d9053184f38248879b370798dac2fb53', // 替换成你的GoEasy应用appkey
  },
  methods: {
    randomString(length) {
      let str = ''
      for (let i = 0; i < length; i++) {
        str += Math.random().toString(36).substr(2)
      }
      return str.substr(0, length)
    },
    addVideo() {
      if (this.videoSrc) {
        this.videoList.push(decodeURI(this.videoSrc))
      }
      localStorage.setItem('videoList', JSON.stringify(this.videoList))
    },
    playVideoItem(src) {
      this.$refs.video.src = src
      localStorage.setItem('currentPlayVideo', src)

    },
    deleteVideoItem(index) {
      this.videoList.splice(index, 1)
      localStorage.setItem('videoList', JSON.stringify(this.videoList))
    },
    toggleFullScreen() {
      if (this.player.requestFullscreen) {
        this.player.requestFullscreen()
      } else if (this.player.mozRequestFullScreen) {
        this.player.mozRequestFullScreen()
      } else if (this.player.webkitRequestFullscreen) {
        this.player.webkitRequestFullscreen()
      } else if (this.player.msRequestFullscreen) {
        this.player.msRequestFullscreen()
      }
    },
    playVideo() {
      if (this.playing) {
        this.player.pause()
        this.controlParam.action = 'pause'
        this.controlParam.time = this.player.currentTime
        /* 使用socket-io*/
        // this.socket.emit('video-control', JSON.stringify(this.controlParam))

        /* 使用GoEasy*/
        this.goEasyConnect.publish({
          channel: this.channel,
          message: JSON.stringify(this.controlParam)
        })
      } else {
        this.player.play()
        this.controlParam.action = 'play'
        this.controlParam.time = this.player.currentTime
        /* 使用socket-io*/
        // this.socket.emit('video-control', JSON.stringify(this.controlParam))

        /* 使用GoEasy*/
        this.goEasyConnect.publish({
          channel: this.channel,
          message: JSON.stringify(this.controlParam)
        })
      }
    },
    seekVideo() {
      this.player.pause()
      this.controlParam.action = 'seek'
      this.controlParam.time = this.player.currentTime
      /* 使用socket-io*/
      // this.socket.emit('video-control', JSON.stringify(this.controlParam))

      /* 使用GoEasy*/
      this.goEasyConnect.publish({
        channel: this.channel,
        message: JSON.stringify(this.controlParam)
      })
    },
    resultHandler(result) {
      switch (result.action) {
        case "play":
          this.player.currentTime = (result.time + 0.2) //播放时+0.2秒，抵消网络延迟
          this.player.play();
          break
        case "pause":
          this.player.currentTime = (result.time)
          this.player.pause();
          break
        case "seek":
          this.player.currentTime = (result.time);
          break
      }
    }
  },
  created() {

    /* 读取本地视频列表和上一次播放的视频*/

    const localList = JSON.parse(localStorage.getItem('videoList'))

    this.videoList = localList ? localList : []

    const currentPlayVideo = localStorage.getItem('currentPlayVideo')

    this.videoSrc = currentPlayVideo ? currentPlayVideo : ''

    this.userId = this.randomString(10)

    this.controlParam.user = this.userId
  },
  mounted() {

    this.player = this.$refs.video

    /*使用socket-io*/
    // this.socket = io('http://192.168.3.58:2233'); // 替换成你的websocket服务地址
    // this.socket.on('video-control', (res) => {
    //   const result = JSON.parse(res);
    //   if (result.user !== this.userId) {
    //     this.resultHandler(result)
    //   }
    // });

    /* 使用GoEasy*/

    /* 创建GoEasy连接*/
    this.goEasyConnect = new GoEasy({
      host: "hangzhou.goeasy.io", // 应用所在的区域地址，杭州：hangzhou.goeasy.io，新加坡：singapore.goeasy.io
      appkey: this.appkey,
      onConnected: function () {
        console.log('连接成功！')
      },
      onDisconnected: function () {
        console.log('连接断开！')
      },
      onConnectFailed: function (error) {
        console.log(error, '连接失败或错误！')
      }
    })

    const that = this

    /* 监听GoEasy连接*/
    this.goEasyConnect.subscribe({
      channel: this.channel,
      onMessage: function (message) {
        const result = JSON.parse(message.content)
        if (result.user !== that.userId) {
          that.resultHandler(result)
        }
      }
    })
    this.player.addEventListener('play', () => {
      this.playing = true
    })
    this.player.addEventListener('pause', () => {
      this.playing = false
    })
  }
})
