const express = require('express');
const {google} = require('googleapis');

const apiRequest = require('../apiRequest');
const youtubeClient = require('../youtubeClient');

const router = express.Router();
const youtubeOAuth2 = google.youtube({
  version: 'v3',
  auth: youtubeClient.oAuth2Client,
});

// Channel Route
router.get('/:channelId', (req, res) => {
  res.redirect(`${req.params.channelId}/videos`);
});

// Channel's Playlist Route
router.get('/:channelId/playlists', (req, res, next) => {
  apiRequest.buildPlaylists(req.params.channelId, youtubeOAuth2)
      .then(playlists => {
        res.render('channel', {playlists: playlists, videos: null});
      })
      .catch(err => {
        if (err) {
          next(err);
        }
      });
});

// Channel's Popular Videos Route
router.get('/:channelId/videos', (req, res, next) => {
  apiRequest.buildPopularVideos(req.params.channelId, youtubeOAuth2)
      .then(videos => {
        res.render('channel', {videos: videos, playlists: null});
      })
      .catch(err => {
        if (err) {
          next(err);
        }
      });
});

module.exports = router;
