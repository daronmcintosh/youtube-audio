require('dotenv').config();
const { google } = require('googleapis');
const moment = require('moment');

// initialize the Youtube API library
const youtube = google.youtube({
	version: 'v3',
	auth: process.env.API_KEY // eslint-disable-line
});


async function buildPlaylistItems(playlistId) {
	const result = await youtube.playlistItems.list({
		playlistId: playlistId,
		maxResults: 50,
		part: 'snippet'
	});
	var tracks = [];
	var trackCounter = 1;
	var items = result.data.items;
	for (const item of items) {
		var trackObj = {};
		var videoId = item.snippet.resourceId.videoId;
		trackObj.track = trackCounter;
		trackObj.name = item.snippet.title;
		trackObj.src = '/api/play/' + videoId;
		trackCounter++;
		tracks.push(trackObj);
	}
	return tracks;
}

async function buildVideo(videoId) {
	let videoObj = {};
	await youtube.videos.list({
		id: videoId,
		part: 'contentDetails, snippet'
	}).then(function (result) {
		videoObj.title = result.data.items[0].snippet.title;
		result.data.items[0].s;
		videoObj.src = '/api/play/' + videoId;
		videoObj.duration = moment.duration(result.data.items[0].contentDetails.duration).asSeconds();
	});
	return videoObj;
}

async function buildSearch(query) {
	const result = await youtube.search.list({
		type: '',
		q: query,
		maxResults: 25,
		part: 'snippet'
	});
	let searchResults = [];
	var items = result.data.items;
	for (const item of items) {
		var searchObj = {};
		var kind = item.id.kind;
		searchObj.kind = kind;
		if (kind === 'youtube#video') {
			searchObj.id = item.id.videoId;
		}
		if (kind === 'youtube#playlist') {
			searchObj.id = item.id.playlistId;
		}
		if (kind === 'youtube#channel') {
			searchObj.id = item.id.channelId;
		}
		searchObj.channelId = item.snippet.channelId;
		searchObj.title = item.snippet.title;
		searchObj.channelTitle = item.snippet.channelTitle;
		searchObj.imgSrc = item.snippet.thumbnails.high.url;
		searchObj.description = item.snippet.description;
		searchResults.push(searchObj);
	}
	return searchResults;
}

async function buildPlaylists(channelId) {
	const result = await youtube.playlists.list({
		maxResults: 24,
		channelId: channelId,
		part: 'snippet'
	});
	let channelObj = {
		name: '',
		playlistsItems: []
	};
	var items = result.data.items;
	if (items.length > 0) {
		for (const item of items) {
			var playlistObj = {};
			playlistObj.id = item.id;
			playlistObj.title = item.snippet.title;
			playlistObj.imgSrc = item.snippet.thumbnails.high.url;
			channelObj.playlistsItems.push(playlistObj);
		}
		channelObj.name = result.data.items[0].snippet.channelTitle;
	}
	return channelObj;
}

async function buildPopularVideos(channelId) {
	const result = await youtube.search.list({
		part: 'snippet',
		channelId: channelId,
		order: 'viewCount',
		maxResults: 25
	});
	let channelObj = {
		name: '',
		videos: []
	};
	channelObj.name = result.data.items[0].snippet.channelTitle;
	var items = result.data.items;
	for (const item of items) {
		var videoObj = {};
		videoObj.id = item.id.videoId;
		videoObj.title = item.snippet.title;
		videoObj.imgSrc = item.snippet.thumbnails.high.url;
		channelObj.videos.push(videoObj);
	}
	return channelObj;
}

async function getDuration(videoId) {
	var duration = 0;
	await youtube.videos.list({
		id: videoId,
		part: 'contentDetails'
	}).then(function (result) {
		duration = moment.duration(result.data.items[0].contentDetails.duration).asSeconds();
	});
	return duration;
}

module.exports.buildPlaylistItems = buildPlaylistItems;
module.exports.buildVideo = buildVideo;
module.exports.buildSearch = buildSearch;
module.exports.buildPlaylists = buildPlaylists;
module.exports.buildPopularVideos = buildPopularVideos;
module.exports.getDuration = getDuration;