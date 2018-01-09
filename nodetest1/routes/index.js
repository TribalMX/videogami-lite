const express = require('express')
const router = express.Router()
const cmd = require('node-cmd')
const schedule = require('node-schedule')

let YTrtmpKey = 'rw74-map3-gtjy-d9sh'
let JCrtmpKey = 'rickysychan-7hup2-mqxsa-b6kmd-gj2gq'
let JCInputURL = 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8'
let FBInputURL = 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8'
let YTInputURL = 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8'
let FBrtmp = null
let logoHeight = 10
let logoHorizontal = 580
let imgScale = '40:40'

// this is for joicaster
let streamJC = () => { cmd.run('ffmpeg -re -i ' + JCInputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://ingest-us-east.a.switchboard.zone/live/' + JCrtmpKey + '"') }

// this is for faebook only
let streamFB = () => { cmd.run('ffmpeg -re -i ' + FBInputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=580:10:enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"' + FBrtmp + '"') }

// this is for Youtube only
let streamYT = () => { cmd.run('ffmpeg -re -i ' + YTInputURL + ' -i ./public/images/ACE.png -i ./public/images/logo2.jpg -filter_complex "[1]scale=' + imgScale + '[ovrl1], [0:v][ovrl1] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,1,5)\'[v1];[2]scale=' + imgScale + '[ovrl2], [v1][ovrl2] overlay=' + logoHorizontal + ':' + logoHeight + ':enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://a.rtmp.youtube.com/live2/' + YTrtmpKey + '"') }

// this is to stop all ffmpeg activity

let stop = () => { cmd.run('killall ffmpeg') }

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'title' })
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

// JC input 

router.post('/JCInput', function (req, res, next) {
  JCInputURL = req.body.JCInput
  res.redirect('/')
})

// stream JC Now

router.get('/streamJC', function (req, res, next) {
  streamJC()
  res.redirect('/')
})

// stream JC scheduled

let scheduleJC = null

router.post('/streamJCScheduled', function (req, res, next) {
  let month = req.body.month
  let day = req.body.day
  let hour = req.body.hour
  let minute = req.body.minute
  let date = new Date(2018, month, day, hour, minute)
  console.log('schedule on ' + req.body.minute)
  scheduleJC = schedule.scheduleJob(date, function () {
    console.log('stream started')
    streamJC()
    scheduleJC.cancel()
  })
  res.redirect('/')
})

// cancel JC scheduled task

router.post('/CancelstreamJCScheduled', function (req, res, next) {
  console.log('canceled')
  scheduleJC.cancel()
  res.redirect('/')
})

// stop all ffmpeg tasks

router.get('/stop', function (req, res, next) {
  stop()
  res.redirect('/')
})

// FB input

router.post('/FBInput', function (req, res, next) {
  FBInputURL = req.body.FBInput
  res.redirect('/')
})

// stream to FB now

router.post('/fbstream', function (req, res, next) {
  FBrtmp = req.body.rtmplink
  streamFB()
  res.redirect('/')
})

// schedule FB stream

let scheduleFB = null

router.post('/streamFBScheduled', function (req, res, next) {
  let month = req.body.month
  let day = req.body.day
  let hour = req.body.hour
  let minute = req.body.minute
  let date = new Date(2018, month, day, hour, minute)
  console.log('schedule on ' + req.body.minute)
  scheduleFB = schedule.scheduleJob(date, function () {
    console.log('stream started.')
    FBrtmp = req.body.rtmplink
    streamFB()
    scheduleFB.cancel()
  })
  res.redirect('/')
})

// cancel FB stream

router.post('/CancelstreamFBScheduled', function (req, res, next) {
  console.log('canceled')
  scheduleFB.cancel()
  res.redirect('/')
})

// JC User rtmp key 

router.post('/YTRtmpKey', function (req, res, next) {
  YTrtmpKey = req.body.YTRtmpKey
  res.redirect('/')
})

// YT input

router.post('/YTInput', function (req, res, next) {
  YTInputURL = req.body.YTInput
  res.redirect('/')
})

// Stream to YT now

router.get('/streamYT', function (req, res, next) {
  streamYT()
  res.redirect('/')
})

// Schedule stream to YT

let scheduleYT = null

router.post('/streamYTScheduled', function (req, res, next) {
  let month = req.body.month
  let day = req.body.day
  let hour = req.body.hour
  let minute = req.body.minute
  let date = new Date(2018, month, day, hour, minute)
  console.log('schedule on ' + req.body.minute)
  scheduleYT = schedule.scheduleJob(date, function () {
    console.log('stream started.')
    streamYT()
    scheduleYT.cancel()
  })
  res.redirect('/')
})

// cancel schedled stream to YT

router.post('/CancelstreamYTScheduled', function (req, res, next) {
  console.log('canceled')
  scheduleYT.cancel()
  res.redirect('/')
})

module.exports = router
