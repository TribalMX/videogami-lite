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
let streamAKDestinations = []
let streamCSDestinations = []
let entryPointsToStream = []
let scheduledTime = null
let scheduled = false
let signalStatus = "offline"

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
    entryPointsToStream = [];
    streamAKDestinations = [];
    streamCSDestinations = [];
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
let resolution = "1280:720"
let bitrate = "2500"

// formula for logo input
let formula = null
let listOfLogos = ''

let makeFormula = () => {
  let L = logosInUse.length
  let location = logoHorizontal + ":" + logoHeight
  let scale = imgScale

  let accr = altTime*2
  let accr2 = accr
  if(typeof logosInUse === 'string'){
    formula =  "scale=1290:720,setsar=1[ovrl0];[1]scale="+ scale+"[ovrl1]; [ovrl0][ovrl1] overlay=x=(main_w-overlay_w)/1.025:y=(main_h-overlay_h)/18"
    listOfLogos = ".input('./public/images/" + logosInUse
  } else {
    for(var i=0; i<(L + 1); i++) {
        if(i === 1){
            formula = "scale="+ resolution + ",setsar=1[ovrl0];"+"["+ i +"]scale="+ scale+"[ovrl" + i +"]; [ovrl0][ovrl" + i + "] overlay=x=(main_w-overlay_w)/1.025:y=(main_h-overlay_h)/18:enable='lt(mod(t,"+ (L * altTime)+"),"+ altTime+")'[v"+i+"];"
        }
        if(i === 2){
            formula = formula + "["+ i +"]scale="+ scale+"[ovrl" + i +"]; [v"+ (i - 1) +"][ovrl" + i + "] overlay=x=(main_w-overlay_w)/1.025:y=(main_h-overlay_h)/18:enable='between(mod(t,"+ (L * altTime)+"),"+ altTime+","+accr+")'[v"+i+"];"
        }
        if(i === 3){
            formula = formula + "["+ i +"]scale="+ scale+"[ovrl" + i +"]; [v"+ (i - 1) +"][ovrl" + i + "] overlay=x=(main_w-overlay_w)/1.025:y=(main_h-overlay_h)/18:enable='gt(mod(t,"+ (L * altTime)+"),"+ accr +")'[v"+i+"];"
        }
        if(i > 3){
            accr2 = accr2 + altTime
            formula = formula + "["+ i +"]scale="+ scale+"[ovrl" + i +"]; [v"+ (i - 1) +"][ovrl" + i + "] overlay=x=(main_w-overlay_w)/1.025:y=(main_h-overlay_h)/18:enable='gt(mod(t,"+ (L * altTime)+"),"+ accr2 +")'[v"+i+"];"
        }
    }
      formula = formula.slice(0, -5)
  }
}

// youtube
let stream = () => {
  dirPath = "./public/videos/cut-videos/" + outputName
  mkdirp(dirPath, function(err) { 
  console.log('directory made')
  })

  console.log("streaming started")
  var proc3 = new ffmpeg({ source: inputURL, timeout: 0 })
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    outputScreenShot()
    console.log('Error: ' + err.message);
    })
    .output('./public/videos/output/' + outputName + '.mp4', function(stdout, stderr) {
      console.log('Convert complete' +stdout)
    })

  if(logosInUse){
    for(n in entryPointsToStream){
      proc3 = proc3.output(entryPointsToStream[n])
      .addOption('-f', 'flv')
      .addOption('-vcodec', 'libx264')
      .addOption('-bufsize', '3000k')
      .addOption("-preset", "veryfast")
      .addOption('-acodec', 'aac')
      .addOption("-g", "60")
      .addOption('-keyint_min', "60")
      .withVideoBitrate(bitrate)
      .withAudioBitrate('128k')
    }
    if(typeof logosInUse === 'string'){
      proc3 = proc3.input('./public/images/' + logosInUse)
    } else {
      for(n in logosInUse){
        proc3 = proc3.input('./public/images/' + logosInUse[n])
      }
    }
      proc3 = proc3.complexFilter(formula)
    } else {
      for(n in entryPointsToStream){
        proc3 = proc3.output(entryPointsToStream[n])
        .addOption('-f', 'flv')
        .addOption('-vf', "scale=" +  resolution)
        .addOption('-vcodec', 'libx264')
        .addOption('-bufsize', '3000k')
        .addOption("-preset", "veryfast")
        .addOption('-acodec', 'aac')
        .addOption("-g", "60")
        .addOption('-keyint_min', "60")
        .withVideoBitrate(bitrate)
        .withAudioBitrate('128k')
      }
    }
    proc3.run()
  }


//  output screenshot

let outputScreenShot = () => {
  var proc = new ffmpeg({ source: './public/videos/output/' + outputName + '.mp4', timeout: 0 })
  .seekInput(5.0)
  .addOption('-vframes', '1')
  .addOption('-q:v', '2')
  .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
  .on('error', function(err) {
    console.log('Error: ' + err.message);
  })
  .output("./public/videos/screenshots/"+ outputName +'.jpg', function(stdout, stderr) {
  console.log('Convert complete' +stdout)
  })
  .on('end', function(stdout, stderr) {
    console.log('Transcoding succeeded !');
  });
  cmd.run("ffmpeg -ss 00:00:05 -i " + './public/videos/output/' + outputName + '.mp4' +" -vframes 1 -q:v 2 ./public/videos/screenshots/"+ outputName +'.jpg"')
  proc.run()
} 

//output mp4

let outputMp4 = () => {
var proc = new ffmpeg({ source: inputURL, timeout: 0 })
  .addOption('-vcodec', 'libx264')
  .addOption('-acodec', 'aac')
  .addOption('-crf', 26)
  .on('start', function(commandLine) {
  console.log('Query : ' + commandLine);
  })
  .on('error', function(err) {
    console.log('Error: ' + err.message);
    outputScreenShot()
  })
  .output('./public/videos/output/' + outputName + '.mp4', function(stdout, stderr) {
  console.log('Convert complete' +stdout)
})
  .on('end', function(stdout, stderr) {
    outputScreenShot()
    console.log('Transcoding succeeded !');
  });
  if(logosInUse){
    if(typeof logosInUse === 'string'){
      proc = proc.input('./public/images/' + logosInUse)
    } else {
    for(n in logosInUse){
      proc = proc.input('./public/images/' + logosInUse[n])
    }
  }
      proc = proc.complexFilter(formula)
    } else {
      proc = proc.addOption('-vf', "scale=" +  resolution)
    }
    proc.run()
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
let editOutputName = null

let edit = () => {
  console.log(duration)
  var proc2 = new ffmpeg({ source: './public/videos/output/' + editOutputName + '.mp4', timeout: 0 })
    .addOption('-ss', startTime)
    .addOption('-t', duration)
    .addOption('-c', 'copy')
    .on('start', function(commandLine) {
    console.log('Query : ' + commandLine);
    })
    .on('error', function(err) {
    console.log('Error: ' + err.message);
    })
    .saveToFile('./public/videos/cut-videos/' + editOutputName + '/' + trimName + '.mp4', function(stdout, stderr) {
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
    console.log('InError: ' + err.message);
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

/* GET home page. */
router.get('/streaming', function (req, res, next) {
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
          db_accounts.findAKoutlets((err, AKoutlets_) => {      
            if (err) {
              return res.sendStatus(500);
          }
            db_edit.getCollections((err, collectionNames) => {
              if (err) {
                return res.sendStatus(500)
              } 
              let nameArray = []
              for (var i = 0; i < collectionNames.length; i++) {
                nameArray.push(collectionNames[i].name)
              }
                db_accounts.findCSoutlets((err, CSoutlets_) => {      
                  if (err) {
                    return res.sendStatus(500);
                }      
              console.log(nameArray)
            res.render('index', { 
              collectionName: nameArray, 
              signal: signalStatus, 
              name: outputName, 
              CSoutlets: CSoutlets_,
              AKoutlets: AKoutlets_,
              JCoutlets: JCoutlets_, 
              streamStatus: streamStatus, 
              STVoutlets: STVoutlets_, 
              streamJCDestinations: streamJCDestinations, 
              streamSTVDestinations: streamSTVDestinations, 
              streamYTDestinations: streamYTDestinations, 
              streamFBDestinations: streamFBDestinations, 
              streamAKDestinations: streamAKDestinations,
              streamCSDestinations: streamCSDestinations,
              scheduleStatus: scheduled, 
              YToutlets: YToutlets_, 
              FBoutlets: FBoutlets_, 
              currentUrl: inputURL  })        
              })
          })
        })
      })
    }) 
  })
})
})

// stream settings

router.post('/start_stream', function (req, res, next) {
  console.log(req.body)
  outputName = req.body.name.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').replace(/,/g, '-').toLowerCase()
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
    signalStatus = "scheduled"
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
  var AKcreds = req.body.AKoutletCredentials 
  var CScreds = req.body.CSoutletCredentials  

  if(!YTcreds && !FBcreds && !STVcreds && !JCcreds && !AKcreds && !CScreds){
    outputMp4()
    signalStatus = "Converting"
    streamStatus = "Converting"
    res.redirect('/streaming/' + outputName)
  }

  if((YTcreds || FBcreds || STVcreds || JCcreds || AKcreds || CScreds) && !scheduled){
    stopwatch.start()
    if(logosInUse){
    makeFormula()
    }
    // outputMp4()
    streamStatus = "Live"
    signalStatus = "Live"

  // youtube
  if(typeof YTcreds === 'object'){
    YTcreds.forEach(function(YTrtmpKey) {
      let parsed = JSON.parse(YTrtmpKey)
      entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
      streamYTDestinations.push(parsed[1])
    });
  }
  if(typeof YTcreds === 'string'){
    let parsed = JSON.parse(YTcreds)
    entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
    streamYTDestinations.push(parsed[1])
  }

    // Akamai
    if(typeof AKcreds === 'object'){
      AKcreds.forEach(function(AKrtmp) {
        let parsed = JSON.parse(AKrtmp)
        entryPointsToStream.push(parsed[0])
        streamAKDestinations.push(parsed[1])
      });
    }
    if(typeof AKcreds === 'string'){
      let parsed = JSON.parse(AKcreds)
      entryPointsToStream.push(parsed[0])
      streamAKDestinations.push(parsed[1])
    }

  // Joicaster
    if(typeof JCcreds === 'object'){
      // console.log(YTcreds)
      JCcreds.forEach(function(JCrtmpKey) {
        let parsed = JSON.parse(JCrtmpKey)
        entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
        streamJCDestinations.push(parsed[1])
      });
    }
    if(typeof JCcreds === 'string'){
      let parsed = JSON.parse(JCcreds)
      entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
      streamJCDestinations.push(parsed[1])
    }
  // Facebook

  if(typeof FBcreds === 'object'){
    FBcreds.forEach(function(FBrtmpKey) {
      let parsed = JSON.parse(FBrtmpKey)
      entryPointsToStream.push(parsed[0])
      slicedNamed = parsed[1].slice(1,-1)
      streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      console.log(">>>>>" + JSON.stringify(streamFBDestinations))
    });
  }
  if(typeof FBcreds === 'string'){
      let parsed = JSON.parse(FBcreds)
      entryPointsToStream.push(parsed[0])
      slicedNamed = parsed[1].slice(1,-1)
      streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      console.log(">>>>>" + JSON.stringify(streamFBDestinations))
  }
  // Snappy TV

  if(typeof STVcreds === 'object'){
    STVcreds.forEach(function(STVrtmp) {
      let parsed = JSON.parse(STVrtmp)
      entryPointsToStream.push(parsed[1])
      streamSTVDestinations.push({name: parsed[0]})
      console.log(">>>>>" + JSON.stringify(streamSTVDestinations))
    });
  }
  if(typeof STVcreds === 'string'){
      let parsed = JSON.parse(STVcreds)
      entryPointsToStream.push(parsed[1])
      streamSTVDestinations.push({name: parsed[0]})
      console.log(">>>>>" + JSON.stringify(streamSTVDestinations))
  }
  res.redirect('/streaming/' + outputName)

  // custom
  if(typeof CScreds === 'object'){
    CScreds.forEach(function(CSrtmpKey) {
      let parsed = JSON.parse(CSrtmpKey)
      entryPointsToStream.push(parsed[0])
      streamCSDestinations.push(parsed[1])
    });
  }
  if(typeof CScreds === 'string'){
    let parsed = JSON.parse(CScreds)
    entryPointsToStream.push(parsed[0])
    streamCSDestinations.push(parsed[1])
  }
  stream()
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
          entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
          streamYTDestinations.push(parsed[1])
        });
      }
      if(typeof YTcreds === 'string'){
        let parsed = JSON.parse(YTcreds)
        entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
        streamYTDestinations.push(parsed[1])
      }
      // Akamai
      if(typeof AKcreds === 'object'){
        AKcreds.forEach(function(AKrtmp) {
          let parsed = JSON.parse(AKrtmp)
          entryPointsToStream.push(parsed[0])
          streamAKDestinations.push(parsed[1])
        });
      }
      if(typeof AKcreds === 'string'){
        let parsed = JSON.parse(AKcreds)
        entryPointsToStream.push(parsed[0])
        streamAKDestinations.push(parsed[1])
      }
      // Joicaster
      if(typeof JCcreds === 'object'){
        JCcreds.forEach(function(JCrtmpKey) {
          let parsed = JSON.parse(JCrtmpKey)
          entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
          streamJCDestinations.push(parsed[1])
        });
      }
      if(typeof JCcreds === 'string'){
        let parsed = JSON.parse(JCcreds)
        entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
        streamJCDestinations.push(parsed[1])
      }
      // Facebook
      if(typeof FBcreds === 'object'){
        FBcreds.forEach(function(FBrtmpKey) {
          let parsed = JSON.parse(FBrtmpKey)
          entryPointsToStream.push(parsed[0])
          slicedNamed = parsed[1].slice(1,-1)
          streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
        });
      }
      if(typeof FBcreds === 'string'){
        let parsed = JSON.parse(FBcreds)
        entryPointsToStream.push(parsed[0])
        slicedNamed = parsed[1].slice(1,-1)
        streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      }
      // Snappy TV
      if(typeof STVcreds === 'object'){
        STVcreds.forEach(function(STVrtmp) {
          let parsed = JSON.parse(STVrtmp)
          entryPointsToStream.push(parsed[1])
          streamSTVDestinations.push({name: parsed[0]})
        });
      }
      if(typeof STVcreds === 'string'){
        let parsed = JSON.parse(STVcreds)
        entryPointsToStream.push(parsed[1])
        streamSTVDestinations.push({name: parsed[0]})
      }
      // Custom
      if(typeof CScreds === 'object'){
        CScreds.forEach(function(CSrtmp) {
          let parsed = JSON.parse(CSrtmp)
          entryPointsToStream.push(parsed[0])
          streamCSDestinations.push({name: parsed[0]})
        });
      }
      if(typeof CScreds === 'string'){
        let parsed = JSON.parse(CScreds)
        entryPointsToStream.push(parsed[0])
        streamCSDestinations.push({name: parsed[0]})
      }

    scheduleStream = schedule.scheduleJob(date, function (err) {
      db_label.insertDoc(outputName)
      streamStatus = "Live"
      signalStatus = "Live"
      stopwatch.start()
      if(err){
        console.log(err)
      }
      console.log('stream started')
      outputMp4()
      stream()
      scheduleStream.cancel()
      scheduled = false
    })
    res.redirect('/streaming/' + outputName)
  }
})

//convert to mp4 only

router.post('/convert', function (req, res, next) {
  stopwatch.start()
  signalStatus = "Converting"
  outputName = req.body.name.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  db_label.insertDoc(outputName)
  if(logosInUse){
    makeFormula()
  }
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
    res.redirect('/streaming/' + outputName)
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
  signalStatus = "offline"
  res.redirect('/')
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
          db_accounts.findAKoutlets((err, AKoutlets_) => {      
            if (err) {
              return res.sendStatus(500);
          }      
            db_accounts.findCSoutlets((err, CSoutlets_) => {      
              if (err) {
                return res.sendStatus(500);
            }      
        res.render('accounts', {
          signal: signalStatus, 
          CSoutlets: CSoutlets_, 
          YToutlets: YToutlets_, 
          AKoutlets: AKoutlets_, 
          JCoutlets: JCoutlets_, 
          FBoutlets: FBoutlets_, 
          STVoutlets: STVoutlets_ })
          })
        })
      }) 
    }) 
  },500); 
  })
})
})  

router.post('/setup_accounts/remove_outlet', function (req, res, next) {
  let removeID = req.body.outletID
  console.log(removeID)
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
router.post('/setup_accounts/setup_akamai', function (req, res, next) {
  let AKurl = req.body.AKurl
  let AKstreamName = req.body.AKstreamName
  let AKuserNumber = req.body.AKuserNumber
  let AKpassword = req.body.AKpassword
  let AKoutletName = req.body.AKname

  let AKrtmp = "rtmp://"+AKuserNumber+":"+AKpassword+"@"+AKurl.slice(7)+"/"+AKstreamName
  console.log(AKrtmp)

  db_accounts.insertAkamaiOutlet(
    AKoutletName, 
    AKrtmp, 
    AKurl, 
    AKstreamName, 
    AKuserNumber, 
    AKpassword)
  res.redirect('/setup_accounts')
})

router.post('/setup_accounts/setup_custom', function (req, res, next) {
  let CSrtmp = req.body.CSRtmp
  let CSname = req.body.CSname

  db_accounts.insertCustomOutlet(CSname, CSrtmp)
  res.redirect('/setup_accounts')
})

// Hls input

router.post('/input', function (req, res, next) {
  inputURL = req.body.input
  res.redirect('/streaming')
})

// stop all ffmpeg tasks

router.get('/stop', function (req, res, next) {
  stop()
  signalStatus = "offline"
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
      res.render('editing_station', {signal: signalStatus, collections: collectionNames})
    })
  }) },500);   
})

router.get('/editing_station/:collection_name', function (req, res, next) {
  let collectionName = req.params.collection_name

  db_trims.locateDoc(collectionName)
  db_label.locateDoc(collectionName)

  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) 
        return res.sendStatus(500);

    db_trims.findTrims((err, trims_) => {
        if (err)
            return res.sendStatus(500);         
        res.render('editing', {
          signal: signalStatus, 
          name: collectionName, 
          label: labels, 
          trims: trims_, 
          startTime: labelStartTime, 
          endTime: labelEndTime})
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
  signalStatus = "offline"
  db_trims.locateDoc(req.params.stream_name)
  db_label.locateDoc(req.params.stream_name)
  let editName = req.params.stream_name
  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {
        signal: signalStatus, 
        name: editName, 
        label: labels, 
        trims: trims_, 
        startTime: labelStartTime, 
        endTime: labelEndTime})
    }) 
  })   
  },500);
})

router.get('/editing_station/:stream_name', function (req, res, next) {
  db_trims.locateDoc(req.params.stream_name)
  db_label.locateDoc(req.params.stream_name)
  let editName = req.params.stream_name
  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.render('editing', {signal: signalStatus, name: editName, label: labels, trims: trims_, startTime: labelStartTime, endTime: labelEndTime})
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
  editOutputName = req.params.stream_name
  edit()

  setTimeout(function(){db_label.findLabels((err, labels) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_trims.findTrims((err, trims_) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.redirect('/editing_station/' + req.params.stream_name)
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
  console.log(req.params.stream_name)
  res.redirect('/editing_station/' + req.params.stream_name)
})

router.post('/editing/:stream_name/delete_label', function (req, res, next) {
  let id = req.body.labelName
  db_label.deleteLabel(id)
  res.redirect('/editing_station/'+ req.params.stream_name)  
})

router.post('/editing/:stream_name/add_start_time', function (req, res, next) {
  let unCutLabelStartTime = req.body.startTime.substr(1).slice(41, -1).replace(/['"]+/g, '')
  let sliceLength = unCutLabelStartTime.length - 8
  labelStartTime = unCutLabelStartTime.slice(sliceLength)
  res.redirect('/editing_station/' + req.params.stream_name)  
})
router.post('/editing/:stream_name/add_end_time', function (req, res, next) {
  let unCutLabelEndTime = req.body.endTime.substr(1).slice(41, -1).replace(/['"]+/g, '')
  let sliceLength = unCutLabelEndTime.length - 8
  labelEndTime = unCutLabelEndTime.slice(sliceLength)
      res.redirect('/editing_station/' + req.params.stream_name)  
})

router.post('/editing/:stream_name/deleteTrim', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim
  let trimIdToDelete = req.body.deleteTrimId
  db_trims.deleteTrim(trimToDelete, trimIdToDelete)
  res.redirect('/editing_station/' + req.params.stream_name)
})

router.post('/editing/:stream_name/downloadTrim', function (req, res, next) {
  let trimName = req.body.trimName
  var file = './public/videos/cut-videos/' + req.params.stream_name + '/' + trimName + '.mp4';
  res.download(file); // Set disposition and send it.
})


// streaming page


router.get('/streaming/:stream_name', function (req, res, next) {
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
      res.render('streaming', {
        signal: signalStatus, 
        name: outputName, 
        inStreamEditName: inStreamMsg,
        input: inputURL,
        label: labels, 
        trims: trims_, 
        date: streamStatus, 
        terminate: stopSign, 
        streamJCDestinations: streamJCDestinations, 
        streamSTVDestinations: streamSTVDestinations,
        streamFBDestinations: streamFBDestinations, 
        streamYTDestinations: streamYTDestinations, 
        streamCSDestinations: streamCSDestinations, 
        streamAKDestinations: streamAKDestinations})
    }) 
  })   
  },1000); 
})

router.post('/streaming/:stream_name/add_label', function (req, res, next) {
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
router.post('/streaming/:stream_name/deleteTrim', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim
  let trimIdToDelete = req.body.deleteTrimId
  db_trims.deleteTrim(trimToDelete, trimIdToDelete)
  res.redirect('/streaming/' + outputName)
})

router.get('/labels/refresh', function (req, res, next) {
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.send(labels)
    })
})


router.get('/streaming/:stream_name/refresh', function (req, res, next) {
  res.redirect('/streaming/' + outputName)
})

router.post('/streaming/:stream_name/trim_start', function (req, res, next) {
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
  res.redirect('/streaming/' + outputName)
})

let inStreamEditEndTime = null

router.post('/streaming/:stream_name/trim_end', function (req, res, next) {
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
  res.redirect('/streaming/' + outputName)
})

// logo stuff

router.post('/video_settings/upload', function(req, res) {
  let logo = req.files.logoUpload;
  console.log(req.files.logoUpload); // the uploaded file object
  logo.mv('./public/images/' + logo.name, function(err) {
    if (err)
      return res.status(500).send(err);
    db_logo.insertLogo(logo.name)
      res.redirect('/video_settings')
  });
})

router.post('/video_settings/delete_logo', function (req, res, next) {
  let logoObj = req.body.logoName
  let logoObjParsed = JSON.parse(logoObj)
  let logoString = logoObjParsed.logo
  console.log(logoString)
  db_logo.deleteLogo(logoString)
  res.redirect('/video_settings')
})

router.post('/video_settings/use_logos', function (req, res, next) {
  logosInUse = req.body.logo
  if(req.body.noLogo){
    logosInUse = 0
  }
  res.redirect('/video_settings')
})

router.post('/video_settings/logo_time', function (req, res, next) {
  altTime = req.body.time
  res.redirect("/video_settings")
})

router.post('/video_settings/imgScale', function (req, res, next) {
  imgScale = req.body.logoSize
  res.redirect('/video_settings')
})

// video settings

router.get('/video_settings', function (req, res, next) {
  setTimeout(function(){db_label.findLabels((err, labels) => {
    db_logo.findLogos((err, logo) => {
      if (err) {
        return res.sendStatus(500)
      }
      db_logo.findLogos((err, logo) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.render('video_settings', {signal: signalStatus, bitrate: bitrate, currentResolution: resolution, input: inputURL, name: outputName, logo_: logo, logosInUse: logosInUse, logoAltTime: altTime, horizontal: logoHorizontal, height: logoHeight, size: imgScale})
      })
    });
  },500);
  })
})

router.post('/video_settings/change_resolution', function (req, res, next) {
  resolution = req.body.resolution
  bitrate = req.body.bitrate_
  console.log(bitrate)
  res.redirect('/video_settings')
})

router.get('/', function (req, res, next) {
  res.render('frontpage', {signal: signalStatus})
})    


router.get('/goToStreamingPage', function (req, res, next) {
  res.redirect('/streaming/' + outputName)
})

// router.get('/test', function (req, res, next) {
//   outputScreenShot()
//   res.redirect('/streaming')
// })

module.exports = router