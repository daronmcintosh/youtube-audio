require("dotenv").config();
const { google } = require("googleapis");
const moment = require("moment");


// initialize the Youtube API library
const youtube = google.youtube({
	version: "v3",
	auth: process.env.API_KEY // eslint-disable-line
});

async function buildPlaylist(playlistId) {
	const res = await youtube.playlistItems.list({
		playlistId: playlistId,
		maxResults: 25,
		part: "snippet"
	});
	var tracks = [];
	var trackCounter = 1;
	var items = res.data.items;
	for (const item of items) {
		var trackObj = {};
		var videoId = item.snippet.resourceId.videoId;
		trackObj.track = trackCounter;
		trackObj.name = item.snippet.title;
		let videoObj = await buildVideo(videoId);
		trackObj.duration = await videoObj.duration;
		trackObj.src = "http://localhost:3000/api/play/" + videoId;
		trackCounter++;
		tracks.push(trackObj);
	}
	return tracks;
}

async function buildVideo(videoId){
	let videoObj = {};
	await youtube.videos.list({
		id: videoId,
		part: "contentDetails, snippet"
	}).then(function(result){
		videoObj.title = result.data.items[0].snippet.title;
		videoObj.duration = moment.duration(result.data.items[0].contentDetails.duration).asSeconds();
		videoObj.src = "http://localhost:3000/api/play/" + videoId;
	});
	return videoObj;
}

module.exports.buildPlaylist = buildPlaylist;
module.exports.buildVideo = buildVideo;