const ytdl = require('ytdl-core');
const FFmpeg = require('fluent-ffmpeg');
const through = require('through2');
const xtend = require('xtend');
const fs = require('fs');
const opn = require('opn');
const path = require('path');

const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// SOURCE URL FOR AUDIO
app.get('/api/play/:videoId', (req, res) => {
	let requestUrl = 'http://youtube.com/watch?v=' + req.params.videoId;
	try {
		// using ytdl instead of youtube's api for test
		ytdl.getInfo(req.params.videoId, (err, info) => {
			if (err) {
				console.log(err);
			} else {
				// calculate length in bytes, (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
				var durationInBytes = (((125 * (info.length_seconds)) / 8) * 1024);
				if (req.headers.range) {
					let range = req.headers.range;
					let parts = range.replace(/bytes=/, '').split('-');
					let partialstart = parts[0];
					let partialend = parts[1];

					let start = parseInt(partialstart, 10);
					let end = partialend ? parseInt(partialend, 10) : durationInBytes - 1;

					let chunksize = (end - start) + 1;
					res.writeHead(206, {
						'Content-Type': 'audio/mpeg',
						'Accept-Ranges': 'bytes',
						'Content-Length': chunksize,
						'Content-Range': 'bytes ' + start + '-' + end + '/' + durationInBytes
					});

					// convert start in bytes to start in seconds
					// minus one second to prevent content length error
					let startInSeconds = (start / (1024 * 125) * 8 - 1);

					streamify(requestUrl, {}, startInSeconds).pipe(res);

				} else {
					res.writeHead(200, {
						'Content-Type': 'audio/mpeg',
						'Content-Length': durationInBytes,
						'Transfer-Encoding': 'chuncked'
					});
					streamify(requestUrl).pipe(res);
				}
			}
		});
	} catch (exception) {
		res.status(500).send(exception);
	}
});

app.listen(3000, () => {
	opn('http://localhost:3000');
});

// modified version of youtube-audio-stream
function streamify(uri, opt, startTime) {
	opt = xtend({
		videoFormat: 'mp4',
		quality: 'lowest',
		audioFormat: 'mp3',
		filter: filterVideo,
		applyOptions: function () { }
	}, opt);

	var video = ytdl(uri, opt);

	function filterVideo(format) {
		return (
			format.container === opt.videoFormat &&
			format.audioEncoding
		);
	}

	var stream = opt.file
		? fs.createWriteStream(opt.file)
		: through();

	var startTimeInSeconds = startTime ? startTime : 0;
	var ffmpeg = new FFmpeg(video).setStartTime(startTimeInSeconds);
	opt.applyOptions(ffmpeg);
	var output = ffmpeg
		.format(opt.audioFormat)
		.pipe(stream);

	video.on('info', stream.emit.bind(stream, 'info'));
	ffmpeg.on('error', stream.emit.bind(stream, 'error'));
	output.on('error', video.end.bind(video));
	output.on('error', stream.emit.bind(stream, 'error'));
	return stream;
}