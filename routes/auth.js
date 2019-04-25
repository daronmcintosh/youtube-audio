const express = require('express');
const {google} = require('googleapis');

const apiRequest = require('../apiRequest');
const youtubeClient = require('../youtubeClient');

const router = express.Router();
const youtubeOAuth2 = google.youtube({
  version: 'v3',
  auth: youtubeClient.oAuth2Client,
});

// Authenticate User Route
router.get('/authenticate', (req, res) => {
  youtubeClient.authenticate().then(url => {
    res.redirect(url);
  });
});

// Authenticated User Callback Route
router.get('/oauth2Callback', (req, res, next) => {
  const code = req.query.code;
  youtubeClient.oAuth2Client.getToken(code)
      .then(response => {
        const tokens = response.tokens;
        req.session.tokens = tokens;

        // Save refresh_token separately
        req.session.refresh_token = tokens.refresh_token;

        youtubeClient.oAuth2Client.setCredentials(tokens);
        apiRequest.getUserChannelId(youtubeOAuth2).then(channelId => {
          res.redirect(`/channel/${channelId}/playlists`);
        });
      })
      .catch(onrejected => {
      // somesort of access denied message or page
        const err = onrejected;
        next(err);
      });
});

module.exports = router;
