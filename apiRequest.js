require('dotenv').config();
const { google } = require('googleapis');
const moment = require('moment');

// initialize the Youtube API library
const youtube = google.youtube({
	version: 'v3',
	auth: process.env.API_KEY
});


async function buildPlaylistItems(playlistId) {
	const result = await youtube.playlistItems.list({
		playlistId: playlistId,
		maxResults: 50,
		part: 'snippet'
	});
	let tracks = [];
	let trackCounter = 1;
	let items = result.data.items;
	for (const item of items) {
		let trackObj = {};
		let videoId = item.snippet.resourceId.videoId;
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
	let items = result.data.items;
	for (const item of items) {
		let searchObj = {};
		let kind = item.id.kind;
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
		let imageUrl;
		try {
			imageUrl = item.snippet.thumbnails.maxres.url;
		} catch (err) {
			imageUrl = item.snippet.thumbnails.high.url;
		}
		searchObj.imgSrc = imageUrl;
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
	let items = result.data.items;
	if (items.length > 0) {
		for (const item of items) {
			let playlistObj = {};
			playlistObj.id = item.id;
			playlistObj.title = item.snippet.title;
			let imageUrl;
			try {
				imageUrl = item.snippet.thumbnails.maxres.url;
			} catch (err) {
				imageUrl = item.snippet.thumbnails.high.url;
			}
			playlistObj.imgSrc = imageUrl;
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
	let items = result.data.items;
	for (const item of items) {
		let videoObj = {};
		videoObj.id = item.id.videoId;
		videoObj.title = item.snippet.title;
		let imageUrl;
		try {
			imageUrl = item.snippet.thumbnails.maxres.url;
		} catch (err) {
			imageUrl = item.snippet.thumbnails.high.url;
		}
		videoObj.imgSrc = imageUrl;
		channelObj.videos.push(videoObj);
	}
	return channelObj;
}
async function buildTrendingVideos() {
	const result = await youtube.videos.list({
		part: 'snippet',
		videoCategoryId: '10',
		chart: 'mostPopular',
		regionCode: 'US',
		maxResults: 25
	});
	let videos = [];
	let items = result.data.items;
	for (const item of items) {
		let videoObj = {};
		videoObj.id = item.id;
		videoObj.title = item.snippet.title;
		let imageUrl;
		try {
			imageUrl = item.snippet.thumbnails.maxres.url;
		} catch (err) {
			imageUrl = item.snippet.thumbnails.high.url;
		}
		videoObj.imgSrc = imageUrl;
		videos.push(videoObj);
	}
	return videos;
}

async function getDuration(videoId) {
	let duration = 0;
	await youtube.videos.list({
		id: videoId,
		part: 'contentDetails'
	}).then((result) => {
		duration = moment.duration(result.data.items[0].contentDetails.duration).asSeconds();
	});
	return duration;
}

module.exports.buildPlaylistItems = buildPlaylistItems;
module.exports.buildVideo = buildVideo;
module.exports.buildSearch = buildSearch;
module.exports.buildPlaylists = buildPlaylists;
module.exports.buildPopularVideos = buildPopularVideos;
module.exports.buildTrendingVideos = buildTrendingVideos;
module.exports.getDuration = getDuration;