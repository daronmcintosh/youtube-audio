// Config file
const config = require('./config');
const {google} = require('googleapis');
const moment = require('moment');

// Make request to Youtube API with the server side API KEY
// NB: Private and unlisted videos/playlists won't show when using this.
const youtubeApiKey = google.youtube({
  version: 'v3',
  auth: config.apiKey,
});


async function buildPlaylistItems(playlistId, youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  const result = await youtube.playlistItems.list({
    playlistId: playlistId,
    maxResults: 50,
    part: 'snippet',
  });
  const tracks = [];
  let trackCounter = 1;
  const items = result.data.items;
  for (const item of items) {
    const trackObj = {};
    const videoId = item.snippet.resourceId.videoId;
    trackObj.track = trackCounter;
    trackObj.name = item.snippet.title;
    trackObj.src = `/api/play/${videoId}`;
    trackCounter++;
    tracks.push(trackObj);
  }
  return tracks;
}

async function buildVideo(videoId, youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  const videoObj = {};
  await youtube.videos.list({
    id: videoId,
    part: 'contentDetails, snippet',
  }).then(result => {
    videoObj.title = result.data.items[0].snippet.title;
    result.data.items[0].s;
    videoObj.src = `/api/play/${videoId}`;
    const videoDuration = result.data.items[0].contentDetails.duration;
    videoObj.duration = moment.duration(videoDuration).asSeconds();
  });
  return videoObj;
}

async function buildSearch(query, youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  const result = await youtube.search.list({
    type: '',
    q: query,
    maxResults: 25,
    part: 'snippet',
  });
  const searchResults = [];
  const items = result.data.items;
  for (const item of items) {
    const searchObj = {};
    const kind = item.id.kind;
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

async function buildPlaylists(channelId, youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  const result = await youtube.playlists.list({
    maxResults: 24,
    channelId: channelId,
    part: 'snippet',
  });
  const channelObj = {
    name: '',
    playlistsItems: [],
  };
  const items = result.data.items;
  if (items.length > 0) {
    for (const item of items) {
      const playlistObj = {};
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

async function buildPopularVideos(channelId, youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  const result = await youtube.search.list({
    part: 'snippet',
    channelId: channelId,
    order: 'viewCount',
    maxResults: 25,
  });
  const channelObj = {
    name: '',
    videos: [],
  };
  const items = result.data.items;
  if (items.length > 0) {
    for (const item of items) {
      const videoObj = {};
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
    channelObj.name = result.data.items[0].snippet.channelTitle;
  }
  return channelObj;
}

async function buildTrendingVideos() {
  const result = await youtubeApiKey.videos.list({
    part: 'snippet',
    videoCategoryId: '10',
    chart: 'mostPopular',
    regionCode: 'US',
    maxResults: 25,
  });
  const videos = [];
  const items = result.data.items;
  for (const item of items) {
    const videoObj = {};
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

async function getDuration(videoId, youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  let duration = 0;
  await youtube.videos.list({
    id: videoId,
    part: 'contentDetails',
  }).then(result => {
    const videoDuration = result.data.items[0].contentDetails.duration;
    duration = moment.duration(videoDuration).asSeconds();
  });
  return duration;
}

async function getUserChannelId(youtubeOAuth2) {
  const youtube = getYoutubeRequestMethod(youtubeOAuth2);
  let channelId = 0;
  await youtube.playlists.list({
    part: 'snippet',
    mine: 'true',
  }).then(result => {
    const items = result.data.items;
    channelId = items[0].snippet.channelId;
  });
  return channelId;
}

function getYoutubeRequestMethod(youtubeOAuth2) {
  const credentials = youtubeOAuth2._options.auth.credentials;
  return credentials !== null ? youtubeOAuth2 : youtubeApiKey;
}

module.exports.buildPlaylistItems = buildPlaylistItems;
module.exports.buildVideo = buildVideo;
module.exports.buildSearch = buildSearch;
module.exports.buildPlaylists = buildPlaylists;
module.exports.buildPopularVideos = buildPopularVideos;
module.exports.buildTrendingVideos = buildTrendingVideos;
module.exports.getDuration = getDuration;
module.exports.getUserChannelId = getUserChannelId;
