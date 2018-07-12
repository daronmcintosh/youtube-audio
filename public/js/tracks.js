require("dotenv").config();
const { google } = require("googleapis");
const ytdl = require("ytdl-core");


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
		trackObj.track = trackCounter;
		trackObj.name = item.snippet.title;
		// trackObj.duration = await ytdl.getInfo(item.snippet.resourceId.videoId).then(function (result) {
		// 	return result.length_seconds;
		// });
		// trackObj.duration = await fetchVideoInfo(item.snippet.resourceId.videoId).then(function (result) {
		// 	return result.duration;
		// });
		trackObj.src = "http://localhost:3000/api/play/" + item.snippet.resourceId.videoId;
		trackCounter++;
		tracks.push(trackObj);
	}
	return tracks;
}


module.exports.build = buildPlaylist;

// buildPlaylist("PLBCF2DAC6FFB574DE").then(function (result) {
// 	console.log(result);
// });
// "https://www.googleapis.com/youtube/v3/search?key=AIzaSyA3dRQiPt2aHwZ3piY_nJ7tZH6XEEDYTMM&channelId=UCSa8IUd1uEjlREMa21I3ZPQ&part=snippet,id&order=date&maxResults=5";