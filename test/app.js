const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const opn = require('opn');
const path = require('path');
const apiRequest = require('../apiRequest');
const express = require('express');
const app = express();
const { createLogger, format, transports } = require('winston');
const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.json()),
	transports: new transports.Console()
});
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// SOURCE URL FOR AUDIO
app.get('/api/play/:videoId', (req, res) => {
	let requestUrl = 'http://youtube.com/watch?v=' + req.params.videoId;
	let audio;
	ytdl.getInfo(requestUrl, (err, info) => {
		if (err) {
			logger.error(`ytdl error: ${err.message}`);
		} else {
			audio = ytdl.downloadFromInfo(info, {
				quality: 'highestaudio'
			});
			try {
				apiRequest.getDuration(req.params.videoId).then((duration) => {
					// calculate length in bytes, (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
					let contentType = 'audio/mpeg';
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

						ffmpeg(audio)
							.audioCodec('libmp3lame')
							.audioBitrate(128)
							.format('mp3')
							.on('error', (err) => {
								logger.error(`ffmpeg: ${err.message}`);
							})
							.setStartTime(startInSeconds)
							.pipe(res);
					} else {
						res.writeHead(200, {
							'Content-Type': contentType,
							'Content-Length': durationInBytes,
							'Transfer-Encoding': 'chuncked'
						});
						ffmpeg(audio)
							.audioCodec('libmp3lame')
							.audioBitrate(128)
							.format('mp3')
							.on('error', (err) => {
								logger.error(`ffmpeg: ${err.message}`);
							})
							.pipe(res);
					}
				});
			} catch (exception) {
				res.status(500).send(exception);
			}
		}
	});
});

app.listen(3000, () => {
	opn('http://localhost:3000');
});