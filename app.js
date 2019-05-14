// Config file
const config = require('./config');

// Node Modules
const express = require('express');
const moment = require('moment');
const path = require('path');
const lessMiddleware = require('less-middleware');
const helmet = require('helmet');
const compression = require('compression');
const app = express(); // Express App
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const sharedsession = require('express-socket.io-session');
const {google} = require('googleapis');
const redis = require('redis');
const client = redis.createClient({
  host: config.redisHost,
  password: config.redisPassword,
  port: config.redisPort,
  no_ready_check: true,
});
const axios = require('axios');

// My Modules
const apiRequest = require('./apiRequest');
const youtubeClient = require('./youtubeClient');


// Routes
const index = require('./routes/index');

// Logger
const logger = config.logger;

// Make request to Youtube API using OAuth2 client
const youtubeOAuth2 = google.youtube({
  version: 'v3',
  auth: youtubeClient.oAuth2Client,
});

// Session Options
const sess = {
  store: new RedisStore({client: client}),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
};

// Session Middleware
const sessionMiddleware = session(sess);

// Middlewares
app.use(sessionMiddleware);
io.use(sharedsession(sessionMiddleware, {autoSave: true}));
app.use(compression());
app.use(helmet());
app.use(lessMiddleware(path.join(__dirname, '/public'),
    {
      dest: path.join(__dirname, '/public'),
      debug: false,
    }
));
app.use(express.static(`${__dirname}/public`));

// Custom Middle to initialize running commands and to validate access tokens
app.use(async (req, res, next) => {
  if (!(req.sessionID in runningCommands)) {
    runningCommands[req.sessionID] = [];
  }
  if (req.session.tokens) {
    const tokens = req.session.tokens;
    const baseAuthUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
    await axios.get(baseAuthUrl, {params: {access_token: tokens.access_token}})
        .then(async response => {
          const expiresIn = response.data.expires_in;
          // Generate a new access token when the current one expires <300s
          if (Number(expiresIn) < 300) {
            youtubeClient.oAuth2Client.refreshToken(req.session.refresh_token)
                .then(response => {
                  req.session.tokens = response.tokens;
                });
          }
          youtubeClient.oAuth2Client.setCredentials(tokens);
          res.locals.authenticated = true;
          await apiRequest.getUserChannelId(youtubeOAuth2).then(channelId => {
            res.locals.channelId = channelId;
          });
        })
        .catch(() => {
          delete req.session.tokens;
          delete req.session.refresh_token;
          youtubeClient.oAuth2Client.setCredentials(null);
          res.locals.authenticated = false;
        });
  } else {
    youtubeClient.oAuth2Client.setCredentials(null);
    res.locals.authenticated = false;
  }
  next();
});

// View Engine
app.set('view engine', 'ejs');

// App Locals
app.locals.moment = moment;

// used to store connected clients by sessionID
const connectedClients = config.connectedClients;
// used to store a list of commands by sessionID
const runningCommands = config.runningCommands;

// Socket.IO listener used to keep track of the amount of connected clients
// and to kill ffmpeg processes associated with a user when they disconnect
io.on('connection', socket => {
  const sessionID = socket.handshake.sessionID;
  connectedClients[sessionID] = socket.id;
  const numberOfConnectedClients = Object.keys(connectedClients).length;
  logger.info(`Number of connected clients: ${numberOfConnectedClients}`);
  socket.on('disconnect', () => {
    const listOfMyRunningCommands = runningCommands[sessionID];
    if (listOfMyRunningCommands !== undefined) {
      listOfMyRunningCommands.forEach(command => {
        command.on('error', () => {
          logger.info('A ffmpeg process has been has been killed');
        });
        command.kill();
      });
      logger.info(`All of ${sessionID} commands have been killed`);
      delete runningCommands[sessionID];
    } else {
      logger.info('no commands');
    }
    delete connectedClients[sessionID];
    logger.info(`Number of connected clients: ${numberOfConnectedClients}`);
  });

  socket.on('remove all processes', () => {
    const listOfMyRunningCommands = runningCommands[sessionID];
    if (listOfMyRunningCommands !== undefined) {
      const length = listOfMyRunningCommands.length;
      for (let i = 0; i < length; i++) {
        listOfMyRunningCommands[i].on('error', () => {
          logger.info('A ffmpeg process has been has been killed');
        });
        listOfMyRunningCommands[i].kill();
      }
    } else {
      logger.info('no commands');
    }
  });
});

app.use('/', index);

// Catch 404 errors
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
  // Route for pages that don't exist
  // app.get('*', (req, res) => {
  //   res.render('404');
  // });
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {},
  });
});

// Listen on port 3000
const port = process.env.PORT || 3000;
// const open = require('open');
server.listen(port, () => {
  // open('http://localhost:3000');
  logger.info('Server started');
});

module.exports = {
  'io': io,
};

// // If there is an error, it redirects and prints the error on this page
// function invalidId(res, err) {
//   res.render('invalid', {err: err});
// }
