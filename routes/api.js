const config = require('../config');
const io = require('../app').io;
const express = require('express');
const {google} = require('googleapis');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');

const stream = require('../stream');
const apiRequest = require('../apiRequest');
const youtubeClient = require('../youtubeClient');

const router = express.Router();
const logger = config.logger;
const youtubeOAuth2 = google.youtube({
  version: 'v3',
  auth: youtubeClient.oAuth2Client,
});

// used to store connected clients by sessionID
const connectedClients = config.connectedClients;
// used to store a list of commands by sessionID
const runningCommands = config.runningCommands;

// Route that streams audio
router.get('/play/:videoId', (req, res) => {
  const requestUrl = `https://www.youtube.com/watch?v=${req.params.videoId}`;
  apiRequest.getDuration(req.params.videoId, youtubeOAuth2).then(duration => {
    if (duration === 0) {
      ytdl.getInfo(requestUrl, (err, info) => {
        if (err) return logger.error(err);
        const liveStreamURL = ytdl.chooseFormat(info.formats, {
          quality: 'highestaudio',
        }).url;

        ffmpeg(liveStreamURL)
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', err => {
              logger.error('ffmpeg error:', err.message);
            })
            .audioBitrate(128)
            .pipe(res);
      });
    } else {
      const contentType = 'audio/mpeg';
      // Calculate length in bytes:
      // (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
      // using 125 instead of 128 because it is more accurate
      const durationInBytes = (((125 * (duration)) / 8) * 1024);
      if (req.headers.range) {
        const range = req.headers.range;
        const parts = range.replace(/bytes=/, '').split('-');
        const partialstart = parts[0];
        const partialend = parts[1];

        const start = parseInt(partialstart, 10);
        const end = partialend ? parseInt(partialend, 10) : durationInBytes - 1;

        const chunksize = (end - start) + 1;
        res.writeHead(206, {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Range': `bytes ${start}-${end}/${durationInBytes}`,
        });

        // convert start in bytes to start in seconds
        // minus one second to prevent content length error
        const startInSeconds = (start / (1024 * 125) * 8 - 1);
        const streamObj = stream(requestUrl, {}, startInSeconds);
        streamObj.stream.pipe(res);
        setTimeout(() => {
          if (streamObj.ffmpeg !== undefined) {
            runningCommands[req.sessionID].push(streamObj.ffmpeg);
          }
        }, 200);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': durationInBytes,
          'Transfer-Encoding': 'chuncked',
        });
        const streamObj = stream(requestUrl);
        streamObj.stream.pipe(res);
        setTimeout(() => {
          if (streamObj.ffmpeg !== undefined) {
            runningCommands[req.sessionID].push(streamObj.ffmpeg);
          }
        }, 200);
      }
    }
  }).catch(err => {
    if (err) {
      logger.error(`API Play: ${err}`);
      io
          .to(`${connectedClients[req.sessionID]}`)
          .emit('video error', err.message);
    }
  });
});

// API RESPONSE ROUTE
router.get('/request/', (req, res, next) => {
  const query = req.query.apiQuery;
  const videoId = ytdl.getVideoID(query);
  const playlistId = playlistIdParser(query);
  if (videoId.length == 11) {
    apiRequest.buildVideo(videoId, youtubeOAuth2)
        .then(result => {
          res.type('json');
          res.write(JSON.stringify(result));
          res.end();
        })
        .catch(err => {
          if (err) {
            next(res, err);
          }
        });
  } else {
    apiRequest.buildPlaylistItems(playlistId, youtubeOAuth2)
        .then(result => {
          res.type('json');
          res.write(JSON.stringify(result));
          res.end();
        })
        .catch(err => {
          if (err) {
            next(err);
          }
        });
  }
});

function playlistIdParser(query) {
  const reg = new RegExp('[&?]list=([a-z0-9_]+)', 'i');
  const match = query.match(reg);
  // it found the id
  if (match && match.length === 2) {
    return (match[1]);
  }
  // in this case an id was entered, this is really lazy
  return query;
}

module.exports = router;
