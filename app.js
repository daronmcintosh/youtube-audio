const express = require('express');
const apiRequest = require('./apiRequest');
const moment = require('moment');
const stream = require('./stream');
const path = require('path');
const lessMiddleware = require('less-middleware');

const app = express();

app.set('view engine', 'ejs');
app.use(lessMiddleware(path.join(__dirname, '/public'), // eslint-disable-line
	{
		dest: path.join(__dirname, '/public'), // eslint-disable-line
		debug: true
	}));

app.use(express.static(__dirname + '/public')); // eslint-disable-line

app.locals.moment = moment;

// INDEX PAGE
app.get('/', (req, res) => {
	res.render('index');
});

// SOURCE URL FOR AUDIO
app.get('/api/play/:videoId', (req, res) => {
	let requestUrl = 'http://youtube.com/watch?v=' + req.params.videoId;
	try {
		apiRequest.getDuration(req.params.videoId).then((duration) => {
			// calculate length in bytes, (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
			var durationInBytes = (((125 * (duration)) / 8) * 1024);
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

				stream(requestUrl, {}, startInSeconds).pipe(res);

			} else {
				res.writeHead(200, {
					'Content-Type': 'audio/mpeg',
					'Content-Length': durationInBytes,
					'Transfer-Encoding': 'chuncked'
				});
				stream(requestUrl).pipe(res);
			}
		}).catch((err) => {
			if (err) {
				invalidId(res);
			}
		});
	} catch (exception) {
		res.status(500).send(exception);
	}
});

// API RESPONSE ROUTE
app.get('/api/request/', (req, res) => {
	let query = req.query.apiQuery;
	let videoId = videoIdParser(query);
	let playlistId = playlistIdParser(query);
	if (videoId.length == 11) {
		apiRequest.buildVideo(videoId).then((result) => {
			res.type('json');
			res.write(JSON.stringify(result));
			res.end();
		}).catch((err) => {
			if (err) {
				invalidId(res);
			}
		});
	} else {
		apiRequest.buildPlaylistItems(playlistId).then((result) => {
			res.type('json');
			res.write(JSON.stringify(result));
			res.end();
		}).catch((err) => {
			if (err) {
				invalidId(res);
			}
		});
	}
});

// Play single song route
app.get('/playSong', (req, res) => {
	apiRequest.buildVideo(req.query.id).then((result) => {
		let src = result.src;
		let title = result.title;
		res.render('player', { src: src, title: title });
	}).catch((err) => {
		if (err) {
			invalidId(res);
		}
	});
});

// Play Playlist Route
app.get('/playPlaylist', (req, res) => {
	apiRequest.buildPlaylistItems(req.query.id).then((playlistItems) => {
		res.render('playlist', { playlistItems: playlistItems });
	}).catch((err) => {
		if (err) {
			invalidId(res);
		}
	});
});

// Search Route
app.get('/results/', (req, res) => {
	apiRequest.buildSearch(req.query.searchQuery).then((searchResults) => {
		res.render('search', { searchResults: searchResults });
	}).catch((err) => {
		if (err) {
			invalidId(res);
		}
	});
});

// Channel Route
app.get('/channel/:channelId/', (req, res) => {
	res.redirect(req.params.channelId + '/videos');
});

// Channel's Playlist Route
app.get('/channel/:channelId/playlists', (req, res) => {
	apiRequest.buildPlaylists(req.params.channelId).then((playlists) => {
		res.render('channel', { playlists: playlists, videos: null });
	}).catch((err) => {
		if (err) {
			invalidId(res);
		}
	});
});

// Channel's Popular Videos Route
app.get('/channel/:channelId/videos', (req, res) => {
	apiRequest.buildPopularVideos(req.params.channelId).then((videos) => {
		res.render('channel', { videos: videos, playlists: null });
	}).catch((err) => {
		if (err) {
			invalidId(res);
		}
	});
});

// Redirection route to get to player or playlist player from index page, this was done to make the url cleaner
// and to prevent sending a url which will cause the app not to find the page from the index page forms
app.get('/redirection/', (req, res) => {
	if (req.query.videoQuery) {
		let videoId = videoIdParser(req.query.videoQuery);
		res.redirect('/playSong?id=' + videoId);
	} else if (req.query.playlistQuery) {
		let playlistId = playlistIdParser(req.query.playlistQuery);
		res.redirect('/playPlaylist?id=' + playlistId);
	}
});

// Route for pages that don't exist
app.get('*', (req, res) => {
	res.render('404');
});

// Listen on port 3000
app.listen(3000, () => {
	console.log('Server has started on port 3000'); // eslint-disable-line
});

function videoIdParser(query) {
	let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/; // eslint-disable-line
	let match = query.match(regExp);
	if (match && match[7].length == 11) {
		return match[7];
	}
	// in this case an id was entered, this is really lazy, find a way to validate it
	return query;
}

function playlistIdParser(query) {
	let reg = new RegExp('[&?]list=([a-z0-9_]+)', 'i');
	let match = query.match(reg);
	// it found the id
	if (match && match.length === 2) {
		return (match[1]);
	}
	// in this case an id was entered, this is really lazy, find a way to validate it
	return query;
}

// If the youtube api returns an error, it redirects user to this page
function invalidId(res) {
	res.render('invalid');
}