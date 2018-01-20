const express = require('express')
const router = express.Router()
const cmd = require('node-cmd')
const schedule = require('node-schedule')
const Stopwatch = require('timer-stopwatch')
const db_label = require('./db/labels.js')
const db_logo = require('./db/logos.js')
const fileUpload = require('express-fileupload');

// upload

router.use(fileUpload());

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
let displayName = 'displayName'

// this is for joicaster
let streamJC = () => { console.log('Now streaming to Joicaster'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./routes/uploads/ACE.png -i ./routes/uploads/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://ingest-us-east.a.switchboard.zone/live/' + JCrtmpKey + '"') }

// this is for facebook only
let streamFB = () => { console.log('Now streaming to Facebook'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./routes/uploads/ACE.png -i ./routes/uploads/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=580:10:enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"' + FBrtmp + '"') }

// this is for Youtube only
let streamYT = () => { console.log('Now streaming to Youtube'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./routes/uploads/ACE.png -i ./routes/uploads/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://a.rtmp.youtube.com/live2/' + YTrtmpKey + '"') }

// this is for output mp4
let outputMp4 = () => { cmd.run('ffmpeg -i ' + inputURL + ' -i ./routes/uploads/ACE.png -i ./routes/uploads/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 ' + './routes/output/' + outputName + '.mp4') }

// this is for trimming the video with start and end time

let startTime = null
let duration = null
let trimName = null

let edit = () => { cmd.run('ffmpeg -ss ' + startTime + ' -t ' + duration + ' -i ./routes/output/' + outputName + '.mp4 -c copy ./routes/cut-videos/' + trimName + '.mp4') }

// this is to stop all ffmpeg activity

let stop = () => { cmd.run('killall ffmpeg') }

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'title' })
})

// stream settings
let scheduleStream = null

router.post('/streamsettings', function (req, res, next) {
  displayName = req.body.name
  outputName = displayName.toString().replace(/\s+/g, '-').toLowerCase()
  console.log(req.body)
  db_label.insertDoc(outputName)

  let month = req.body.month
  let day = req.body.day
  let hour = req.body.hour
  let minute = req.body.minute

  let scheduled = false
  let prettyHour = hour
  let prettyMinute = minute
  let prettyMonth = month
  let prettyDay = day

  if(month < 9 ){
    prettyMonth = "0" + month
  }
  if(day < 9 ){
    prettyDay = "0" + day
  }
  if(hour < 9 ){
    prettyHour = "0" + hour
  }
  if(minute < 9 ){
    prettyMinute = "0" + minute
  }

  if(month && day && hour && minute){
    scheduled = true
  }

  if ((req.body.youtube || req.body.facebook || req.body.joicaster) && !scheduled) {
    stopwatch.start()
    outputMp4()
  }
  if (req.body.youtube === 'true' && !scheduled) {
    streamYT()
  }
  if (req.body.facebook === 'true' && !scheduled) {
    FBrtmp = req.body.rtmplink
    streamFB()
  }
  if (req.body.joicaster === 'true' && !scheduled) {
    streamJC()
  }
  if (scheduled) {
    let date = new Date(2018, month - 1, day, hour, minute, 0)
    console.log('schedule on ' + req.body.hour + ':' + req.body.minute)

    scheduleStream = schedule.scheduleJob(date, function (err) {
      stopwatch.start()
      outputMp4()
      if(err){
        console.log(err)
      }
      console.log('stream started')
      outputMp4()
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
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('labeling', {name: displayName, label: labels, date: " " + prettyDay + "/" + prettyMonth + "/2018 at " + prettyHour + ":" + prettyMinute })
    })  
  }
  if(!scheduled){
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('labeling', {name: displayName, label: labels, date: "Now"})
    })
  }  
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
  stopwatch.reset()
  console.log("all ffmpeg processes aborted")
  res.redirect('/')
})

// JC User rtmp key

router.post('/YTRtmpKey', function (req, res, next) {
  YTrtmpKey = req.body.YTRtmpKey
  res.redirect('/')
})

// miscllaneous stuff

router.get('/setup_accounts', function (req, res, next) {
  res.render('accounts')
})

// editing process

router.get('/editing', function (req, res, next) {
  stop()
  stopwatch.stop()
  stopwatch.reset()
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('editing', {name: displayName, label: labels})
  })  
})

router.post('/trim', function (req, res, next) {
  startTime = req.body.startTime
  duration = req.body.endTime
  trimName = req.body.cutName.toString().replace(/\s+/g, '-').toLowerCase()
  edit()
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('editing', {name: displayName, label: labels, trim: trimName})
  })  
})

router.get('/download', function (req, res, next) {
  var file = __dirname + '/cut-videos/' + trimName + '.mp4';
  res.download(file); // Set disposition and send it.
})

router.get('/downloadWhole', function (req, res, next) {
  var file = __dirname + '/output/' + outputName + '.mp4';
  res.download(file); // Set disposition and send it.
})

// label stuff

router.post('/labeling/add', function (req, res, next) {
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
  db_label.insertLabel(labelName, overallTime)
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('labeling', {name: outputName, label: labels})
  }) 
})

router.get('/labeling/refresh', function (req, res, next) {
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('labeling', {name: outputName, label: labels})
  }) 
})

// logo stuff

router.get('/logo_setup', function (req, res, next) {
  db_logo.findLogos((err, logo) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('logo', {name: outputName, logo_: logo})
  })
})

router.post('/upload', function(req, res) {
  let logo = req.files.logoUpload;
  console.log(req.files.logoUpload); // the uploaded file object
  logo.mv('./routes/uploads/' + logo.name, function(err) {
    if (err)
      return res.status(500).send(err);
    db_logo.insertLogo(logo.name)
    db_logo.findLogos((err, logo) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('logo', {name: outputName, logo_: logo})
    })
  });
});

router.delete('/delete_logo', function (req, res, next) {
  console.log('here is the returned delete thing')
  console.log(req.body.logoName)
  res.render('logo')
})

module.exports = router
