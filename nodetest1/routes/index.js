const express = require('express')
const router = express.Router()

// database functions

const db_label = require('./db/labels.js')
const db_logo = require('./db/logos.js')
const db_trims = require('./db/trims.js')
const db_edit = require('./db/editing_station.js')
const db_accounts = require('./db/accounts.js')

// packages
const schedule = require('node-schedule')
const Stopwatch = require('timer-stopwatch')
const fileUpload = require('express-fileupload')
const cmd = require('node-cmd')
const mkdirp = require('mkdirp')
var ffmpeg = require('fluent-ffmpeg')

// stream status

let streamStatus = 'Not Streaming and no Scheduled streams'
let streamFBDestinations = []
let streamYTDestinations = []
let streamSTVDestinations = []
let streamJCDestinations = []
let streamAKDestinations = []
let streamCSDestinations = []
let entryPointsToStream = []
let overlay = []
let scheduledTime = null
let scheduled = false
let signalStatus = 'offline'

// upload

router.use(fileUpload())

// this is to stop all ffmpeg activity

let scheduleStream = null

let stop = () => {
  if (scheduled) {
    streamStatus = 'Scheduled on stream at: ' + scheduledTime
  } else {
    streamStatus = 'Not Streaming and no scheduled streams'
    streamFBDestinations = []
    streamYTDestinations = []
    streamSTVDestinations = []
    streamJCDestinations = []
    entryPointsToStream = []
    streamAKDestinations = []
    streamCSDestinations = []
    complexFilter = ''
  }
  stopwatch.stop()
  stopwatch.reset()
  cmd.run('killall ffmpeg')
  setTimeout(function () {
    outputScreenShot()
  }, 1500)
}

// input urls
let inputURL = 'http://184.72.239.149/vod/smil:BigBuckBunny.smil/playlist.m3u8'

// stopwatch
let stopwatch = new Stopwatch()

// stream name
let outputName = 'stream'
let resolution = '1280:720'
let bitrate = '2500'

// let listOfLogos = ''

//  output screenshot

let outputScreenShot = () => {
  var proc = new ffmpeg({ source: './public/videos/output/' + outputName + '.mp4', timeout: 0 })
    .seekInput(5.0)
    .addOption('-vframes', '1')
    .addOption('-q:v', '2')
    .on('start', function (commandLine) {
      console.log('Query : ' + commandLine)
    })
    .on('error', function (err) {
      console.log('Error: ' + err.message)
    })
    .output('./public/videos/screenshots/' + outputName + '.jpg', function (stdout, stderr) {
      console.log('Convert complete' + stdout)
    })
    .on('end', function (stdout, stderr) {
      console.log('Transcoding succeeded !')
    })
  cmd.run('ffmpeg -ss 00:00:05 -i ' + './public/videos/output/' + outputName + '.mp4' + ' -vframes 1 -q:v 2 ./public/videos/screenshots/' + outputName + '.jpg"')
  proc.run()
}

let outputMp4 = () => {
  let mp4Command = null
  if (overlay.length === 0) {
    mp4Command = 'ffmpeg -y \
    -re -i ' + inputURL + ' \
    -c:a aac -b:a 128k \
    -c:v libx264 -b:v 2500k -bufsize 9000k -maxrate 4000k \
    -preset ultrafast -g 60 -keyint_min 60 \
    -x264-params keyint=60:keyint-min=60:vbv-maxrate=3000:vbv-bufsize=9000 \
    -f mp4 ./public/videos/output/' + outputName + '.mp4'
  } else {
    mp4Command = 'ffmpeg -y \
    -re -i ' + inputURL + ' \
    ' + complexFilter + '\
    " -map [outv' + overlay.length + '] -map 0:1 \
    -c:a aac -b:a 128k \
    -c:v libx264 -b:v 2500k -bufsize 9000k -maxrate 4000k \
    -preset ultrafast -g 60 -keyint_min 60 \
    -x264-params keyint=60:keyint-min=60:vbv-maxrate=3000:vbv-bufsize=9000 \
    -f mp4 ./public/videos/output/' + outputName + '.mp4'
  }
  console.log(mp4Command)
  cmd.run(mp4Command)
}

let complexFilter = ''

let makeCommand = () => {
  for (var i = 0; i < overlay.length; i++) {
    complexFilter = complexFilter + ' -i ./public/overlays/' + overlay[i]
  }

  complexFilter = complexFilter + ' -filter_complex '

  for (var n = 0; n < overlay.length; n++) {
    if (n === 0) {
      complexFilter = complexFilter + '"[0:v][1:v]overlay=eof_action=pass[outv1];'
    } else {
      complexFilter = complexFilter + '[outv' + n + '][' + (n + 1) + ':v]overlay=eof_action=pass[outv' + (n + 1) + '];'
    }
  }
  complexFilter = complexFilter.slice(0, -1)
}

// stream command
let stream = () => {
  let dirPath = './public/videos/cut-videos/' + outputName
  mkdirp(dirPath, function (err) {
    if (err) {
      console.log(err)
    }
    console.log('directory made')
  })
  makeCommand()
  if (entryPointsToStream.length === 0) {
  } else if (overlay.length === 0) {
    for (let n in entryPointsToStream) {
      let ffmpegCommand = 'ffmpeg -y \
      -re -i ' + inputURL + ' \
      -c:a aac -b:a 128k \
      -c:v libx264 -b:v 2500k -bufsize 9000k -maxrate 4000k \
      -preset ultrafast -g 60 -keyint_min 60 \
      -x264-params keyint=60:keyint-min=60:vbv-maxrate=3000:vbv-bufsize=9000 \
      -f flv ' + entryPointsToStream[n]
      console.log('Query: ' + ffmpegCommand)
      cmd.run(ffmpegCommand)
    }
  } else {
    for (let n in entryPointsToStream) {
      let ffmpegCommand = 'ffmpeg -y \
      -re -i ' + inputURL + ' \
      ' + complexFilter + '\
      " -map [outv' + overlay.length + '] -map 0:1 \
      -c:a aac -b:a 128k \
      -c:v libx264 -b:v 2500k -bufsize 9000k -maxrate 4000k \
      -preset ultrafast -g 60 -keyint_min 60 \
      -x264-params keyint=60:keyint-min=60:vbv-maxrate=3000:vbv-bufsize=9000 \
      -f flv ' + entryPointsToStream[n]

      console.log('Query: ' + ffmpegCommand)
      cmd.run(ffmpegCommand)
    }
  }
  outputMp4()
}

// this is for trimming the video with start and end time

let startTime = '00:00:00'
let duration = '00:00:01'
let trimName = 'example'
let inStreamMsg = 'not recording'
let editOutputName = null

let edit = () => {
  console.log(duration)
  let proc2 = new ffmpeg({ source: './public/videos/output/' + editOutputName + '.mp4', timeout: 0 })
    .addOption('-ss', startTime)
    .addOption('-t', duration)
    .addOption('-c', 'copy')
    .on('start', function (commandLine) {
      console.log('Query : ' + commandLine)
    })
    .on('error', function (err) {
      console.log('Error: ' + err.message)
    })
    .saveToFile('./public/videos/cut-videos/' + editOutputName + '/' + trimName + '.mp4', function (stdout, stderr) {
      console.log('Convert complete' + stdout)
    })
  proc2.run()
}

// logo stuff

router.post('/video_settings/upload', function (req, res) {
  let logo = req.files.logoUpload
  console.log(req.files.logoUpload) // the uploaded file object
  logo.mv('./public/overlays/' + logo.name, function (err) {
    if (err) { return res.status(500).send(err) }
    db_logo.insertLogo(logo.name)
    res.redirect('/video_settings')
  })
})

router.post('/video_settings/delete_logo', function (req, res, next) {
  let logoObj = req.body.logoName
  let logoObjParsed = JSON.parse(logoObj)
  let logoString = logoObjParsed.logo
  console.log(logoString)
  db_logo.deleteLogo(logoString)
  setTimeout(function () {
    res.redirect('/video_settings')
  }, 1000)
})

// instream edit
let inStreamEdit = () => {
  var proc2 = new ffmpeg({ source: inputURL, timeout: 0 })
    .addOption('-vcodec', 'libx264')
    .addOption('-acodec', 'aac')
    .addOption('-crf', 26)
    // .addOption('-aspect', '640:360')
    // .withSize('640x360')
    .addOption('-vf', 'scale=' + resolution)
    .on('start', function (commandLine) {
      console.log('Query =) : ' + commandLine)
    })
    .on('error', function (err) {
      console.log('InError: ' + err.message)
    })
    .saveToFile('./public/videos/cut-videos/' + outputName + '/' + trimName + '.mp4', function (stdout, stderr) {
      console.log('Convert complete' + stdout)
    })
}

let killTrim = () => {
  console.log('kill "$(pgrep -f ' + trimName + '.mp4)"')
  // cmd.run('kill "$(pgrep -f ' + trimName + '.mp4)"')
  cmd.run('for a in $(pgrep -f ' + trimName + '.mp4); do kill $a; done', (err, data, std) => { console.log('err', err); console.log('out', data); console.log('stderr', std) })
  trimName = null
}

/* GET home page. */
router.get('/streaming', function (req, res, next) {
  labelStartTime = ''
  labelEndTime = ''

  db_accounts.findYToutlets((err, YToutlets_) => {
    if (err) {
      return res.sendStatus(500)
    }
    db_accounts.findFBoutlets((err, FBoutlets_) => {
      if (err) {
        return res.sendStatus(500)
      }
      db_accounts.findSTVoutlets((err, STVoutlets_) => {
        if (err) {
          return res.sendStatus(500)
        }
        db_accounts.findJCoutlets((err, JCoutlets_) => {
          if (err) {
            return res.sendStatus(500)
          }
          db_accounts.findAKoutlets((err, AKoutlets_) => {
            if (err) {
              return res.sendStatus(500)
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
                  return res.sendStatus(500)
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
                  currentUrl: inputURL })
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

  if (month < 9) {
    prettyMonth = '0' + month
  }
  if (day < 9) {
    prettyDay = '0' + day
  }
  if (hour < 9) {
    prettyHour = '0' + hour
  }
  if (minute < 9) {
    prettyMinute = '0' + minute
  }

  if (month && day && hour && minute) {
    scheduled = true
    signalStatus = 'scheduled'
  }

  let stopSign = null
  if (scheduled) {
    stopSign = 'Cancel scheduled Stream'
  } else {
    stopSign = 'End Stream'
  }

  var YTcreds = req.body.YToutletCredentials
  var FBcreds = req.body.FBoutletCredentials
  var STVcreds = req.body.STVoutletCredentials
  var JCcreds = req.body.JCoutletCredentials
  var AKcreds = req.body.AKoutletCredentials
  var CScreds = req.body.CSoutletCredentials

  if (!YTcreds && !FBcreds && !STVcreds && !JCcreds && !AKcreds && !CScreds) {
    signalStatus = 'Converting'
    streamStatus = 'Converting'
    stream()
    stopwatch.start()
    res.redirect('/streaming/' + outputName)
  }

  if ((YTcreds || FBcreds || STVcreds || JCcreds || AKcreds || CScreds) && !scheduled) {
    stopwatch.start()
    // if (logosInUse) {
    //   makeFormula()
    // }
    streamStatus = 'Live'
    signalStatus = 'Live'

    // youtube
    if (typeof YTcreds === 'object') {
      YTcreds.forEach(function (YTrtmpKey) {
        let parsed = JSON.parse(YTrtmpKey)
        entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
        streamYTDestinations.push(parsed[1])
      })
    }
    if (typeof YTcreds === 'string') {
      let parsed = JSON.parse(YTcreds)
      entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
      streamYTDestinations.push(parsed[1])
    }

    // Akamai
    if (typeof AKcreds === 'object') {
      AKcreds.forEach(function (AKrtmp) {
        let parsed = JSON.parse(AKrtmp)
        entryPointsToStream.push(parsed[0])
        streamAKDestinations.push(parsed[1])
      })
    }
    if (typeof AKcreds === 'string') {
      let parsed = JSON.parse(AKcreds)
      entryPointsToStream.push(parsed[0])
      streamAKDestinations.push(parsed[1])
    }

    // Joicaster
    if (typeof JCcreds === 'object') {
      // console.log(YTcreds)
      JCcreds.forEach(function (JCrtmpKey) {
        let parsed = JSON.parse(JCrtmpKey)
        entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
        streamJCDestinations.push(parsed[1])
      })
    }
    if (typeof JCcreds === 'string') {
      let parsed = JSON.parse(JCcreds)
      entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
      streamJCDestinations.push(parsed[1])
    }
    // Facebook

    if (typeof FBcreds === 'object') {
      FBcreds.forEach(function (FBrtmpKey) {
        let parsed = JSON.parse(FBrtmpKey)
        entryPointsToStream.push(parsed[0])
        let slicedNamed = parsed[1].slice(1, -1)
        streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
        console.log('>>>>>' + JSON.stringify(streamFBDestinations))
      })
    }
    if (typeof FBcreds === 'string') {
      let parsed = JSON.parse(FBcreds)
      entryPointsToStream.push(parsed[0])
      let slicedNamed = parsed[1].slice(1, -1)
      streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      console.log('>>>>>' + JSON.stringify(streamFBDestinations))
    }
    // Snappy TV

    if (typeof STVcreds === 'object') {
      STVcreds.forEach(function (STVrtmp) {
        let parsed = JSON.parse(STVrtmp)
        entryPointsToStream.push(parsed[1])
        streamSTVDestinations.push({name: parsed[0]})
        console.log('>>>>>' + JSON.stringify(streamSTVDestinations))
      })
    }
    if (typeof STVcreds === 'string') {
      let parsed = JSON.parse(STVcreds)
      entryPointsToStream.push(parsed[1])
      streamSTVDestinations.push({name: parsed[0]})
      console.log('>>>>>' + JSON.stringify(streamSTVDestinations))
    }
    res.redirect('/streaming/' + outputName)

    // custom
    if (typeof CScreds === 'object') {
      CScreds.forEach(function (CSrtmpKey) {
        let parsed = JSON.parse(CSrtmpKey)
        entryPointsToStream.push(parsed[0])
        streamCSDestinations.push(parsed[1])
      })
    }
    if (typeof CScreds === 'string') {
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
    streamStatus = 'schedule for ' + prettyDay + '/' + prettyMonth + '/2018 at ' + prettyHour + ':' + prettyMinute

    // setting destinations
    if (typeof YTcreds === 'object') {
      YTcreds.forEach(function (YTrtmpKey) {
        let parsed = JSON.parse(YTrtmpKey)
        entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
        streamYTDestinations.push(parsed[1])
      })
    }
    if (typeof YTcreds === 'string') {
      let parsed = JSON.parse(YTcreds)
      entryPointsToStream.push('rtmp://a.rtmp.youtube.com/live2/' + parsed[0])
      streamYTDestinations.push(parsed[1])
    }
    // Akamai
    if (typeof AKcreds === 'object') {
      AKcreds.forEach(function (AKrtmp) {
        let parsed = JSON.parse(AKrtmp)
        entryPointsToStream.push(parsed[0])
        streamAKDestinations.push(parsed[1])
      })
    }
    if (typeof AKcreds === 'string') {
      let parsed = JSON.parse(AKcreds)
      entryPointsToStream.push(parsed[0])
      streamAKDestinations.push(parsed[1])
    }
    // Joicaster
    if (typeof JCcreds === 'object') {
      JCcreds.forEach(function (JCrtmpKey) {
        let parsed = JSON.parse(JCrtmpKey)
        entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
        streamJCDestinations.push(parsed[1])
      })
    }
    if (typeof JCcreds === 'string') {
      let parsed = JSON.parse(JCcreds)
      entryPointsToStream.push('rtmp://ingest-cn-tor.switchboard.zone/live/' + parsed[0])
      streamJCDestinations.push(parsed[1])
    }
    // Facebook
    if (typeof FBcreds === 'object') {
      FBcreds.forEach(function (FBrtmpKey) {
        let parsed = JSON.parse(FBrtmpKey)
        entryPointsToStream.push(parsed[0])
        let slicedNamed = parsed[1].slice(1, -1)
        streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
      })
    }
    if (typeof FBcreds === 'string') {
      let parsed = JSON.parse(FBcreds)
      entryPointsToStream.push(parsed[0])
      let slicedNamed = parsed[1].slice(1, -1)
      streamFBDestinations.push({name: slicedNamed, id: parsed[2]})
    }
    // Snappy TV
    if (typeof STVcreds === 'object') {
      STVcreds.forEach(function (STVrtmp) {
        let parsed = JSON.parse(STVrtmp)
        entryPointsToStream.push(parsed[1])
        streamSTVDestinations.push({name: parsed[0]})
      })
    }
    if (typeof STVcreds === 'string') {
      let parsed = JSON.parse(STVcreds)
      entryPointsToStream.push(parsed[1])
      streamSTVDestinations.push({name: parsed[0]})
    }
    // Custom
    if (typeof CScreds === 'object') {
      CScreds.forEach(function (CSrtmp) {
        let parsed = JSON.parse(CSrtmp)
        entryPointsToStream.push(parsed[0])
        streamCSDestinations.push({name: parsed[0]})
      })
    }
    if (typeof CScreds === 'string') {
      let parsed = JSON.parse(CScreds)
      entryPointsToStream.push(parsed[0])
      streamCSDestinations.push({name: parsed[0]})
    }

    scheduleStream = schedule.scheduleJob(date, function (err) {
      db_label.insertDoc(outputName)
      streamStatus = 'Live'
      signalStatus = 'Live'
      stopwatch.start()
      if (err) {
        console.log(err)
      }
      console.log('scheduled stream started')
      stream()
      scheduleStream.cancel()
      scheduled = false
    })
    res.redirect('/streaming/' + outputName)
  }
})

// convert to mp4 only

router.post('/convert', function (req, res, next) {
  stopwatch.start()
  signalStatus = 'Converting'
  outputName = req.body.name.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  db_label.insertDoc(outputName)
  outputMp4()
  streamStatus = 'Converting'
  let stopSign = null
  if (scheduled) {
    stopSign = 'Cancel scheduled Stream'
  } else if (streamStatus === 'Converting') {
    stopSign = 'End Conversion'
  } else if (!scheduled) {
    stopSign = 'End Stream'
  }
  setTimeout(function () {
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      res.redirect('/streaming/' + outputName)
    })
  }, 500)
})

// cancel scheduled task

router.post('/cancelstream', function (req, res, next) {
  console.log('canceled')
  scheduledTime = null
  scheduled = false
  db_edit.removeCollection(outputName)
  scheduleStream.cancel()
  stop()
  signalStatus = 'offline'
  res.redirect('/')
})

// Outlet setup

router.get('/setup_accounts', function (req, res, next) {
  setTimeout(function () {
    db_accounts.findYToutlets((err, YToutlets_) => {
      if (err) {
        return res.sendStatus(500)
      }
      db_accounts.findFBoutlets((err, FBoutlets_) => {
        if (err) {
          return res.sendStatus(500)
        }
        db_accounts.findSTVoutlets((err, STVoutlets_) => {
          if (err) {
            return res.sendStatus(500)
          }
          db_accounts.findJCoutlets((err, JCoutlets_) => {
            if (err) {
              return res.sendStatus(500)
            }
            db_accounts.findAKoutlets((err, AKoutlets_) => {
              if (err) {
                return res.sendStatus(500)
              }
              db_accounts.findCSoutlets((err, CSoutlets_) => {
                if (err) {
                  return res.sendStatus(500)
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
      }, 500)
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
  let YTrtmpKey = req.body.YTRtmpKey
  let YTstreamName = req.body.YTname
  db_accounts.insertYoutubeOutlet(YTstreamName, YTrtmpKey)
  res.redirect('/setup_accounts')
})

router.post('/setup_accounts/setup_joicaster', function (req, res, next) {
  let JCrtmpKey = req.body.JCRtmpKey
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
  let STVpublishP = req.body.STVpublishP
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

  let AKrtmp = 'rtmp://' + AKuserNumber + ':' + AKpassword + '@' + AKurl.slice(7) + '/' + AKstreamName
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
  signalStatus = 'offline'
  console.log('all ffmpeg processes aborted')
  res.redirect('/')
})

// editing station

router.get('/editing_station', function (req, res, next) {
  setTimeout(function () {
    db_label.findLabels((err, labels) => {
      if (err) {
        console.log(err)
      }
      db_edit.getCollections((err, collectionNames) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.render('editing_station', {signal: signalStatus, collections: collectionNames})
      })
    })
  }, 500)
})

router.get('/editing_station/:collection_name', function (req, res, next) {
  let collectionName = req.params.collection_name

  db_trims.locateDoc(collectionName)
  db_label.locateDoc(collectionName)

  setTimeout(function () {
    db_label.findLabels((err, labels) => {
      if (err) { return res.sendStatus(500) }

      db_trims.findTrims((err, trims_) => {
        if (err) { return res.sendStatus(500) }
        res.render('editing', {
          signal: signalStatus,
          name: collectionName,
          label: labels,
          trims: trims_,
          startTime: labelStartTime,
          endTime: labelEndTime})
      })
    })
  }, 500)
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
  signalStatus = 'offline'
  db_trims.locateDoc(req.params.stream_name)
  db_label.locateDoc(req.params.stream_name)
  let editName = req.params.stream_name
  setTimeout(function () {
    db_label.findLabels((err, labels) => {
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
  }, 500)
})

router.get('/editing_station/:stream_name', function (req, res, next) {
  db_trims.locateDoc(req.params.stream_name)
  db_label.locateDoc(req.params.stream_name)
  let editName = req.params.stream_name
  setTimeout(function () {
    db_label.findLabels((err, labels) => {
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
  }, 500)
})

router.post('/editing/:stream_name/trim', function (req, res, next) {
  startTime = req.body.startTime
  let endTimeInput = req.body.endTime
  trimName = req.body.cutName.toString().replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()

  let cutDurationHour = parseInt(endTimeInput.slice(0, -6))
  let cutDurationMinute = parseInt(endTimeInput.slice(3, -3))
  let cutDurationSeconds = parseInt(endTimeInput.slice(6))
  let durationInSeconds = (cutDurationHour * 3600) + (cutDurationMinute * 60) + cutDurationSeconds

  let cutStartHour = parseInt(startTime.slice(0, -6))
  let cutStartMinute = parseInt(startTime.slice(3, -3))
  let cutStartSeconds = parseInt(startTime.slice(6))
  let startTimeInSeconds = (cutStartHour * 3600) + (cutStartMinute * 60) + cutStartSeconds

  let inputDuration = durationInSeconds - startTimeInSeconds
  console.log('inputDuration' + inputDuration)
  console.log('duration in seconds:' + durationInSeconds)
  console.log('startTime in seconds:' + startTimeInSeconds)
  inputDuration = inputDuration.toString()

  String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10) // don't forget the second param
    var hours = Math.floor(sec_num / 3600)
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60)
    var seconds = sec_num - (hours * 3600) - (minutes * 60)

    if (hours < 10) { hours = '0' + hours }
    if (minutes < 10) { minutes = '0' + minutes }
    if (seconds < 10) { seconds = '0' + seconds }
    return hours + ':' + minutes + ':' + seconds
  }
  duration = inputDuration.toHHMMSS()
  db_trims.insertTrim(trimName, startTime, endTimeInput)
  editOutputName = req.params.stream_name
  edit()

  setTimeout(function () {
    db_label.findLabels((err, labels) => {
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
  }, 2000)
})

router.post('/editing/:stream_name/downloadWhole', function (req, res, next) {
  var file = './public/videos/output/' + req.body.wholeStream + '.mp4'
  res.download(file) // Set disposition and send it.
})

router.post('/editing/:stream_name/addLabel', function (req, res, next) {
  let newLabel = req.body.newLabel
  let newLabelTime = req.body.newLabelTime
  db_label.insertLabel(newLabel, newLabelTime)
  res.redirect('/editing_station/' + req.params.stream_name)
})

router.post('/editing/:stream_name/delete_label', function (req, res, next) {
  let id = req.body.labelName
  db_label.deleteLabel(id)
  res.redirect('/editing_station/' + req.params.stream_name)
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

router.post('/editing/:cutName/deleteTrimByName', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim
  let sessionName = req.body.stream_name
  console.log(sessionName)
  db_trims.deleteTrimByName(trimToDelete)
  res.redirect('/editing_station/' + sessionName)
})
router.post('/editing/:cutName/deleteLabelByName', function (req, res, next) {
  let labelName = req.body.newLabel
  let labelTime = req.body.newLabelTime
  let labelObject = labelName + ': ' + labelTime
  let sessionName = req.body.stream_name
  console.log(">>>>" + labelObject)
  db_label.deleteLabelByName(labelObject)
  res.redirect('/editing_station/' + sessionName)
})
router.post('/streaming/:cutName/deleteTrimByName', function (req, res, next) {
  let trimToDelete = req.body.deleteTrim.slice(0, -1)
  console.log(trimToDelete)
  db_trims.deleteTrimByName(trimToDelete)
  res.redirect('/streaming/' + outputName)
})

router.post('/editing/:stream_name/downloadTrim', function (req, res, next) {
  let trimName = req.body.trimName
  var file = './public/videos/cut-videos/' + req.params.stream_name + '/' + trimName + '.mp4'
  res.download(file) // Set disposition and send it.
})

// streaming page

router.get('/streaming/:stream_name', function (req, res, next) {
  outputName = req.params.stream_name
  db_trims.locateDoc(outputName)
  db_label.locateDoc(outputName)
  let stopSign = null
  if (scheduled) {
    stopSign = 'Cancel scheduled Stream'
  } else if (streamStatus === 'Converting') {
    stopSign = 'End Conversion'
  } else if (!scheduled) {
    stopSign = 'End Stream'
  }

  setTimeout(function () {
    db_label.findLabels((err, labels) => {
      if (err) {
        return res.sendStatus(500)
      }
      db_trims.findTrims((err, trims_) => {
        if (err) { return res.sendStatus(500) }
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
  }, 1000)
})

router.post('/streaming/:stream_name/add_label', function (req, res, next) {
  let labelName = req.body.label

  let time = stopwatch.ms / 1000
  let hours = Math.floor(time / 3600)
  let minutes = Math.floor(time / 60)
  if (minutes > 60) {
    minutes = minutes - 60
  }
  if (hours > 0) {
    minutes = minutes - hours * 60
  }
  let seconds = Math.floor(time - minutes * 60)
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  console.log('the elapsed time: ' + hours + ':' + minutes + ':' + seconds)
  let newLabelTime = hours + ':' + minutes + ':' + seconds
  db_label.insertLabel(labelName, newLabelTime)

  setTimeout(function () {
    db_label.findLabels((err, labels) => {
      if (err) {
        console.log(err)
      }
      db_label.findLabels((err, labels) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.send(labels)
      })
    }, 500)
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

let inStreamEditStartTime = null

router.post('/streaming/:stream_name/trim_start', function (req, res, next) {
  let time = stopwatch.ms / 1000
  let hours = Math.floor(time / 3600)
  let minutes = Math.floor(time / 60)
  if (hours > 0) {
    minutes = minutes - hours * 60
  }
  let seconds = Math.floor(time - minutes * 60)
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  console.log('the elapsed time: ' + hours + ':' + minutes + ':' + seconds)
  inStreamEditStartTime = hours + ':' + minutes + ':' + seconds
  trimName = req.body.name.replace(/\s+/g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase()
  inStreamEdit()
  inStreamMsg = trimName
  res.redirect('/streaming/' + outputName)
})

let inStreamEditEndTime = null

router.post('/streaming/:stream_name/trim_end', function (req, res, next) {
  let time = stopwatch.ms / 1000
  let hours = Math.floor(time / 3600)
  let minutes = Math.floor(time / 60)
  if (hours > 0) {
    minutes = minutes - hours * 60
  }
  let seconds = Math.floor(time - minutes * 60)
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  console.log('the elapsed time: ' + hours + ':' + minutes + ':' + seconds)
  inStreamEditEndTime = hours + ':' + minutes + ':' + seconds
  db_trims.insertTrim(trimName, inStreamEditStartTime, inStreamEditEndTime)
  killTrim()
  inStreamMsg = 'Not recording'
  res.redirect('/streaming/' + outputName)
})

router.get('/streaming/:stream_name/getTime', function (req, res, next) {
  let streamTimes = {startTime: inStreamEditStartTime, endTime: inStreamEditEndTime}
  res.send(streamTimes)
})
// video settings

router.get('/video_settings', function (req, res, next) {
  setTimeout(function () {
    db_label.findLabels((err, labels) => {
      if (err) {
        console.log(err)
      }
      db_logo.findLogos((err, logo) => {
        if (err) {
          return res.sendStatus(500)
        }
        res.render('video_settings', {currentOverlay: overlay, signal: signalStatus, bitrate: bitrate, currentResolution: resolution, input: inputURL, name: outputName, logo_: logo})
      })
    }, 500)
  })
})

router.post('/video_settings/change_resolution', function (req, res, next) {
  resolution = req.body.resolution
  bitrate = req.body.bitrate_
  console.log(bitrate)
  res.redirect('/video_settings')
})

router.post('/video_settings/use_logos', function (req, res, next) {
  overlay = req.body.logo
  if (req.body.noLogo) {
    overlay = 0
  }
  res.redirect('/video_settings')
})

router.get('/', function (req, res, next) {
  res.render('frontpage', {signal: signalStatus})
})

router.get('/goToStreamingPage', function (req, res, next) {
  res.redirect('/streaming/' + outputName)
})

module.exports = router
