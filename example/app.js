const ytdl = require('ytdl-core');
const opn = require('opn');
const path = require('path');
const express = require('express');
const app = express();
const stream = require('../stream');

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// Bare bones version of SOURCE URL FOR AUDIO
app.get('/api/play/:videoId', (req, res) => {
	let requestUrl = 'https://www.youtube.com/watch?v=' + req.params.videoId;
	ytdl.getInfo(requestUrl, (err, info) => {
		let duration = info.length_seconds;
		let contentType = 'audio/mpeg';
		// calculate length in bytes, (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
		// using 125 instead of 128 because it is more accurate
		let durationInBytes = (((125 * (duration)) / 8) * 1024);
		if (req.headers.range) {
			let range = req.headers.range;
			let parts = range.replace(/bytes=/, '').split('-');
			let partialstart = parts[0];
			let partialend = parts[1];

			let start = parseInt(partialstart, 10);
			let end = partialend ? parseInt(partialend, 10) : durationInBytes - 1;

			let chunksize = (end - start) + 1;
			res.writeHead(206, {
				'Content-Type': contentType,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunksize,
				'Content-Range': 'bytes ' + start + '-' + end + '/' + durationInBytes
			});

			// convert start in bytes to start in seconds
			// minus one second to prevent content length error
			let startInSeconds = (start / (1024 * 125) * 8 - 1);
			let streamObj = stream(requestUrl, {}, startInSeconds);
			streamObj.stream.pipe(res);
		} else {
			res.writeHead(200, {
				'Content-Type': contentType,
				'Content-Length': durationInBytes,
				'Transfer-Encoding': 'chuncked'
			});
			let streamObj = stream(requestUrl);
			streamObj.stream.pipe(res);
		}
	});
});

app.listen(3000, () => {
	opn('http://localhost:3000');
});