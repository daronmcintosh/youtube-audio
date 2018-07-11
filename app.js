require("dotenv").config();
const express = require("express");
const ytdl = require("ytdl-core");
const stream = require("youtube-audio-stream");
const tracks = require("./public/js/tracks");

const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); // eslint-disable-line

// INDEX PAGE
app.get("/", function (req, res) {
	res.render("index");
});

// SOURCE URL FOR AUDIO
app.get("/api/play/:videoId", function (req, res) {
	// Secure this route to prevent unauthorized access and/or convert to a post route
	// Find a better name for this route
	var requestUrl = "http://youtube.com/watch?v=" + req.params.videoId;
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
	var videoId = ytdl.getVideoID(req.query.apiURL);
	ytdl.getInfo(req.query.apiURL, function (err, info) {
		if (err) {
			res.redirect("back");
		}
		var length = info.length_seconds;
		var title = info.title;
		var jsonResponse = {
			videoId: videoId,
			title: title,
			length: length + " seconds",
			data: {
				url: "http://localhost:3000/api/play/" + videoId
			}
		};
		res.type("json");
		res.write(JSON.stringify(jsonResponse));
		res.end();
	});
});

// Basic HTLM5 Player
app.get("/player/:source", function (req, res) {
	// This route should only play streams from this domain
	ytdl.getInfo(req.params.source, function (err, info) {
		var source = req.params.source;
		var length = info.length_seconds;
		res.render("player", { source: source, length: length });
	});
});

// Redirection route to get to player or playlist player from index page, this was done to make the url cleaner
app.get("/redirection", function (req, res) {
	if(req.query.playURL){
		var videoId = ytdl.getVideoID(req.query.playURL);
		res.redirect("/player/" + videoId);
	} else if(req.query.playlistId){
		var playlistId = "PLM2V-zC1RStdDt-ATpEzd7bNLwJ1pojeJ";
		res.redirect("/playlist/" + playlistId);
	}
});

// Playlist Route
app.get("/playlist/:playlistId", function(req, res){
	// PLM2V-zC1RStdDt-ATpEzd7bNLwJ1pojeJ
	tracks.build(req.params.playlistId).then(function (playlistItems) {
		// console.log(result);
		res.render("playlist", {playlistItems: playlistItems});
	});
});

app.get("*", function (req, res) {
	res.render("404");
});

// Listen on port 3000
app.listen(3000, function () {
	console.log("Server has started on port 3000");
});