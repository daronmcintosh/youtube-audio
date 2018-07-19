

// Add Playlist Script for Playlist Page
if (document.getElementById("mainwrap")) {
	let script = document.createElement("script");
	script.src = "/js/playlist.js";
	document.body.appendChild(script);
}
// Add Plyr for Player Page
if (document.getElementById("audioContainer")) {
	let script = document.createElement("script");
	script.textContent = "new Plyr('.js-player');";
	document.body.appendChild(script);
}