const express = require('express');
const {google} = require('googleapis');

const apiRequest = require('../apiRequest');
const youtubeClient = require('../youtubeClient');

const router = express.Router();
const auth = require('./auth');
const api = require('./api');
const channel = require('./channel');
const play = require('./play');

const youtubeOAuth2 = google.youtube({
  version: 'v3',
  auth: youtubeClient.oAuth2Client,
});

// Home Page
router.get('/', (req, res, next) => {
  apiRequest.buildTrendingVideos()
      .then(videos => {
        res.render('index', {
          videos: videos,
        });
      })
      .catch(err => {
        if (err) {
          next(err);
        }
      });
});

router.use('/auth', auth);
router.use('/api', api);
router.use('/channel', channel);
router.use('/play', play);


// Search Page
router.get('/results/', (req, res, next) => {
  apiRequest.buildSearch(req.query.searchQuery, youtubeOAuth2)
      .then(searchResults => {
        res.render('search', {
          searchResults: searchResults,
        });
      })
      .catch(err => {
        if (err) {
          next(err);
        }
      });
});

module.exports = router;
