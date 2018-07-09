var audio = document.getElementById("audio");
var audioControls = document.getElementById("audio-controls");

// Hide default controls
audio.controls = false;

// Display the user defined audio controls
audioControls.style.display = "block";

var playpause = document.getElementById("playpause");
var stop = document.getElementById("stop");
var mute = document.getElementById("mute");
var volinc = document.getElementById("volinc");
var voldec = document.getElementById("voldec");
var progress = document.getElementById("progress");
var progressBar = document.getElementById("progress-bar");

playpause.addEventListener("click", function(e) {
	if(e){
		console.log(e);
	}
	if (audio.paused || audio.ended) audio.play();
	else audio.pause();
});

stop.addEventListener("click", function(e) {
	if(e){
		console.log(e);
	}
	audio.pause();
	audio.currentTime = 0;
	progress.value = 0;
});

mute.addEventListener("click", function(e) {
	if(e){
		console.log(e);
	}
	audio.muted = !audio.muted;
});

volinc.addEventListener("click", function(e) {
	if(e){
		console.log(e);
	}
	alterVolume("+");
});

voldec.addEventListener("click", function(e) {
	if(e){
		console.log(e);
	}
	alterVolume("-");
});

audio.addEventListener("loadedmetadata", function() {
	progress.setAttribute("max", audio.duration);
});

audio.addEventListener("timeupdate", function() {
	progress.value = audio.currentTime;
	progressBar.style.width = Math.floor((audio.currentTime / audio.duration) * 100) + "%";
});

audio.addEventListener("timeupdate", function() {
	if (!progress.getAttribute("max")) progress.setAttribute("max", audio.duration);
	progress.value = audio.currentTime;
	progressBar.style.width = Math.floor((audio.currentTime / audio.duration) * 100) + "%";
});

progress.addEventListener("click", function(e) {
	var pos = (e.pageX  - this.offsetLeft) / this.offsetWidth;
	audio.currentTime = pos * audio.duration;
});

var alterVolume = function(dir) {
	var currentVolume = Math.floor(audio.volume * 10) / 10;
	if (dir === "+") {
		if (currentVolume < 1) audio.volume += 0.1;
	}
	else if (dir === "-") {
		if (currentVolume > 0) audio.volume -= 0.1;
	}
};