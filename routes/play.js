const express = require('express');
const {google} = require('googleapis');

const apiRequest = require('../apiRequest');
const youtubeClient = require('../youtubeClient');

const router = express.Router();
const youtubeOAuth2 = google.youtube({
  version: 'v3',
  auth: youtubeClient.oAuth2Client,
});

// Play single song route
router.get('/song', (req, res, next) => {
  apiRequest.buildVideo(req.query.id, youtubeOAuth2)
      .then(result => {
        const src = result.src;
        const title = result.title;
        res.render('player', {src: src, title: title});
      })
      .catch(err => {
        if (err) {
          next(err);
        }
      });
});

// Play Playlist Route
router.get('/playlist', (req, res, next) => {
  apiRequest.buildPlaylistItems(req.query.id, youtubeOAuth2)
      .then(playlistItems => {
        res.render('playlist', {playlistItems: playlistItems});
      })
      .catch(err => {
        if (err) {
          next(err);
        }
      });
});

module.exports = router;
