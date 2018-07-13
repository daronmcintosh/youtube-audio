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
		maxResults: 5,
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
		trackObj.duration = await youtube.videos.list({
			id: videoId,
			part: "contentDetails"
		}).then(function (result) {
			return moment.duration(result.data.items[0].contentDetails.duration).asSeconds();
		}).catch(function(err){
			if(err){
				// do nothing
			}
		});
		trackObj.src = "http://localhost:3000/api/play/" + videoId;
		trackCounter++;
		tracks.push(trackObj);
	}
	return tracks;
}

module.exports.build = buildPlaylist;