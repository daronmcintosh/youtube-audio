# Youtube Audio
This app is a multi-page audio version of youtube. It supports streaming a single video or playlist, streaming a livestream, searching, viewing channels and linking a youtube account. Each video or livestream is converted and streamed back to the client on the fly without anything ever being saved on the server.

**This version is no longer maintained. See React version [here](https://github.com/iSolutionJA/youtube-audio-react)**

## Motivation
I wanted to listen to just audio on youtube on any device without having to watch the video. Also, I wanted to be able to lock my device without having the audio stopped and to save my high speed data from running out.

## Features
* Authentication: User is able to link their youtube account to the app to see their playlists and videos
* Responsive web design that works on any size device
* Real time bi-directional communication between server and client


## Live Demo
To see a live verion, go to [https://audio-youtube.herokuapp.com](https://audio-youtube.herokuapp.com)

Important Note: App is on free version of [heroku](https://www.heroku.com) so it sleeps after 30 mins of inactivity. Therefore, it takes a little while to start up.

## Built With

### Front-End
* [ejs](http://ejs.co/)
* [Less](http://lesscss.org/)
* [Bootstrap](https://getbootstrap.com/)

### Back-End
* [express](https://expressjs.com/)
* [moment](https://momentjs.com/)
* [ytdl-core](https://github.com/fent/node-ytdl-core#readme)
* [helmet](https://helmetjs.github.io/)
* [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
* [socket.io](https://socket.io/)
* [express-session](https://github.com/expressjs/session#express-session)
* [redis](http://redis.js.org/)
* [google-api](https://github.com/googleapis/google-api-nodejs-client#readme)
* [axios](https://github.com/axios/axios)
* [winston](https://github.com/winstonjs/winston#readme)

## How is the audio streamed?

1. Get the duration(in seconds) of a video from the Youtube Data API
2. Calculate the file size in bytes using the duration and bitrate(125Kb/s) so we can tell the browser how long the file is.
3. Set the header(200) of the audio file that is going to be streamed; content-type - audio/mpeg, content-length - file-size and transfer-encoding - chuncked
4. Stream the file by converting a audio only stream to a mp3 stream using ffmpeg and then stream that to response.

## How does audio seeking work?

1. User clicks on a section of the seek bar
2. Browser sends request header with a range
3. Find start and end range (this is in bytes)
4. Calculate the chunksize(length to stream in bytes)
4. Set the partial content header(206) for the requested range of the audio that is being streamed; content-type - audio/mpeg, accept-ranges - bytes, content-length - chunksize and content-range - 'bytes ' + start + '-' + end + '/' + durationInBytes
5. Calculate the start in seconds using the start in bytes
6. Stream the section starting from the start time in seconds using the same stream-converting-stream process mention in [How is the audio streamed?](#how-is-the-audio-streamed?)

## Example
This app comes with a simple example for demonstration. This can be ran with the command `npm run example`. Please note that it requires that [ffmpeg](http://www.ffmpeg.org/) be installed locally
