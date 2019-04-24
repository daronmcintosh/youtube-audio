const ytdl = require('ytdl-core');
const open = require('open');
const path = require('path');
const express = require('express');
const app = express();
const stream = require('../stream');

app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/index.html`));
});

// Bare bones version of SOURCE URL FOR AUDIO
app.get('/api/play/:videoId', (req, res) => {
  const requestUrl = `https://www.youtube.com/watch?v=${req.params.videoId}`;
  ytdl.getInfo(requestUrl, (err, info) => {
    const duration = info.length_seconds;
    const contentType = 'audio/mpeg';
    // calculate length in bytes:
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
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': durationInBytes,
        'Transfer-Encoding': 'chuncked',
      });
      const streamObj = stream(requestUrl);
      streamObj.stream.pipe(res);
    }
  });
});

app.listen(3000, () => {
  open('http://localhost:3000');
});
