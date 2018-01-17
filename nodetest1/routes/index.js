const express = require('express')
const router = express.Router()
const cmd = require('node-cmd')
const schedule = require('node-schedule')
const Stopwatch = require('timer-stopwatch')
const db = require('./db/labels.js')

// rtmp stream keys
let YTrtmpKey = 'xz4t-2x3s-rwd2-497b'
let JCrtmpKey = 'rickysychan-7hup2-mqxsa-b6kmd-gj2gq'
let FBrtmp = null

// input urls
let inputURL = 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8'

// logo settings

let logoHeight = 10
let logoHorizontal = 580
let imgScale = '40:40'

// stopwatch
let stopwatch = new Stopwatch()

// stream name
let outputName = 'stream'

// this is for joicaster
let streamJC = () => { console.log('Now streaming to Joicaster'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://ingest-us-east.a.switchboard.zone/live/' + JCrtmpKey + '"') }

// this is for facebook only
let streamFB = () => { console.log('Now streaming to Facebook'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=580:10:enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"' + FBrtmp + '"') }

// this is for Youtube only
let streamYT = () => { console.log('Now streaming to Youtube'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://a.rtmp.youtube.com/live2/' + YTrtmpKey + '"') }

// this is for output mp4
let outputMp4 = () => { cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 ' + './routes/output/' + outputName + '.mp4') }

// this is for trimming the video with start and end time

let startTime = null
let endTime = null
let trimName = null

let edit = () => { cmd.run('ffmpeg -ss ' + startTime + ' -i ./routes/output/' + outputName + '.mp4 -to ' + endTime + ' -c copy ./routes/cut-videos/' + trimName + '.mp4') }

// this is to stop all ffmpeg activity

let stop = () => { cmd.run('killall ffmpeg') }

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'title' })
})

// stream settings
let scheduleStream = null

router.post('/streamsettings', function (req, res, next) {
  console.log(req.body)
  stopwatch.start()
  db.insertDoc(outputName)
  if (req.body.youtube || req.body.facebook || req.body.joicaster) {
    stopwatch.start()
    outputMp4()
  }
  if (req.body.youtube === 'true' && !req.body.month) {
    streamYT()
  }
  if (req.body.facebook === 'true' && !req.body.month) {
    FBrtmp = req.body.rtmplink
    streamFB()
  }
  if (req.body.joicaster === 'true' && !req.body.month) {
    streamJC()
  }
  if (req.body.month) {
    let month = req.body.month - 1
    let day = req.body.day
    let hour = req.body.hour
    let minute = req.body.minute
    let date = new Date(2018, month, day, hour, minute, 0)
    console.log('schedule on ' + req.body.hour + ':' + req.body.minute)
    scheduleStream = schedule.scheduleJob(date, function () {
      console.log('stream started')
      if (req.body.youtube === 'true') {
        streamYT()
      }
      if (req.body.facebook === 'true') {
        FBrtmp = req.body.rtmplink
        streamFB()
      }
      if (req.body.joicaster === 'true') {
        streamJC()
      }
      scheduleStream.cancel()
    })
    res.render('labeling', {name: outputName, labels: db.label})
  }
    db.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('labeling', {name: outputName, label: JSON.stringify(labels)})
    })  
})

// cancel scheduled task

router.post('/cancelstream', function (req, res, next) {
  console.log('canceled')
  scheduleStream.cancel()
  res.redirect('/')
})

// logo size

router.post('/imgScale', function (req, res, next) {
  imgScale = req.body.logoSize
  res.redirect('/')
})

// logo placements

router.post('/logoInput', function (req, res, next) {
  logoHeight = req.body.logoHei
  logoHorizontal = req.body.logoHor
  res.redirect('/')
})

// JC User rtmp key

router.post('/JCRtmpKey', function (req, res, next) {
  JCrtmpKey = req.body.JCRtmpKey
  res.redirect('/')
})

// Hls input

router.post('/input', function (req, res, next) {
  inputURL = req.body.JCInput
  res.redirect('/')
})

// stop all ffmpeg tasks

router.get('/stop', function (req, res, next) {
  stop()
  stopwatch.stop()
  res.redirect('/')
})

// JC User rtmp key

router.post('/YTRtmpKey', function (req, res, next) {
  YTrtmpKey = req.body.YTRtmpKey
  res.redirect('/')
})

router.get('/setup_accounts', function (req, res, next) {
  res.render('accounts')
})

router.get('/logo_setup', function (req, res, next) {
  res.render('logo')
})

router.post('/output_name', function (req, res, next) {
  name = req.body.name
  outputName = name.toString()
  console.log(outputName)
  res.redirect('/')
})

router.get('/editing', function (req, res, next) {
  stop()
  stopwatch.stop()
  db.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('editing', {name: outputName, label: JSON.stringify(labels[1])})
  })  
})

router.post('/trim', function (req, res, next) {
  startTime = req.body.startTime
  endTime = req.body.endTime
  trimName = req.body.cutName
  edit()
  res.render('editing')
})

router.get('/download', function (req, res, next) {
  var file = __dirname + '/cut-videos/' + trimName + '.mp4';
  res.download(file); // Set disposition and send it.
})

router.get('/downloadWhole', function (req, res, next) {
  var file = __dirname + '/output/' + outputName + '.mp4';
  res.download(file); // Set disposition and send it.
})

router.post('/labeling/add', function (req, res, next) {
  // let time = stopwatch.elapsed.hours + ":" + stopwatch.elapsed.minutes + ":" + stopwatch.elapsed.seconds
  let time = stopwatch.ms/1000
  let minutes = Math.floor(time / 60);
  let seconds = Math.floor(time - minutes * 60);
  let hours = Math.floor(time / 3600);
  if(seconds < 10){
      seconds = "0" + seconds
    }
  if(minutes < 10){
    minutes = "0" + minutes
  }
  if(hours < 10){
    hours = "0" + hours
  }
  console.log("the elapsed time: " + hours + ":" + minutes + ":" + seconds)
  let overallTime = hours + ":" + minutes + ":" + seconds
  labelName = req.body.label
  db.insertLabel(labelName, overallTime)
  res.render('labeling')
})

router.get('/labeling/refresh', function (req, res, next) {
  db.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('labeling', {name: outputName, label: JSON.stringify(labels)})
  }) 
})

router.get('/moo1', function (req, res, next) {
  res.render('labeling')
})

router.get('/moo2', function (req, res, next) {
  res.render('editing')
})
module.exports = router
