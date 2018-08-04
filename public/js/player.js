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
	var audioPlayer = document.querySelector('#audio-player');
	var playPauseBtn = document.querySelector('#play-pause-button');
	/*global Plyr*/
	new Plyr(audioPlayer, { controls });

	var isPlaying = false;

	audioPlayer.addEventListener('play', () => {
		isPlaying = true;
	});

	audioPlayer.addEventListener('pause', () => {
		isPlaying = false;
	});

	audioPlayer.addEventListener('ended', ()=>{
		isPlaying = false;
		audioPlayer.currentTime = 0;
		showPlayIcon();
	});

	playPauseBtn.addEventListener('click', () => {
		togglePlayPause();
	});
	playSong();
}

function togglePlayPause() {
	if (isPlaying) {
		showPlayIcon();
		audioPlayer.pause();
	} else {
		playSong();
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

function playSong() {
	// Play returns a promise so we have to handle that promise
	let playPromise = audioPlayer.play();

	if (playPromise !== undefined) {
		playPromise.then(() => {
			showPauseIcon();
		}).catch(error => {
			if (error) {
				// alert('There was an error playing. Try clicking play or refreshing');
			}
		});
	}
}