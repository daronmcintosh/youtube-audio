const controls = `
<div class="plyr__controls">
    <div class="plyr__time plyr__time--current" aria-label="Current time">00:00</div>
    <div class="plyr__progress">
        <input data-plyr="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek">
        <progress class="plyr__progress__buffer" min="0" max="100" value="0">% buffered</progress>
        <span role="tooltip" class="plyr__tooltip">00:00</span>
    </div>
    <div class="plyr__time plyr__time--duration" aria-label="Duration">00:00</div>
    <button type="button" class="plyr__control" aria-label="Mute" data-plyr="mute">
        <svg class="icon--pressed" role="presentation"><use xlink:href="#plyr-muted"></use></svg>
        <svg class="icon--not-pressed" role="presentation"><use xlink:href="#plyr-volume"></use></svg>
        <span class="label--pressed plyr__tooltip" role="tooltip">Unmute</span>
        <span class="label--not-pressed plyr__tooltip" role="tooltip">Mute</span>
    </button>
    <div class="plyr__volume">
        <input data-plyr="volume" type="range" min="0" max="1" step="0.05" value="1" autocomplete="off" aria-label="Volume">
    </div>
</div>
`;

var supportsAudio = !!document.createElement('audio').canPlayType;
if (supportsAudio) {
	var btnPrev = document.querySelector('#previous-button');
	var btnNext = document.querySelector('#next-button');
	var playPauseBtn = document.querySelector('#play-pause-button');
	var audioPlayer = document.querySelector('#audio-player');
	var playListItems = document.querySelectorAll('#plList li');
	var title = document.querySelector('#song-title');
	var trackCount = playListItems.length;
	var isPlaying = false;
	var index = 0;
	/*global Plyr*/
	new Plyr(audioPlayer, { controls });

	audioPlayer.addEventListener('seeking', () => {
		showPlayIcon();
	});

	audioPlayer.addEventListener('seeked', () => {
		isPlaying ? showPauseIcon() : showPlayIcon();
	});

	audioPlayer.addEventListener('play', () => {
		isPlaying = true;
	});

	audioPlayer.addEventListener('pause', () => {
		isPlaying = false;
	});

	audioPlayer.addEventListener('ended', () => {
		if ((index + 1) < trackCount) {
			index++;
			loadTrack(index);
			playSong();
		} else {
			isPlaying = false;
			index = 0;
			loadTrack(index);
			audioPlayer.pause();
			showPlayIcon();
		}
	});

	btnPrev.addEventListener('click', () => {
		if ((index - 1) > -1) {
			index--;
			loadTrack(index);
			if (isPlaying) {
				playSong();
			}
		} else {
			index = 0;
			loadTrack(index);
			audioPlayer.pause();
		}
	});

	playPauseBtn.addEventListener('click', () => {
		togglePlayPause();
	});

	btnNext.addEventListener('click', () => {
		if ((index + 1) < trackCount) {
			index++;
			loadTrack(index);
			if (isPlaying) {
				playSong();
			}
		} else {
			index = 0;
			loadTrack(index);
			audioPlayer.pause();
		}
	});

	playListItems.forEach(playListItem => {
		playListItem.addEventListener('click', () => {
			index = Number(playListItem.getAttribute('data-index')); //todo: fix this
			loadTrack(index);
			if (isPlaying) {
				playSong();
			}
		});
	});
	// select first track and play
	loadTrack(0);
	playSong();
}

function loadTrack(id) {
	playListItems.forEach((playListItem, i) => {
		if (i === id) {
			playListItem.classList.add('active');
			title.textContent = playListItem.querySelector('.plTitle').textContent;
			index = id;
			audioPlayer.src = playListItem.getAttribute('data-src');
			togglePlayPause();
		} else {
			playListItem.classList.remove('active');
		}
	});
}

function togglePlayPause() {
	if (isPlaying) {
		showPlayIcon();
		audioPlayer.pause();
	} else {
		playSong();
	}
}

function playSong() {
	// Play returns a promise so we have to handle that promise
	let playPromise = audioPlayer.play();

	if (playPromise !== undefined) {
		playPromise.then(() => {
			showPauseIcon();
		}).catch(error => {
			if (error) {
				// log this error
			}
		});
	}
}

function showPauseIcon() {
	playPauseBtn.classList.remove('fa-play');
	playPauseBtn.classList.add('fa-pause');
}

function showPlayIcon() {
	playPauseBtn.classList.remove('fa-pause');
	playPauseBtn.classList.add('fa-play');
}
