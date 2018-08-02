require("dotenv").config();
const express = require("express");
const stream = require("youtube-audio-stream");
const apiRequest = require("./public/js/apiRequest");
const moment = require("moment");

const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); // eslint-disable-line
app.locals.moment = moment;

// INDEX PAGE
app.get("/", function (req, res) {
	res.render("index");
});

// SOURCE URL FOR AUDIO
app.get("/api/play/:videoId", function (req, res) {
	let requestUrl = "http://youtube.com/watch?v=" + req.params.videoId;
	try {
		// calculate length in bytes, (((bitrate * (lengthInSeconds - minusFiveThisIsAnEstimateBecauseItSeemsToBeOffByThis)) / bitsToBytes) * kiloBytesToBytes)
		apiRequest.getDuration(req.params.videoId).then(function (duration) {
			var durationInBytes = (((128 * (duration - 4)) / 8) * 1024);
			res.writeHead(200, {
				'Content-Length': durationInBytes,
				'Transfer-Encoding': 'chuncked',
			});
			stream(requestUrl).pipe(res);
		}).catch(function (err) {
			if (err) {
				// do nothing
			}
		});
	} catch (exception) {
		res.status(500).send(exception);
	}
});

// API RESPONSE ROUTE
app.get("/api/request/", function (req, res) {
	let query = req.query.apiQuery;
	let videoId = videoIdParser(query);
	let playlistId = playlistIdParser(query);
	if (videoId.length == 11) {
		apiRequest.buildVideo(videoId).then(function (result) {
			res.type("json");
			res.write(JSON.stringify(result));
			res.end();
		}).catch(function (err) {
			if (err) {
				invalidId(res);
			}
		});
	} else {
		apiRequest.buildPlaylistItems(playlistId).then(function (result) {
			res.type("json");
			res.write(JSON.stringify(result));
			res.end();
		}).catch(function (err) {
			if (err) {
				invalidId(res);
			}
		});
	}
});

// Play single song route
app.get("/playSong", function (req, res) {
	apiRequest.buildVideo(req.query.id).then(function (result) {
		let src = result.src;
		let title = result.title;
		res.render("player", { src: src, title: title });
	}).catch(function (err) {
		if (err) {
			invalidId(res);
		}
	});
});

// Play Playlist Route
app.get("/playPlaylist", function (req, res) {
	apiRequest.buildPlaylistItems(req.query.id).then(function (playlistItems) {
		res.render("playlist", { playlistItems: playlistItems });
	}).catch(function (err) {
		if (err) {
			invalidId(res);
		}
	});
});

// Search Route
app.get("/results/", function (req, res) {
	apiRequest.buildSearch(req.query.searchQuery).then(function (searchResults) {
		res.render("search", { searchResults: searchResults });
	}).catch(function (err) {
		if (err) {
			invalidId(res);
		}
	});
});

// Channel Route
app.get("/channel/:channelId/", function (req, res) {
	res.redirect(req.params.channelId + "/playlists");
});

// Channel's Playlist Route
app.get("/channel/:channelId/playlists", function (req, res) {
	apiRequest.buildPlaylists(req.params.channelId).then(function (playlists) {
		res.render("channel", { playlists: playlists, videos: null });
	}).catch(function (err) {
		if (err) {
			invalidId(res);
		}
	});
});

// Channel's Popular Videos Route
app.get("/channel/:channelId/videos", function (req, res) {
	apiRequest.buildPopularVideos(req.params.channelId).then(function (videos) {
		res.render("channel", { videos: videos, playlists: null });
	}).catch(function (err) {
		if (err) {
			invalidId(res);
		}
	});
});

// Redirection route to get to player or playlist player from index page, this was done to make the url cleaner
// and to prevent sending a url which will cause the app not to find the page from the index page forms
app.get("/redirection/", function (req, res) {
	if (req.query.videoQuery) {
		let videoId = videoIdParser(req.query.videoQuery);
		res.redirect("/playSong?id=" + videoId);
	} else if (req.query.playlistQuery) {
		let playlistId = playlistIdParser(req.query.playlistQuery);
		res.redirect("/playPlaylist?id=" + playlistId);
	}
});

// Route for pages that don't exist
app.get("*", function (req, res) {
	res.render("404");
});

// Listen on port 3000
app.listen(3000, function () {
	console.log("Server has started on port 3000");
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
	let reg = new RegExp("[&?]list=([a-z0-9_]+)", "i");
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
	res.render("invalid");
}