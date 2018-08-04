// this is essentially the youtube-audio-stream npm package customized for setting start time
var ytdl = require('ytdl-core');
var FFmpeg = require('fluent-ffmpeg');
var through = require('through2');
var xtend = require('xtend');
var fs = require('fs');

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

module.exports = streamify;
