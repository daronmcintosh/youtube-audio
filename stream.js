// Custom youtube-audio-stream with bitrate, start time option and reference to ffmpeg process
var ytdl = require('ytdl-core');
var FFmpeg = require('fluent-ffmpeg');
var through = require('through2');
var xtend = require('xtend');
var fs = require('fs');

module.exports = streamify;

function streamify(uri, opt, startTimeInSeconds) {
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

	var ffmpeg = new FFmpeg(video);
	opt.applyOptions(ffmpeg);
	var output;
	if (startTimeInSeconds) {
		output = ffmpeg
			.setStartTime(startTimeInSeconds)
			.audioBitrate(128)
			.format(opt.audioFormat)
			.pipe(stream);
	} else {
		output = ffmpeg
			.audioBitrate(128)
			.format(opt.audioFormat)
			.pipe(stream);
	}
	video.on('info', stream.emit.bind(stream, 'info'));
	output.on('error', video.end.bind(video));
	output.on('error', stream.emit.bind(stream, 'error'));
	return {
		stream: stream,
		ffmpeg: ffmpeg
	};
}