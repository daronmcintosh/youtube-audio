// .env vars
require('dotenv').config();

// Node Modules
const express = require('express');
const moment = require('moment');
const ytdl = require('ytdl-core');
const path = require('path');
const lessMiddleware = require('less-middleware');
const helmet = require('helmet');
const compression = require('compression');
const ffmpeg = require('fluent-ffmpeg');
const app = express(); // Express App
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const sharedsession = require('express-socket.io-session');
const { createLogger, format, transports } = require('winston');
const { google } = require('googleapis');
const redis = require('redis');
const client = redis.createClient(process.env.REDISCLOUD_URL, { no_ready_check: true });
const axios = require('axios');

// My Modules
const apiRequest = require('./apiRequest');
const youtubeClient = require('./youtubeClient');
const stream = require('./stream');
// Logger
const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.json()),
	transports: new transports.Console()
});

// Make request to Youtube API using OAuth2 client
const youtubeOAuth2 = google.youtube({
	version: 'v3',
	auth: youtubeClient.oAuth2Client
});

// Session Options
let sess = {
	store: new RedisStore({ client: client }),
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
};

// Session Middleware
let sessionMiddleware = session(sess);

// Middlewares
app.use(sessionMiddleware);
io.use(sharedsession(sessionMiddleware, { autoSave: true }));
app.use(compression());
app.use(helmet());
app.use(lessMiddleware(path.join(__dirname, '/public'),
	{
		dest: path.join(__dirname, '/public'),
		debug: false
	}));
app.use(express.static(__dirname + '/public'));

// Custom Middle to initialize running commands and to validate access tokens
app.use(async (req, res, next) => {
	if (!(req.sessionID in runningCommands)) {
		runningCommands[req.sessionID] = [];
	}
	if (req.session.tokens) {
		let tokens = req.session.tokens;
		let baseAuthUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
		await axios.get(baseAuthUrl, { params: { access_token: tokens.access_token } })
			.then(async (response) => {
				let expiresIn = response.data.expires_in;
				// Generate a new access token when the current one expires in less than 300 seconds
				if (Number(expiresIn) < 300) {
					youtubeClient.oAuth2Client.refreshToken(req.session.refresh_token).then((response) => {
						req.session.tokens = response.tokens;
					});
				}
				youtubeClient.oAuth2Client.setCredentials(tokens);
				res.locals.authenticated = true;
				await apiRequest.getUserChannelId(youtubeOAuth2).then(channelId => {
					res.locals.channelId = channelId;
				});
			})
			.catch(() => {
				delete req.session.tokens;
				delete req.session.refresh_token;
				youtubeClient.oAuth2Client.setCredentials(null);
				res.locals.authenticated = false;
			});
	} else {
		youtubeClient.oAuth2Client.setCredentials(null);
		res.locals.authenticated = false;
	}
	next();
});

// View Engine
app.set('view engine', 'ejs');

// App Locals
app.locals.moment = moment;

let connectedClients = {}; // used to store connected clients by sessionID
let runningCommands = {}; // used to store a list of commands by sessionID
// Socket.IO listener used to keep track of the amount of connected clients and to kill ffmpeg processes associated with a user when they disconnect
io.on('connection', (socket) => {
	connectedClients[socket.handshake.sessionID] = socket.id;
	logger.info(`Number of connected clients: ${Object.keys(connectedClients).length}`);
	socket.on('disconnect', () => {
		let listOfMyRunningCommands = runningCommands[socket.handshake.sessionID];
		if (listOfMyRunningCommands !== undefined) {
			listOfMyRunningCommands.forEach((command) => {
				command.on('error', () => {
					logger.info('A ffmpeg has been has been killed');
				});
				command.kill();
			});
			logger.info(`All of ${socket.handshake.sessionID} commands have been killed`);
			delete runningCommands[socket.handshake.sessionID];
		} else {
			logger.info('no commands');
		}
		delete connectedClients[socket.handshake.sessionID];
		logger.info(`Number of connected clients: ${Object.keys(connectedClients).length}`);
	});
});


// INDEX PAGE
app.get('/', (req, res) => {
	apiRequest.buildTrendingVideos().then((videos) => {
		res.render('index', { videos: videos });
	}).catch((err) => {
		if (err) {
			logger.error(`Index Page: ${err}`);
			invalidId(res, err);
		}
	});
});

// SOURCE URL FOR AUDIO
app.get('/api/play/:videoId', (req, res) => {
	let requestUrl = 'http://youtube.com/watch?v=' + req.params.videoId;
	apiRequest.getDuration(req.params.videoId, youtubeOAuth2).then((duration) => {
		if (duration === 0) {
			ytdl.getInfo(requestUrl, (err, info) => {
				if (err) return logger.error(err);
				let liveStreamURL = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' }).url;
				ffmpeg(liveStreamURL)
					.audioCodec('libmp3lame')
					.format('mp3')
					.on('error', (err) => {
						logger.error('ffmpeg error:', err.message);
					})
					.audioBitrate(128)
					.pipe(res);
			});
		} else {
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
				setTimeout(() => {
					runningCommands[req.sessionID].push(streamObj.ffmpeg);
				}, 2000);
			} else {
				res.writeHead(200, {
					'Content-Type': contentType,
					'Content-Length': durationInBytes,
					'Transfer-Encoding': 'chuncked'
				});
				let streamObj = stream(requestUrl);
				streamObj.stream.pipe(res);
				setTimeout(() => {
					runningCommands[req.sessionID].push(streamObj.ffmpeg);
				}, 2000);
			}
		}
	}).catch((err) => {
		if (err) {
			logger.error(`API Play: ${err}`);
			io.to(`${connectedClients[req.sessionID]}`).emit('video error', err.message);
		}
	});
});

// API RESPONSE ROUTE
app.get('/api/request/', (req, res) => {
	let query = req.query.apiQuery;
	let videoId = ytdl.getVideoID(query);
	let playlistId = playlistIdParser(query);
	if (videoId.length == 11) {
		apiRequest.buildVideo(videoId, youtubeOAuth2).then((result) => {
			res.type('json');
			res.write(JSON.stringify(result));
			res.end();
		}).catch((err) => {
			if (err) {
				logger.error(`API Request: ${err}`);
				invalidId(res, err);
			}
		});
	} else {
		apiRequest.buildPlaylistItems(playlistId, youtubeOAuth2).then((result) => {
			res.type('json');
			res.write(JSON.stringify(result));
			res.end();
		}).catch((err) => {
			if (err) {
				logger.error(`API Request: ${err}`);
				invalidId(res, err);
			}
		});
	}
});

// Play single song route
app.get('/playSong', (req, res) => {
	apiRequest.buildVideo(req.query.id, youtubeOAuth2).then((result) => {
		let src = result.src;
		let title = result.title;
		res.render('player', { src: src, title: title });
	}).catch((err) => {
		if (err) {
			logger.error(`Player Page: ${err}`);
			invalidId(res, err);
		}
	});
});

// Play Playlist Route
app.get('/playPlaylist', (req, res) => {
	apiRequest.buildPlaylistItems(req.query.id, youtubeOAuth2).then((playlistItems) => {
		res.render('playlist', { playlistItems: playlistItems });
	}).catch((err) => {
		if (err) {
			logger.error(`Playlist Page: ${err}`);
			invalidId(res, err);
		}
	});
});

// Search Route
app.get('/results/', (req, res) => {
	apiRequest.buildSearch(req.query.searchQuery, youtubeOAuth2).then((searchResults) => {
		res.render('search', { searchResults: searchResults });
	}).catch((err) => {
		if (err) {
			logger.error(`Search Page: ${err}`);
			invalidId(res, err);
		}
	});
});

// Channel Route
app.get('/channel/:channelId/', (req, res) => {
	res.redirect(req.params.channelId + '/videos');
});

// Channel's Playlist Route
app.get('/channel/:channelId/playlists', (req, res) => {
	apiRequest.buildPlaylists(req.params.channelId, youtubeOAuth2).then((playlists) => {
		res.render('channel', { playlists: playlists, videos: null });
	}).catch((err) => {
		if (err) {
			logger.info('im second');
			logger.error(`Channel's Playlists Page: ${err}`);
			invalidId(res);
		}
	});
});

// Channel's Popular Videos Route
app.get('/channel/:channelId/videos', (req, res) => {
	apiRequest.buildPopularVideos(req.params.channelId, youtubeOAuth2).then((videos) => {
		res.render('channel', { videos: videos, playlists: null });
	}).catch((err) => {
		if (err) {
			logger.error(`Channel's Videos Page: ${err}`);
			invalidId(res, err);
		}
	});
});

// Authenticate User Route
app.get('/authenticate', (req, res) => {
	youtubeClient.authenticate().then((url) => {
		res.redirect(url);
	});
});

// Authenticated User Callback Route
app.get('/oauth2Callback', (req, res) => {
	let code = req.query.code;
	youtubeClient.oAuth2Client.getToken(code)
		.then((response) => {
			logger.info('User granted access');
			let tokens = response.tokens;
			req.session.tokens = tokens;
			req.session.refresh_token = tokens.refresh_token; // Save refresh_token separately
			youtubeClient.oAuth2Client.setCredentials(tokens);
			apiRequest.getUserChannelId(youtubeOAuth2).then(channelId => {
				res.redirect(`/channel/${channelId}/playlists`);
			});
		})
		.catch((onrejected) => {
			// somesort of access denied message or page
			logger.error('User denied access', onrejected);
		});

});

// Route for pages that don't exist
app.get('*', (req, res) => {
	res.render('404');
});

// Listen on port 3000
let port = process.env.PORT || 3000;

server.listen(port, () => {
	logger.info('Server started');
});

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

// If there is an error, it redirects and prints the error on this page
function invalidId(res, err) {
	res.render('invalid', { err: err });
}