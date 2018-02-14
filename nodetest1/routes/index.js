const express = require('express')
const router = express.Router()

//database functions

const db_label = require('./db/labels.js')
const db_logo = require('./db/logos.js')
const db_trims = require('./db/trims.js')
const db_edit = require('./db/editing_station.js')
const db_accounts = require('./db/accounts.js')

// packages
const schedule = require('node-schedule')
const Stopwatch = require('timer-stopwatch')
const fileUpload = require('express-fileupload');
const cmd = require('node-cmd')
const mkdirp = require('mkdirp');
const fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
// stream status

let streamStatus = "Not Streaming and no Scheduled streams"
let streamFBDestinations = []
let streamYTDestinations = []
let streamSTVDestinations = []
let streamJCDestinations = []
let scheduledTime = null
let scheduled = false

// upload

router.use(fileUpload());

// this is to stop all ffmpeg activity

let scheduleStream = null

let stop = () => { 
  if(scheduled){
    streamStatus = 'Scheduled on stream at: ' + scheduledTime
  } else {
    streamStatus = "Not Streaming and no scheduled streams";
    streamFBDestinations = [];
    streamYTDestinations = [];
    streamSTVDestinations = [];
    streamJCDestinations = [];
  }
  stopwatch.stop();
  stopwatch.reset();
  cmd.run('killall ffmpeg') 
}

// input urls
let inputURL = 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8'

// logo settings

let logoHeight = 10
let logoHorizontal = 580
let imgScale = '40:40'
let altTime = 10
let logosInUse = 0

// stopwatch
let stopwatch = new Stopwatch()

// stream name
let outputName = 'stream'
let displayName = 'displayName'
let resolution = "1280:720"

// youtube
let streamYT = (YTrtmp) => {
  console.log("streaming to youtube")
  var proc3 = new ffmpeg({ source: inputURL, timeout: 0 })
    .addOption('-vcodec', 'libx264')
    .addOption('-acodec', 'aac')
    .addOption('-crf', 26)
    // .addOption('-aspect', '640:360')
    .addOption('-f', 'flv')
    .addOption('-vf', "scale=" +  resolution)
    // .withSize('640x360')
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .output('rtmp://a.rtmp.youtube.com/live2/' + YTrtmp, function(stdout, stderr) {
      console.log('Convert complete' +stdout)
    })
    .run()
  }

// Facebook

let streamFB = (FBrtmp) => {
  console.log("streaming to youtube")
  var proc3 = new ffmpeg({ source: inputURL, timeout: 0 })
    .addOption('-vcodec', 'libx264')
    .addOption('-acodec', 'aac')
    .addOption('-crf', 26)
    // .addOption('-aspect', '640:360')
    .addOption('-f', 'flv')
    .addOption('-vf', "scale=" +  resolution)
    // .withSize('640x360')
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .output(FBrtmp, function(stdout, stderr) {
      console.log('Convert complete' +stdout)
    })
    .run()
  }

// Joicaster

let streamJC = (JCrtmp) => {
  console.log("streaming to youtube")
  var proc3 = new ffmpeg({ source: inputURL, timeout: 0 })
    .addOption('-vcodec', 'libx264')
    .addOption('-acodec', 'aac')
    .addOption('-crf', 26)
    // .addOption('-aspect', '640:360')
    .addOption('-f', 'flv')
    .addOption('-vf', "scale=" +  resolution)
    // .withSize('640x360')
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .output('rtmp://ingest-cn-tor.switchboard.zone/live/' + JCrtmp, function(stdout, stderr) {
      console.log('Convert complete' +stdout)
    })
    .run()
  }

// stream Snappy TV

let streamSTV = (STVrtmpKey) => {
  console.log("streaming to youtube")
  var proc3 = new ffmpeg({ source: inputURL, timeout: 0 })
    .addOption('-vcodec', 'libx264')
    .addOption('-acodec', 'aac')
    .addOption('-crf', 26)
    // .addOption('-aspect', '640:360')
    .addOption('-f', 'flv')
    .addOption('-vf', "scale=" +  resolution)
    // .withSize('640x360')
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .output(STVrtmpKey, function(stdout, stderr) {
      console.log('Convert complete' +stdout)
    })
    .run()
  }

//output mp4

let outputMp4 = () => {
var proc = new ffmpeg({ source: inputURL, timeout: 0 })
  .addOption('-vcodec', 'libx264')
  .addOption('-acodec', 'aac')
  .addOption('-crf', 26)
  // .addOption('-aspect', '640:360')
  // .withSize('640x360')
  .addOption('-vf', "scale=" +  resolution)
  .on('start', function(commandLine) {
  console.log('Query : ' + commandLine);
  })
  .on('error', function(err) {
  console.log('Error: ' + err.message);
  })
  .saveToFile('./public/videos/output/' + outputName + '.mp4', function(stdout, stderr) {
  console.log('Convert complete' +stdout)
})
  .on('end', function(stdout, stderr) {
    console.log('Transcoding succeeded !');
  });
  dirPath = "./public/videos/cut-videos/" + outputName
  mkdirp(dirPath, function(err) { 
    console.log('directory made')
});
}

// this is for trimming the video with start and end time

let startTime = '00:00:00'
let duration = "00:00:01"
let trimName = "example"
let inStreamMsg = 'not recording'

// let edit = () => { cmd.run('ffmpeg -ss ' + startTime + ' -t ' + duration + ' -i ./public/videos/output/' + outputName + '.mp4 -c copy ./public/videos/cut-videos/' + outputName + '/' + trimName + '.mp4') }
let edit = () => {
  console.log(duration)
  var proc2 = new ffmpeg({ source: './public/videos/output/' + outputName + '.mp4', timeout: 0 })
    .addOption('-ss', startTime)
    .addOption('-t', duration)
    .addOption('-c', 'copy')
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .saveToFile('./public/videos/cut-videos/' + outputName + '/' + trimName + '.mp4', function(stdout, stderr) {
    console.log('Convert complete' +stdout);
  });
  }

// instream edit
let inStreamEdit = () => {
  var proc2 = new ffmpeg({ source: inputURL, timeout: 0 })
    .addOption('-vcodec', 'libx264')
    .addOption('-acodec', 'aac')
    .addOption('-crf', 26)
    // .addOption('-aspect', '640:360')
    // .withSize('640x360')
    .addOption('-vf', "scale=" +  resolution)
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .saveToFile('./public/videos/cut-videos/' + outputName + '/' + trimName + '.mp4', function(stdout, stderr) {
    console.log('Convert complete' +stdout);
  });
  }

let killTrim = () => {
  console.log('kill "$(pgrep -f ' + trimName + '.mp4)"')
  cmd.run('kill "$(pgrep -f ' + trimName + '.mp4)"')
  trimName = null
}

router.post('/test', function (req, res, next) {
  streamYT("qq0e-tf5g-eg85-52te")
  res.redirect('/video_settings')
})

/* GET home page. */
router.get('/', function (req, res, next) {
  labelStartTime = ''
  labelEndTime = ''

  db_accounts.findYToutlets((err, YToutlets_) => {
    if (err) {
        return res.sendStatus(500);
    }
    db_accounts.findFBoutlets((err, FBoutlets_) => {
      if (err) {
          return res.sendStatus(500);
      }
      db_accounts.findSTVoutlets((err, STVoutlets_) => {      
        if (err) {
          return res.sendStatus(500);
      }
        db_accounts.findJCoutlets((err, JCoutlets_) => {      
          if (err) {
            return res.sendStatus(500);
        }
      res.render('index', { name: outputName, JCoutlets: JCoutlets_, streamStatus: streamStatus, STVoutlets: STVoutlets_, streamJCDestinations: streamJCDestinations, streamSTVDestinations: streamSTVDestinations, streamYTDestinations: streamYTDestinations, streamFBDestinations: streamFBDestinations, scheduleStatus: scheduled, YToutlets: YToutlets_, FBoutlets: FBoutlets_, currentUrl: inputURL  })        
      })
    }) 
  })
})
})

// stream settings

router.post('/start_stream', function (req, res, next) {
  console.log(req.body)
  displayName = req.body.name
  outputName = displayName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  db_label.insertDoc(outputName)
  let scheduled = false

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
  

  var YTcreds = req.body.YToutletCredentials
  var FBcreds = req.body.FBoutletCredentials
  var STVcreds = req.body.STVoutletCredentials
  var JCcreds = req.body.JCoutletCredentials

  if((YTcreds || FBcreds || STVcreds || JCcreds) && !scheduled){
    stopwatch.start()
    outputMp4()
    streamStatus = "Live"

  // youtube
  if(typeof YTcreds === 'object'){
    YTcreds.forEach(function(YTrtmpKey) {
      let parsed = JSON.parse(YTrtmpKey)
      streamYT(parsed[0])
      streamYTDestinations.push(parsed[1])
    });
  }
  if(typeof YTcreds === 'string'){
    let parsed = JSON.parse(YTcreds)
    streamYT(parsed[0])
    streamYTDestinations.push(parsed[1])
  }

  // Joicaster
    if(typeof JCcreds === 'object'){
      // console.log(YTcreds)
      JCcreds.forEach(function(JCrtmpKey) {
        let parsed = JSON.parse(JCrtmpKey)
        streamJC(parsed[0])
        streamJCDestinations.push(parsed[1])
      });
    }
    if(typeof JCcreds === 'string'){
      let parsed = JSON.parse(JCcreds)
      streamJC(parsed[0])
      streamJCDestinations.push(parsed[1])
    }
  // Facebook

  if(typeof FBcreds === 'object'){
    FBcreds.forEach(function(FBrtmpKey) {
      let parsed = JSON.parse(FBrtmpKey)
      streamFB(parsed[0])
      slicedNamed = parsed[1].slice(1,-1)
      streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      console.log(">>>>>" + JSON.stringify(streamFBDestinations))
    });
  }
  if(typeof FBcreds === 'string'){
      let parsed = JSON.parse(FBcreds)
      streamFB(parsed[0])
      slicedNamed = parsed[1].slice(1,-1)
      streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      console.log(">>>>>" + JSON.stringify(streamFBDestinations))
  }
  // Snappy TV

  if(typeof STVcreds === 'object'){
    STVcreds.forEach(function(STVrtmp) {
      let parsed = JSON.parse(STVrtmp)
      streamSTV(parsed[1])
      streamSTVDestinations.push({name: parsed[0]})
      console.log(">>>>>" + JSON.stringify(streamSTVDestinations))
    });
  }
  if(typeof STVcreds === 'string'){
      let parsed = JSON.parse(STVcreds)
      streamSTV(parsed[1])
      streamSTVDestinations.push({name: parsed[0]})
      console.log(">>>>>" + JSON.stringify(streamSTVDestinations))
  }
  res.redirect('/labeling/' + outputName)
}

  if (scheduled) {
    let date = new Date(2018, month - 1, day, hour, minute, 0)
    console.log('Scheduled on ' + req.body.hour + ':' + req.body.minute)
    scheduledTime = req.body.hour + ':' + req.body.minute
    streamStatus = "schedule for " + prettyDay + "/" + prettyMonth + "/2018 at " + prettyHour + ":" + prettyMinute

    // setting destinations
    if(typeof YTcreds === 'object'){
        YTcreds.forEach(function(YTrtmpKey) {
          let parsed = JSON.parse(YTrtmpKey)
          streamYTDestinations.push(parsed[1])
        });
      }
      if(typeof YTcreds === 'string'){
        let parsed = JSON.parse(YTcreds)
        streamYTDestinations.push(parsed[1])
      }
      // Joicaster
      if(typeof JCcreds === 'object'){
        JCcreds.forEach(function(JCrtmpKey) {
          let parsed = JSON.parse(JCrtmpKey)
          streamJCDestinations.push(parsed[1])
        });
      }
      if(typeof JCcreds === 'string'){
        let parsed = JSON.parse(JCcreds)
        streamJCDestinations.push(parsed[1])
      }
      // Facebook
      if(typeof FBcreds === 'object'){
        FBcreds.forEach(function(FBrtmpKey) {
          let parsed = JSON.parse(FBrtmpKey)
          streamYTDestinations.push(parsed[1].slice(1,-1))
        });
      }
      if(typeof FBcreds === 'string'){
        let parsed = JSON.parse(FBcreds)
        streamFBDestinations.push(parsed[1].slice(1,-1))
      }
      // Snappy TV
      if(typeof STVcreds === 'object'){
        STVcreds.forEach(function(STVrtmp) {
          let parsed = JSON.parse(STVrtmp)
          streamSTVDestinations.push({name: parsed[0]})
        });
      }
      if(typeof STVcreds === 'string'){
        let parsed = JSON.parse(STVcreds)
        streamSTVDestinations.push({name: parsed[0]})
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
      // Youtube
      if(typeof YTcreds === 'object'){
        YTcreds.forEach(function(YTrtmpKey) {
          let parsed = JSON.parse(YTrtmpKey)
          streamYT(parsed[0])
        });
      }
      if(typeof YTcreds === 'string'){
        let parsed = JSON.parse(YTcreds)
        streamYT(parsed[0])
      }
      // Joicaster
      if(typeof JCcreds === 'object'){
        // console.log(YTcreds)
        JCcreds.forEach(function(JCrtmpKey) {
          let parsed = JSON.parse(JCrtmpKey)
          streamJC(parsed[0])
          streamJCDestinations.push(parsed[1])
        });
      }
      if(typeof JCcreds === 'string'){
        let parsed = JSON.parse(JCcreds)
        streamJC(parsed[0])
        streamJCDestinations.push(parsed[1])
      }
      // Facebook
      if(typeof FBcreds === 'object'){
        FBcreds.forEach(function(FBrtmpKey) {
          let parsed = JSON.parse(FBrtmpKey)
          streamFB(parsed[0])
        });
      }
      if(typeof FBcreds === 'string'){
        let parsed = JSON.parse(FBcreds)
        streamFB(parsed[0])
      }
      //Snappy TV
      if(typeof STVcreds === 'object'){
        STVcreds.forEach(function(STVrtmp) {
          let parsed = JSON.parse(STVrtmp)
          streamSTV(parsed[1])
        });
      }
      if(typeof STVcreds === 'string'){
          let parsed = JSON.parse(STVcreds)
          streamSTV(parsed[1])
      }
      scheduleStream.cancel()
      scheduled = false
    })
    res.redirect('/')
  }
})

//convert to mp4 only

router.post('/convert', function (req, res, next) {
  stopwatch.start()
  req.params.name = req.body.name
  displayName = req.body.name
  outputName = displayName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  db_label.insertDoc(outputName)
  outputMp4()
  streamStatus = "Converting"
  let stopSign = null
  if(scheduled){
    stopSign = "Cancel scheduled Stream"
  } else if(streamStatus === "Converting"){
    stopSign = "End Conversion"
  } else if(!scheduled){
    stopSign = "End Stream"
  } 
  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    res.redirect('/labeling/' + outputName)
  })   
  },500); 
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
  res.redirect('/logo_setup')
})

// logo placements

router.post('/logoInput', function (req, res, next) {
  logoHeight = req.body.logoHei
  logoHorizontal = req.body.logoHor
  res.redirect('/logo_setup')
})

// Outlet setup

router.get('/setup_accounts', function (req, res, next) {
  setTimeout(function(){  db_accounts.findYToutlets((err, YToutlets_) => {
    if (err) {
        return res.sendStatus(500);
    }
    db_accounts.findFBoutlets((err, FBoutlets_) => {      
      if (err) {
        return res.sendStatus(500);
    }
      db_accounts.findSTVoutlets((err, STVoutlets_) => {      
        if (err) {
          return res.sendStatus(500);
      }
        db_accounts.findJCoutlets((err, JCoutlets_) => {      
          if (err) {
            return res.sendStatus(500);
        }    
        res.render('accounts', {YToutlets: YToutlets_, JCoutlets: JCoutlets_, FBoutlets: FBoutlets_, STVoutlets: STVoutlets_ })
    }) 
    }) 
  },500); 
  })
})
})  

router.post('/setup_accounts/remove_outlet', function (req, res, next) {

  let removeID = req.body.outletID
  db_accounts.deleteStreamOutlet(removeID)
  
    res.redirect('/setup_accounts')

})

router.post('/setup_accounts/setup_youtube', function (req, res, next) {
  YTrtmpKey = req.body.YTRtmpKey
  let YTstreamName = req.body.YTname
  db_accounts.insertYoutubeOutlet(YTstreamName, YTrtmpKey)
  res.redirect('/setup_accounts')
})

router.post('/setup_accounts/setup_joicaster', function (req, res, next) {
  JCrtmpKey = req.body.JCRtmpKey
  let JCstreamName = req.body.JCname
  db_accounts.insertJoicasterOutlet(JCstreamName, JCrtmpKey)
  res.redirect('/setup_accounts')
})

router.post('/setup_accounts/setup_facebook', function (req, res, next) {
  let FBpageId = req.body.FBpageId
  let FBaccesstoken = req.body.FBaccessToken
  let FBoutletName = req.body.FBname
  db_accounts.insertFacebookOutlet(FBoutletName, FBpageId, FBaccesstoken)
  res.redirect('/setup_accounts')
})
router.post('/setup_accounts/setup_snappyTV', function (req, res, next) {
  let STVname = req.body.STVname
  let STVpublishP= req.body.STVpublishP
  let STVstreamName = req.body.STVstreamName
  db_accounts.insertSnappyTVOutlet(STVname, STVpublishP, STVstreamName)
  res.redirect('/setup_accounts')
})

// Hls input

router.post('/input', function (req, res, next) {
  inputURL = req.body.input
  console.log('inputURl >>>>>' + inputURL)
  res.redirect('/')
})

// stop all ffmpeg tasks

router.get('/stop', function (req, res, next) {
  stop()
  console.log("all ffmpeg processes aborted")
  res.redirect('/')
})

// editing station

router.get('/editing_station', function (req, res, next) {
  setTimeout(function(){db_label.findLabels((err, labels) => {
    db_edit.getCollections((err, collectionNames) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing_station', {collections: collectionNames})
    })
  }) },500);   
})

router.get('/editing_station/:collection_name', function (req, res, next) {
  let collectionName = req.params.collection_name
  outputName = collectionName

  db_trims.locateDoc(collectionName)
  db_label.locateDoc(collectionName)

  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) 
        return res.sendStatus(500);

    db_trims.findTrims((err, trims_) => {
        if (err)
            return res.sendStatus(500);         
        res.render('editing', {name: collectionName, label: labels, trims: trims_, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  }) },500);
})

router.post('/editing_station/:stream_name/remove_stream', function (req, res, next) {
  let collectionName = req.body.collectionName
  db_edit.removeCollection(collectionName)

  res.redirect('/editing_station')
})



// editing process

let labelStartTime = ''
let labelEndTime = ''

router.get('/editing/:stream_name', function (req, res, next) {
  stop()
  db_trims.locateDoc(outputName)
  db_label.locateDoc(outputName)
  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {name: outputName, label: labels, trims: trims_, startTime: labelStartTime, endTime: labelEndTime})
    }) 
  })   
  },500);
})

router.post('/editing/:stream_name/trim', function (req, res, next) {
  startTime = req.body.startTime
  endTimeInput = req.body.endTime
  trimName = req.body.cutName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()

  let cutDurationHour = parseInt(endTimeInput.slice(0,-6))
  let cutDurationMinute = parseInt(endTimeInput.slice(3,-3))
  let cutDurationSeconds = parseInt(endTimeInput.slice(6))
  let durationInSeconds =  (cutDurationHour * 3600) + (cutDurationMinute * 60) + cutDurationSeconds

  let cutStartHour = parseInt(startTime.slice(0,-6))
  let cutStartMinute = parseInt(startTime.slice(3,-3))
  let cutStartSeconds = parseInt(startTime.slice(6))
  let startTimeInSeconds =  (cutStartHour * 3600) + (cutStartMinute * 60) + cutStartSeconds

  let inputDuration = durationInSeconds - startTimeInSeconds 
  console.log("inputDuration"+inputDuration)
  console.log("duration in seconds:"+durationInSeconds)
  console.log("startTime in seconds:" + startTimeInSeconds)
  inputDuration = inputDuration.toString()
  
  String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
  duration = inputDuration.toHHMMSS()
  db_trims.insertTrim(trimName, startTime, endTimeInput)
  edit()

  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.redirect('/editing/' + outputName)
    }) 
  })   
},2000);
})


router.post('/editing/:stream_name/downloadWhole', function (req, res, next) {
  var file = './public/videos/output/' + req.body.wholeStream + '.mp4';
  res.download(file); // Set disposition and send it.
})

router.post('/editing/:stream_name/addLabel', function (req, res, next) {
  let newLabel = req.body.newLabel
  let newLabelTime = req.body.newLabelTime
  db_label.insertLabel(newLabel, newLabelTime)
  res.redirect('/editing/' + outputName)
})

router.post('/editing/:stream_name/delete_label', function (req, res, next) {
  let id = req.body.labelName
  db_label.deleteLabel(id)
  res.redirect('/editing/'+ outputName)  
})

router.post('/editing/:stream_name/add_start_time', function (req, res, next) {
  let unCutLabelStartTime = req.body.startTime.substr(1).slice(41, -1).replace(/['"]+/g, '')
  let sliceLength = unCutLabelStartTime.length - 8
  labelStartTime = unCutLabelStartTime.slice(sliceLength)
  res.redirect('/editing/' + outputName)  
})
router.post('/editing/:stream_name/add_end_time', function (req, res, next) {
  let unCutLabelEndTime = req.body.endTime.substr(1).slice(41, -1).replace(/['"]+/g, '')
  let sliceLength = unCutLabelEndTime.length - 8
  labelEndTime = unCutLabelEndTime.slice(sliceLength)
      res.redirect('/editing/' + outputName)  
})

router.post('/editing/:stream_name/deleteTrim', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim
  let trimIdToDelete = req.body.deleteTrimId
  db_trims.deleteTrim(trimToDelete, trimIdToDelete)
  res.redirect('/editing/' + outputName)
})

router.post('/editing/:stream_name/downloadTrim', function (req, res, next) {
  let trimName = req.body.trimName
  var file = './public/videos/cut-videos/' + outputName + '/' + trimName + '.mp4';
  res.download(file); // Set disposition and send it.
})

// label stuff

// get labeling page


router.get('/labeling/:stream_name', function (req, res, next) {
  outputName = req.params.stream_name
  db_trims.locateDoc(outputName)
  db_label.locateDoc(outputName)
  let stopSign = null
  if(scheduled){
    stopSign = "Cancel scheduled Stream"
  } else if(streamStatus === "Converting"){
    stopSign = "End Conversion"
  } else if(!scheduled){
    stopSign = "End Stream"
  } 

  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err)
          return res.sendStatus(500);         
      res.render('labeling', {name: outputName, inStreamEditName: inStreamMsg,input: inputURL ,label: labels, trims: trims_, date: streamStatus, terminate: stopSign, streamJCDestinations: streamJCDestinations, streamSTVDestinations: streamSTVDestinations,streamFBDestinations: streamFBDestinations, streamYTDestinations: streamYTDestinations})
    }) 
  })   
  },1000); 
})

router.post('/labeling/:stream_name/add_label', function (req, res, next) {
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
  
  setTimeout(function(){db_label.findLabels((err, labels) => {
      db_label.findLabels((err, labels) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.send(labels)
      })
    },500); 
  })
})
router.post('/labeling/:stream_name/deleteTrim', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim
  let trimIdToDelete = req.body.deleteTrimId
  db_trims.deleteTrim(trimToDelete, trimIdToDelete)
  res.redirect('/labeling/' + outputName)
})

router.get('/labels/refresh', function (req, res, next) {
  console.log("refreshed!")
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.send(labels)
    })
})


router.get('/labeling/:stream_name/refresh', function (req, res, next) {
  res.redirect('/labeling/' + outputName)
})

router.post('/labeling/:stream_name/trim_start', function (req, res, next) {
  let time = stopwatch.ms/1000
  let hours = Math.floor(time / 3600);
  let minutes = Math.floor(time / 60);
  if(hours > 0){
    minutes = minutes - hours * 60
  }
  let seconds = Math.floor(time - minutes * 60);
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
  inStreamEditStartTime = hours + ":" + minutes + ":" + seconds
  trimName = req.body.name.replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  inStreamEdit()
  inStreamMsg = trimName
  res.redirect('/labeling/' + outputName)
})

let inStreamEditEndTime = null

router.post('/labeling/:stream_name/trim_end', function (req, res, next) {
  let time = stopwatch.ms/1000
  let hours = Math.floor(time / 3600);
  let minutes = Math.floor(time / 60);
  if(hours > 0){
    minutes = minutes - hours * 60
  }
  let seconds = Math.floor(time - minutes * 60);
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
  inStreamEditEndTime = hours + ":" + minutes + ":" + seconds
  db_trims.insertTrim(trimName, inStreamEditStartTime, inStreamEditEndTime)
  killTrim()
  inStreamMsg = "Not recording"
  res.redirect('/labeling/' + outputName)
})

// logo stuff

router.get('/logo_setup', function (req, res, next) {
  setTimeout(function(){db_label.findLabels((err, labels) => {
    db_logo.findLogos((err, logo) => {
      if (err) {
        return res.sendStatus(500)
      }
      db_logo.findLogos((err, logo) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.render('logo', {name: outputName, logo_: logo, logosInUse: logosInUse, logoAltTime: altTime, horizontal: logoHorizontal, height: logoHeight, size: imgScale})
      })
    });
  },500);
  })
})

router.post('/upload', function(req, res) {
  let logo = req.files.logoUpload;
  console.log(req.files.logoUpload); // the uploaded file object
  logo.mv('./public/images/' + logo.name, function(err) {
    if (err)
      return res.status(500).send(err);
    db_logo.insertLogo(logo.name)
      res.redirect('/logo_setup')
  });
})

router.post('/delete_logo', function (req, res, next) {
  let logoObj = req.body.logoName
  let logoObjParsed = JSON.parse(logoObj)
  let logoString = logoObjParsed.logo
  console.log(logoString)
  db_logo.deleteLogo(logoString)
  res.redirect('/logo_setup')
})

router.post('/logo_setup/use_logos', function (req, res, next) {
  logosInUse = req.body.logo
  if(req.body.noLogo){
    logosInUse = 0
  }
  res.redirect('/logo_setup')
})

router.post('/logo_setup/logo_time', function (req, res, next) {
  altTime = req.body.time
  res.redirect("/logo_setup")
})

// video settings

router.get('/video_settings', function (req, res, next) {
  res.render('video_settings', {currentResolution: resolution, input: inputURL})
})

router.post('/change_resolution', function (req, res, next) {
  resolution = req.body.resolution
  console.log(resolution)
  res.redirect('video_settings')
})


module.exports = router