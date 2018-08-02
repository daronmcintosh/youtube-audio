var supportsAudio = !!document.createElement("audio").canPlayType;
if (supportsAudio) {
	var btnPrev = document.getElementById("btnPrev");
	var btnNext = document.getElementById("btnNext");
	var audioPlayer = document.getElementById("audio-player")
	var npAction = document.getElementById("npAction");
	var npTitle = document.getElementById("npTitle");
	var playListItems = document.querySelectorAll("#plList li");
	var trackCount = playListItems.length;
	var playing = false;
	var index = 0;
	new Plyr("#audio-player");


	audioPlayer.addEventListener("play", function () {
		playing = true;
		npAction.textContent = "Now Playing...";
	});
	audioPlayer.addEventListener("pause", function () {
		playing = false;
		npAction.textContent = "Paused...";
	});
	audioPlayer.addEventListener("ended", function () {
		npAction.textContent = "Paused...";
		if ((index + 1) < trackCount) {
			index++;
			loadTrackAndPlay(index);
			audioPlayer.play();
		} else {
			index = 0;
			loadTrackAndPlay(index);
			audioPlayer.pause();
		}
	});

	for (let i = 0; i < playListItems.length; i++) {
		playListItems[i].addEventListener("click", function () {
			index = Number(this.getAttribute("data-index"));
			loadTrackAndPlay(index);
		});
	}
	btnPrev.addEventListener("click", function () {
		if ((index - 1) > -1) {
			index--;
			loadTrackAndPlay(index);
			if (playing) {
				audioPlayer.play();
			}
		} else {
			index = 0;
			loadTrackAndPlay(index);
			audioPlayer.pause();
		}
	});
	btnNext.addEventListener("click", function () {
		if ((index + 1) < trackCount) {
			index++;
			loadTrackAndPlay(index);
			if (playing) {
				audioPlayer.play();
			}
		} else {
			index = 0;
			loadTrackAndPlay(index);
			audioPlayer.pause();
		}
	});
	// select first track and play
	loadTrackAndPlay(0);
}




function loadTrackAndPlay(id) {
	var audioPlayer = document.getElementById("audio-player")
	for (var i = 0; i < playListItems.length; i++) {
		if (i === id) {
			playListItems[id].classList.add("active");
			npTitle.textContent = playListItems[id].getElementsByClassName("plTitle")[0].textContent;
			index = id;
			audioPlayer.src = playListItems[id].getAttribute("data-src");
			audioPlayer.play();
		} else {
			playListItems[i].classList.remove("active");
		}
	}
}