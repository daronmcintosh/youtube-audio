/*global io*/
var socket = io();

// Add Playlist Script for Playlist Page
if (document.getElementById('mainwrap')) {
	let script = document.createElement('script');
	script.src = '/js/playlist.js';
	document.body.appendChild(script);
}
// Add Plyr for Player Page
if (document.getElementById('player-page')) {
	let script = document.createElement('script');
	script.src = '/js/player.js';
	document.body.appendChild(script);
}
let errorMessage = document.querySelector('.alert-warning');
socket.on('video error', (message) => {
	errorMessage.style.display = 'block';
	errorMessage.textContent = message;
	setTimeout(() => {
		errorMessage.style.display = 'none';
	}, 10000);
});