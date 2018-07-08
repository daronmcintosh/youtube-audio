const express = require("express");
const ytdl = require("ytdl-core");
const bodyParser = require("body-parser");
const stream = require("youtube-audio-stream");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// INDEX PAGE
app.get("/", function(req, res){
	res.render("index");
});

// SOURCE URL FOR AUDIO
app.get("/api/play/:videoId", function(req, res){
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
app.get("/api/request/", function(req, res){
	// SEND JSON DATA TO THIS ROUTE
	// Verify that the url is valid and contains a valid id to prevent errors
	var videoId = ytdl.getVideoID(req.query.url);
	var jsonResponse = {
		id: videoId,
		info: "This is an API response in JSON format",
		data: {
			url: "http://localhost:3000/player/" + videoId
		}
	};
	res.type("json");
	res.write(JSON.stringify(jsonResponse));
	res.end();
});

// Basic HTLM5 Player
app.get("/player/:source", function(req, res){
	// This route should only play streams from this domain
	var source = req.params.source;
	res.render("player", {source: source});
});

app.get("*", function(req, res){
	res.render("404");
});

// Listen on port 3000
app.listen(3000, function(){
	console.log("Server has started on port 3000");
});