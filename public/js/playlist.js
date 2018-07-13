var supportsAudio = !!document.createElement("audio").canPlayType;
if (supportsAudio) {
	var audioTags = document.getElementsByTagName("audio");
	var liTags = document.querySelectorAll("#plList li");
	var btnPrev = document.getElementById("btnPrev");
	var btnNext = document.getElementById("btnNext");
	var index = 0;
	var playing = false;
	var trackCount = audioTags.length;
	var npAction = document.getElementById("npAction");
	var npTitle = document.getElementById("npTitle");
	var playListItems = document.querySelectorAll("#plList li");

	const players = Plyr.setup(".js-player");
	hidePlyrs(index);

	for (let i = 0; i < trackCount; i++) {
		audioTags[i].addEventListener("play", function () {
			playing = true;
			npAction.textContent = "Now Playing...";
		});
		audioTags[i].addEventListener("pause", function () {
			playing = false;
			npAction.textContent = "Paused...";
		});
		audioTags[i].addEventListener("ended", function () {
			npAction.textContent = "Paused...";
			if ((index + 1) < trackCount) {
				index++;
				loadTrack(index);
				hidePlyrs(index);
				players[index].play();
			} else {
				players[index].pause();
				index = 0;
				loadTrack(index);
				hidePlyrs(index);
			}
		});
	}
	for(let i = 0; i < liTags.length; i++){
		liTags[i].addEventListener("click", function(){
			// stop song, set index, load track, hide plyrs then play track
			players[index].stop();
			index = Number(this.getAttribute("data-index"));
			loadTrack(index);
			hidePlyrs(index);
			playTrack(index, players);
		});
	}
	btnPrev.addEventListener("click", function () {
		if ((index - 1) > -1) {
			players[index].stop();
			index--;
			loadTrack(index);
			hidePlyrs(index);
			if (playing) {
				players[index].play();
			}
		} else {
			players[index].pause();
			index = 0;
			loadTrack(index);
			hidePlyrs(index);
		}
	});
	btnNext.addEventListener("click", function () {
		if ((index + 1) < trackCount) {
			players[index].stop();
			index++;
			loadTrack(index);
			hidePlyrs(index);
			if (playing) {
				players[index].play();
			}
		} else {
			players[index].pause();
			index = 0;
			loadTrack(index);
			hidePlyrs(index);
		}
	});

	// select first track and play
	loadTrack(0);
	playTrack(0, players);
}

function loadTrack(id) {
	for (var i = 0; i < playListItems.length; i++) {
		if (i === id) {
			playListItems[id].classList.add("plSel");
			npTitle.textContent = playListItems[id].getElementsByClassName("plTitle")[0].textContent;
			index = id;
			// audio.src = playListItems[i].getAttribute("data-src");
		} else {
			playListItems[i].classList.remove("plSel");
		}
	}
}

function playTrack(id, players) {
	loadTrack(id);
	players[index].play();
}

// hide every player except the one passed
function hidePlyrs(id) {
	var players = document.getElementsByClassName("plyr");
	for (var i = 0; i < audioTags.length; i++) {
		if (i === id) {
			players[i].style.display = "block";
		} else {
			players[i].style.display = "none";
		}
	}
}