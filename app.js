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
	// Secure this route to prevent unauthorized access and/or convert to a post route
	// Find a better name for this route
	let requestUrl = "http://youtube.com/watch?v=" + req.params.videoId;
	try {
		stream(requestUrl).pipe(res);
	} catch (exception) {
		res.status(500).send(exception);
	}
});

// API RESPONSE ROUTE
app.get("/api/request/", function (req, res) {
	// SEND JSON DATA TO THIS ROUTE
	// Verify that the url is valid and contains a valid id to prevent errors
	let videoId = videoIdParser(req.query.apiURL);
	apiRequest.buildVideo(videoId).then(function(result){
		result.duration = moment.utc(result.duration*1000).format("mm:ss");
		res.type("json");
		res.write(JSON.stringify(result));
		res.end();
	});
});

// Plyr player
app.get("/player/:videoId", function (req, res) {
	// This route should only play streams from this domain
	apiRequest.buildVideo(req.params.videoId).then(function(result){
		let src = req.params.videoId;
		let duration = result.duration;
		res.render("player", { src: src, duration: duration });
	});
});

// Redirection route to get to player or playlist player from index page, this was done to make the url cleaner
app.get("/redirection/", function (req, res) {
	if (req.query.playURL) {
		let videoId = videoIdParser(req.query.playURL);
		res.redirect("/player/" + videoId);
	} else if (req.query.playlistId) {
		let playlistId = req.query.playlistId;
		res.redirect("/playlist/" + playlistId);
	}
});

// Playlist route
app.get("/playlist/:playlistId", function (req, res) {
	apiRequest.buildPlaylist(req.params.playlistId).then(function (playlistItems) {
		res.render("playlist", { playlistItems: playlistItems });
	}).catch(function (err) {
		if (err) {
			console.log(err);
		}
	});
});

// Route for pages that don't exist
app.get("*", function (req, res) {
	res.render("404");
});

// Listen on port 3000
app.listen(3000, function () {
	console.log("Server has started on port 3000");
});

function videoIdParser(url) {
	let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/; // eslint-disable-line
	let match = url.match(regExp);
	return (match && match[7].length == 11) ? match[7] : false;
}