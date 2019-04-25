/* global io*/
const socket = io();

// Add Playlist Script for Playlist Page
if (document.getElementById('mainwrap')) {
  const script = document.createElement('script');
  script.src = '/js/playlist.js';
  document.body.appendChild(script);
}
// Add Plyr for Player Page
if (document.getElementById('player-page')) {
  const script = document.createElement('script');
  script.src = '/js/player.js';
  document.body.appendChild(script);
}
const errorMessage = document.querySelector('.alert-warning');
socket.on('video error', message => {
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 10000);
});
