let express = require('express')
let router = express.Router()
let cmd = require('node-cmd')
// this is for joicaster
// let convert = () => { cmd.run('ffmpeg -re -i https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8 -i ACE.png -i logo2.jpg -filter_complex "[1]scale=40:40[ovrl1], [0:v][ovrl1] overlay=580:10:enable=\'between(t,1,5)\'[v1];[2]scale=40:40[ovrl2], [v1][ovrl2] overlay=580:10:enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"rtmp://ingest-us-east.a.switchboard.zone/live/rickysychan-7hup2-mqxsa-b6kmd-gj2gq"') }

// this is for faebook only
let convert = () => { cmd.run('ffmpeg -re -i "https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8" -i ACE.png -i logo2.jpg -filter_complex "[1]scale=40:40[ovrl1], [0:v][ovrl1] overlay=580:10:enable=\'between(t,1,5)\'[v1];[2]scale=40:40[ovrl2], [v1][ovrl2] overlay=580:10:enable=\'between(t,5,15)\'[v2];[v2] drawtext=fontfile=fontfile=/System/Library/Fonts/Keyboard.ttf: text=\'VideoGami\':fontcolor=white: fontsize=24: x=(w-text_w)/2: y=(h-text_h)/1.05: enable=\'between(t,1,10)\'" -acodec aac -vcodec libx264 -f flv ' + '"' + rtmp + '"') }

let stop = () => { cmd.run('killall ffmpeg') }

let rtmp = null

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'title' })
})

router.get('/convert', function (req, res, next) {
  res.render('index', convert())
})

router.get('/stop', function (req, res, next) {
  res.render('index', stop())
})

router.post('/data', function (req, res, next) {
  rtmp = req.body.data
  convert()
})

module.exports = router
