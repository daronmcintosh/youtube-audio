require("dotenv").config();
const { google } = require("googleapis");
const moment = require("moment");


// initialize the Youtube API library
const youtube = google.youtube({
	version: "v3",
	auth: process.env.API_KEY // eslint-disable-line
});

async function buildPlaylist(playlistId) {
	const result = await youtube.playlistItems.list({
		playlistId: playlistId,
		maxResults: 25,
		part: "snippet"
	});
	var tracks = [];
	var trackCounter = 1;
	var items = result.data.items;
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

async function buildVideo(videoId) {
	let videoObj = {};
	await youtube.videos.list({
		id: videoId,
		part: "contentDetails, snippet"
	}).then(function (result) {
		videoObj.title = result.data.items[0].snippet.title;
		videoObj.duration = moment.duration(result.data.items[0].contentDetails.duration).asSeconds();
		videoObj.src = "http://localhost:3000/api/play/" + videoId;
	});
	return videoObj;
}

async function buildSearch(query) {
	const result = await youtube.search.list({
		type: "",
		q: query,
		maxResults: 25,
		part: "snippet"
	});
	let searchResults = [];
	var items = result.data.items;
	for (const item of items) {
		var searchObj = {};
		var kind = item.kind;
		searchObj.kind = kind;
		if (kind === "youtube#video") {
			searchObj.videoId = item.id.videoId;
		}
		if (kind === "youtube#playlist") {
			searchObj.playlistId = item.id.playlistId;
		}
		searchObj.title = item.snippet.title;
		searchObj.channelTitle = item.snippet.channelTitle;

		// build playlist or video object around which item was clicked instead of making another api request here
		// let videoObj = await buildVideo(videoId);
		// searchObj.duration = await videoObj.duration;
		// searchObj.src = "http://localhost:3000/api/play/" + videoId;
		searchResults.push(searchObj);
	}
	return searchResults;
}

module.exports.buildPlaylist = buildPlaylist;
module.exports.buildVideo = buildVideo;
module.exports.buildSearch = buildSearch;