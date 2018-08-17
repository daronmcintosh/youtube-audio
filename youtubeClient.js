const { google } = require('googleapis');
const redirectUri = process.env.NODE_ENV === 'production' ? 'https://audio-youtube.herokuapp.com/oauth2Callback' : 'http://localhost:3000/oauth2Callback';
class YoutubeClient {
	constructor(options) {
		this._options = options || { scopes: [] };
		// create an oAuth client to authorize the API call
		this.oAuth2Client = new google.auth.OAuth2({
			clientId: process.env.YOUTUBE_CLIENT_ID,
			clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
			redirectUri: redirectUri
		});
	}

	async authenticate() {
		const authorizeUrl = this.oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: 'https://www.googleapis.com/auth/youtube.readonly'
		});
		return authorizeUrl;
	}
}

module.exports = new YoutubeClient();