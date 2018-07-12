var supportsAudio = !!document.createElement("audio").canPlayType;
if (supportsAudio) {
	var index = 0;
	var playing = false;
	var trackCount = document.getElementsByClassName("plItem").length;
	var npAction = document.getElementById("npAction");
	var npTitle = document.getElementById("npTitle");
	var audio = document.getElementById("audio1");
	var btnPrev = document.getElementById("btnPrev");
	var btnNext = document.getElementById("btnNext");
	var playListItems = document.querySelectorAll("#plList li");

	audio.addEventListener("play", function () {
		playing = true;
		npAction.textContent = "Now Playing...";
	});
	audio.addEventListener("pause", function () {
		playing = false;
		npAction.textContent = "Paused...";
	});
	audio.addEventListener("ended", function () {
		npAction.textContent = "Paused...";
		if ((index + 1) < trackCount) {
			index++;
			loadTrack(index);
			audio.play();
		} else {
			audio.pause();
			index = 0;
			loadTrack(index);
		}
	});
	btnPrev.addEventListener("click", function () {
		if ((index - 1) > -1) {
			index--;
			loadTrack(index);
			if (playing) {
				audio.play();
			}
		} else {
			audio.pause();
			index = 0;
			loadTrack(index);
		}
	});
	btnNext.addEventListener("click", function () {
		if ((index + 1) < trackCount) {
			index++;
			loadTrack(index);
			if (playing) {
				audio.play();
			}
		} else {
			audio.pause();
			index = 0;
			loadTrack(index);
		}
	});

	document.getElementsByTagName("ul")[0].onclick = function (e) {
		var el = e.target;
		while (el != document.body && el.tagName.toLowerCase() != "li") {
			el = el.parentNode;
		}
		var id = [].indexOf.call(el.parentNode.children, el);
		if (id !== index) {
			playTrack(id);
		}
	};

	loadTrack(0);

	// initialize plyr
	var player = new Plyr("#audio1", {
		controls: [
			"restart",
			"play",
			"progress",
			"current-time",
			"duration",
			"mute",
			"volume"
		]
	});
}

function loadTrack(id) {
	for (var i = 0; i < playListItems.length; i++) {
		if (i === id) {
			playListItems[id].classList.add("plSel");
			npTitle.textContent = playListItems[id].getElementsByClassName("plTitle")[0].textContent;
			index = id;
			audio.src = playListItems[i].getAttribute("data-src");
		} else {
			playListItems[i].classList.remove("plSel");
		}
	}
}

function playTrack(id) {
	loadTrack(id);
	audio.play();
}