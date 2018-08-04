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