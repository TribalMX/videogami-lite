const express = require('express')
const router = express.Router()
const mkdirp = require('mkdirp');

//database functions

const db_label = require('./db/labels.js')
const db_logo = require('./db/logos.js')
const db_trims = require('./db/trims.js')
const db_edit = require('./db/editing_station.js')

// packages
const schedule = require('node-schedule')
const Stopwatch = require('timer-stopwatch')
const fileUpload = require('express-fileupload');
const cmd = require('node-cmd')

// stream status

let streamStatus = "Not Streaming and no Scheduled streams"
let streamDestinations = []
let scheduledTime = null
let scheduled = false

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
let streamJC = () => { console.log('Now streaming to Joicaster'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://ingest-us-east.a.switchboard.zone/live/' + JCrtmpKey + '"') }

// this is for facebook only
let streamFB = () => { console.log('Now streaming to Facebook'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=580:10:enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"' + FBrtmp + '"') }

// this is for Youtube only
let streamYT = () => { console.log('Now streaming to Youtube'); cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://a.rtmp.youtube.com/live2/' + YTrtmpKey + '"') }

// this is for output mp4
let outputMp4 = () => { cmd.run('ffmpeg -i ' + inputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 ' + './videos/output/' + outputName + '.mp4') }

// this is for trimming the video with start and end time

let startTime = null
let duration = null
let trimName = null

let edit = () => { cmd.run('ffmpeg -ss ' + startTime + ' -t ' + duration + ' -i ./videos/output/' + outputName + '.mp4 -c copy ./videos/cut-videos/' + outputName + '/' + trimName + '.mp4') }

// this is to stop all ffmpeg activity

let scheduleStream = null

let stop = () => { 
  if(scheduled){
    streamStatus = 'Scheduled on stream at: ' + scheduledTime
  } else {
    streamStatus = "Not Streaming and no scheduled streams";
    streamDestinations = [];
  }
  stopwatch.stop();
  stopwatch.reset();
  cmd.run('killall ffmpeg') 
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { streamStatus: streamStatus, streamDestinations: streamDestinations, scheduleStatus: scheduled })
})


// get labeling page

router.get('/labeling', function (req, res, next) {
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('labeling', {name: displayName, label: labels, date: streamStatus.slice(13), terminate: "End Stream", streamDestination: streamDestinations})
  }) 
})

// stream settings

router.post('/streamsettings', function (req, res, next) {
  displayName = req.body.name
  outputName = displayName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  console.log(req.body)
  db_label.insertDoc(outputName)

  let month = req.body.month
  let day = req.body.day
  let hour = req.body.hour
  let minute = req.body.minute

  let prettyMonth = month
  let prettyDay = day
  let prettyMinute = minute
  let prettyHour = hour

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

  let stopSign = null
  if(scheduled){
    stopSign = "Cancel scheduled Stream"
  } else {
    stopSign = "End Stream"
  }

  if (req.body.youtube === 'true' && !scheduled) {
    streamYT()
    streamDestinations.push(" Youtube")
  }
  if (req.body.facebook === 'true' && !scheduled) {
    FBrtmp = req.body.rtmplink
    streamFB()
    streamDestinations.push(" Facebook")
  }
  if (req.body.joicaster === 'true' && !scheduled) {
    streamJC()
    streamDestinations.push(" Joicaster")
  }
  if ((req.body.youtube || req.body.facebook || req.body.joicaster) && !scheduled) {
    stopwatch.start()
    outputMp4()
    streamStatus = "Live"
    res.render('labeling', {name: displayName, label: '', date: "Now", streamDestination: streamDestinations, terminate: stopSign})
  }
  if (scheduled) {
    let date = new Date(2018, month - 1, day, hour, minute, 0)
    console.log('Scheduled on ' + req.body.hour + ':' + req.body.minute)
    scheduledTime = req.body.hour + ':' + req.body.minute
    streamStatus = "schedule for " + prettyDay + "/" + prettyMonth + "/2018 at " + prettyHour + ":" + prettyMinute
    if (req.body.youtube === 'true') {
      streamDestinations.push(" Youtube")
    }
    if (req.body.facebook === 'true') {
      FBrtmp = req.body.rtmplink
      streamDestinations.push(" Facebook")
    }
    if (req.body.joicaster === 'true') {
      streamDestinations.push(" Joicaster")
    }

    scheduleStream = schedule.scheduleJob(date, function (err) {
      db_label.insertDoc(outputName)
      streamStatus = "Live"
      stopwatch.start()
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
      scheduled = false
    })
    res.redirect('/')
  }
})

//convert to mp4 only

router.post('/convert', function (req, res, next) {
  displayName = req.body.name
  outputName = displayName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  db_label.insertDoc(outputName)
  outputMp4()
  streamStatus = "Converting"
  console.log(">>>>>" + outputName)
  res.render('labeling', {name: displayName, label: '', date: "Not Streaming", terminate: "Stop Conversion"})
})

// cancel scheduled task

router.post('/cancelstream', function (req, res, next) {
  console.log('canceled')
  scheduledTime = null
  scheduled = false
  db_edit.removeCollection(outputName)
  scheduleStream.cancel()
  stop()
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

// editing station

router.get('/editing_station', function (req, res, next) {
  db_edit.getCollections((err, collectionNames) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('editing_station', {collections: collectionNames})
  })   
})

router.get('/editing_station/:collection_name', async function (req, res, next) {
  let collectionName = req.params.collection_name
  outputName = collectionName
  await db_trims.locateDoc(collectionName)
  await db_label.locateDoc(collectionName)

  db_label.findLabels((err, labels) => {
      if (err) 
          return res.sendStatus(500);

      db_trims.findTrims((err, trims_) => {
          if (err)
              return res.sendStatus(500);         
          res.render('editing', {name: collectionName, label: labels, trims: trims_, startTime: labelStartTime, endTime: labelEndTime})
      }) 
  }) 
})

router.post('/editing_station/remove_stream', function (req, res, next) {
  let collectionName = req.body.collectionName
  db_edit.removeCollection(collectionName)

  res.redirect('/editing_station')
})
// editing process

let labelStartTime = ''
let labelEndTime = ''

router.get('/editing', async function (req, res, next) {
  dirPath = "./videos/cut-videos/" + outputName
  mkdirp(dirPath, function(err) { 
    console.log('directory made')
  });
  stop()
  await db_trims.locateDoc(outputName)
  await db_label.locateDoc(outputName)
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: outputName, name: displayName, label: labels, trims: trims_, trim: trimName, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  })   
})

router.post('/trim', function (req, res, next) {
  startTime = req.body.startTime
  duration = req.body.endTime
  trimName = req.body.cutName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  edit()
  db_trims.insertTrim(trimName)
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: displayName, label: labels, trims: trims_, trim: trimName, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  })   
})

router.get('/download', function (req, res, next) {
  var file = './videos/cut-videos/' + trimName + '.mp4';
  res.download(file); // Set disposition and send it.
})

router.post('/downloadWhole', function (req, res, next) {
  var file = './videos/output/' + req.body.wholeStream + '.mp4';
  res.download(file); // Set disposition and send it.
})

router.post('/editing/:name/addLabel', async function (req, res, next) {
  let newLabel = req.body.newLabel
  let newLabelTime = req.body.newLabelTime
  let name = req.params.name
  await db_trims.locateDoc(name)
  await db_label.locateDoc(name)
  await db_label.insertLabel(newLabel, newLabelTime)
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      db_trims.findTrims((err, trims_) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.render('editing', {name: name, label: labels, trims: trims_, trim: trimName, startTime: labelStartTime, endTime: labelEndTime})
      }) 
    }) 
})

router.post('/deleteTrim', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim
  db_trims.deleteTrim(trimToDelete)

  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: displayName, label: labels, trims: trims_, trim: trimName, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  }) 
})

router.post('/editing/:name/add_start_time', function (req, res, next) {
  let unCutLabelStartTime = req.body.startTime.substr(1).slice(41, -1).replace(/['"]+/g, '')
  let sliceLength = unCutLabelStartTime.length - 8
  labelStartTime = unCutLabelStartTime.slice(sliceLength)

  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: req.params.name, label: labels, trims: trims_, trim: trimName, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  })   
})
router.post('/editing/:name/add_end_time', function (req, res, next) {
  let unCutLabelEndTime = req.body.endTime.substr(1).slice(41, -1).replace(/['"]+/g, '')
  let sliceLength = unCutLabelEndTime.length - 8
  labelEndTime = unCutLabelEndTime.slice(sliceLength)

  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: req.params.name, label: labels, trims: trims_, trim: trimName, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  })   
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
    res.render('labeling', {name: displayName, label: labels})
  }) 
})

router.get('/labeling/refresh', function (req, res, next) {
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('labeling', {name: displayName, label: labels})
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
  logo.mv('./public/images/' + logo.name, function(err) {
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

router.post('/delete_logo', function (req, res, next) {
  console.log('here is the returned delete thing')
  let logoObj = req.body.logoName
  let logoObjParsed = JSON.parse(logoObj)
  let logoString = logoObjParsed.logo
  console.log(logoString)
  db_logo.deleteLogo(logoString)
  db_logo.findLogos((err, logo) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('logo', {name: outputName, logo_: logo})
  })
})

router.post('/logo_setup/use_logos', function (req, res, next) {
  console.log(req.body)
  db_logo.findLogos((err, logo) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.render('logo', {name: outputName, logo_: logo})
  })
})


// download trims

router.post('/downloadTrims', function (req, res, next) {
  let trimName = req.body.trimName
  var file = './videos/cut-videos/' + trimName + '.mp4';
  res.download(file); // Set disposition and send it.
  db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: displayName, label: labels, trims: trims_, trim: trimName})
    }) 
  })   
})
module.exports = router
