const {google} = require('googleapis');
const config = require('./config');
const isProduction = config.isProduction;
const redirectUri = isProduction
  ? 'https://audio-youtube.herokuapp.com/auth/oauth2Callback'
  : 'http://localhost:3000/auth/oauth2Callback';

class YoutubeClient {
  constructor(options) {
    this._options = options || {scopes: []};
    // create an oAuth client to authorize the API call
    this.oAuth2Client = new google.auth.OAuth2({
      clientId: config.youtubeClientId,
      clientSecret: config.youtubeClientSecret,
      redirectUri: redirectUri,
    });
  }

  async authenticate() {
    const authorizeUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
    });
    return authorizeUrl;
  }
}

module.exports = new YoutubeClient();
