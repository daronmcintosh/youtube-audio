const {createLogger, format, transports} = require('winston');
const isProduction = process.env.NODE_ENV === 'production';

// Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: new transports.Console(),
});

const connectedClients = {}; // used to store connected clients by sessionID
const runningCommands = {}; // used to store a list of commands by sessionID

// GET environment variables from .env file if we are not in production
if (!isProduction) {
  require('dotenv').config();
}

module.exports = {
  'sessionSecret': process.env.SESSION_SECRET,
  'apiKey': process.env.API_KEY,
  'redisHost': process.env.REDIS_HOST,
  'redisPassword': process.env.REDIS_PASSWORD,
  'redisPort': process.env.REDIS_PORT,
  'youtubeClientId': process.env.YOUTUBE_CLIENT_ID,
  'youtubeClientSecret': process.env.YOUTUBE_CLIENT_SECRET,
  'isProduction': isProduction,
  'logger': logger,
  'connectedClients': connectedClients,
  'runningCommands': runningCommands,
};
