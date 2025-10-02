class GlobalMusicPlayer {
    constructor() {
           
        this.songs = [
            {
                id: 3,
                title: "Thorned Rose",
                artist: "Aria",
                cover: "Cover Image/3.png",
                audio: "music/3Thorned Rose.MP3"
            },
            {
                id: 4,
                title: "Behind The Smile",
                artist: "Aria",
                cover: "Cover Image/4.png",
                audio: "music/4Behind The Smile.MP3"
            },
            {
                id: 5,
                title: "Buzz Buzz Buzz",
                artist: "Aria",
                cover: "Cover Image/5.png",
                audio: "music/5Buzz Buzz Buzz .MP3"
            },
            {
                id: 6,
                title: "Drowning In The Black",
                artist: "Aria",
                cover: "Cover Image/6.png",
                audio: "music/6Drowning In The Black.MP3"
            },
            {
                id: 7,
                title: "Femme Fatale",
                artist: "Aria",
                cover: "Cover Image/7.png",
                audio: "music/7Femme Fatale.MP3"
            },
            {
                id: 8,
                title: "Gone In Time",
                artist: "Aria",
                cover: "Cover Image/8.png",
                audio: "music/8Gone In Time.MP3"
            },
            {
                id: 9,
                title: "He Fades Away",
                artist: "Aria",
                cover: "Cover Image/9.png",
                audio: "music/9He Fades Away.MP3"
            },
            {
                id: 10,
                title: "I Am Alive",
                artist: "Aria",
                cover: "Cover Image/10.png",
                audio: "music/10I Am Alive.MP3"
            },
            {
                id: 11,
                title: "Lost",
                artist: "Aria",
                cover: "Cover Image/11.png",
                audio: "music/11lost.MP3"
            },
            {
                id: 12,
                title: "Music,Music,Music",
                artist: "Aria",
                cover: "Cover Image/12.png",
                audio: "music/12Music,Music,Music.MP3"
            },
            {
                id: 13,
                title: "Paper Hearts",
                artist: "Aria",
                cover: "Cover Image/13.png",
                audio: "music/13Paper Hearts.MP3"
            }
        ];

        this.currentSongIndex = -1;    
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.isDragging = false;

        this.init();
    }

    init() {
           
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevSong');
        this.nextBtn = document.getElementById('nextSong');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTimeSpan = document.getElementById('currentTime');
        this.totalTimeSpan = document.getElementById('totalTime');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.currentCover = document.getElementById('currentCover');
        this.currentTitle = document.getElementById('currentTitle');
        this.currentArtist = document.getElementById('currentArtist');
        this.playIcon = this.playPauseBtn.querySelector('.play-icon');
        this.pauseIcon = this.playPauseBtn.querySelector('.pause-icon');

           
        this.bindEvents();
        
           
        this.audioPlayer.volume = this.volume;
        this.volumeSlider.value = this.volume * 100;

           
        this.setDefaultState();
    }

    bindEvents() {
           
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
           
        this.prevBtn.addEventListener('click', () => this.previousSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        
           
        this.audioPlayer.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audioPlayer.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audioPlayer.addEventListener('ended', () => this.onSongEnded());
        this.audioPlayer.addEventListener('error', (e) => this.onAudioError(e));
        
           
        this.progressBar.addEventListener('click', (e) => this.onProgressBarClick(e));
        this.progressHandle.addEventListener('mousedown', (e) => this.onProgressHandleMouseDown(e));
        
           
        this.volumeSlider.addEventListener('input', (e) => this.onVolumeChange(e));
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        
           
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
    }

    setDefaultState() {
           
        this.currentCover.src = 'logo.jpg';
        this.currentTitle.textContent = 'Choose a song';
        this.currentArtist.textContent = 'Aria';
        
           
        this.progressFill.style.width = '0%';
        this.progressHandle.style.left = '0%';
        this.currentTimeSpan.textContent = '0:00';
        this.totalTimeSpan.textContent = '0:00';
        
           
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        
           
        this.playPauseBtn.disabled = true;
        this.playPauseBtn.style.opacity = '0.5';
    }

       
    playSongByIndex(index) {
        if (index >= 0 && index < this.songs.length) {
            this.currentSongIndex = index;
            
               
            this.playPauseBtn.disabled = false;
            this.playPauseBtn.style.opacity = '1';
            
            this.loadCurrentSong();
            this.play();
        }
    }

    loadCurrentSong() {
        if (this.currentSongIndex === -1) {
            this.setDefaultState();
            return;
        }
        
        const song = this.songs[this.currentSongIndex];
        this.audioPlayer.src = song.audio;
        this.currentCover.src = song.cover;
        this.currentTitle.textContent = song.title;
        this.currentArtist.textContent = song.artist;
        
           
        this.updateActiveCard();
    }

    updateActiveCard() {
        const songCards = document.querySelectorAll('.song-card');
        songCards.forEach((card, index) => {
            if (index === this.currentSongIndex) {
                card.classList.add('playing');
            } else {
                card.classList.remove('playing');
            }
        });
    }

    togglePlayPause() {
        if (this.currentSongIndex === -1) {
            return;    
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.audioPlayer.src) {
            this.audioPlayer.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
            }).catch(error => {
                console.error('播放失败:', error);
            });
        }
    }

    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }
    }

    previousSong() {
        if (this.currentSongIndex === -1) return;
        this.currentSongIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        this.loadCurrentSong();
        if (this.isPlaying) {
            this.play();
        }
    }

    nextSong() {
        if (this.currentSongIndex === -1) return;
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        this.loadCurrentSong();
        if (this.isPlaying) {
            this.play();
        }
    }

    onLoadedMetadata() {
        this.duration = this.audioPlayer.duration;
        this.totalTimeSpan.textContent = this.formatTime(this.duration);
    }

    onTimeUpdate() {
        if (!this.isDragging) {
            this.currentTime = this.audioPlayer.currentTime;
            this.updateProgress();
        }
    }

    updateProgress() {
        const progress = (this.currentTime / this.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressHandle.style.left = `${progress}%`;
        this.currentTimeSpan.textContent = this.formatTime(this.currentTime);
    }

    onProgressBarClick(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progress = clickX / rect.width;
        const newTime = progress * this.duration;
        
        this.audioPlayer.currentTime = newTime;
        this.currentTime = newTime;
        this.updateProgress();
    }

    onProgressHandleMouseDown(e) {
        this.isDragging = true;
        e.preventDefault();
    }

    onMouseMove(e) {
        if (this.isDragging) {
            const rect = this.progressBar.getBoundingClientRect();
            const moveX = e.clientX - rect.left;
            const progress = Math.max(0, Math.min(1, moveX / rect.width));
            const newTime = progress * this.duration;
            
            this.currentTime = newTime;
            this.updateProgress();
        }
    }

    onMouseUp() {
        if (this.isDragging) {
            this.audioPlayer.currentTime = this.currentTime;
            this.isDragging = false;
        }
    }

    onVolumeChange(e) {
        this.volume = e.target.value / 100;
        this.audioPlayer.volume = this.volume;
    }

    toggleMute() {
        if (this.audioPlayer.volume > 0) {
            this.audioPlayer.volume = 0;
            this.volumeSlider.value = 0;
        } else {
            this.audioPlayer.volume = this.volume;
            this.volumeSlider.value = this.volume * 100;
        }
    }

    onSongEnded() {
        this.nextSong();
    }

    onAudioError(e) {
        console.error('音频加载错误:', e);
        this.currentTitle.textContent = '音频加载失败';
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

       
    bindSongCardEvents() {
        const songCards = document.querySelectorAll('.song-card');
        songCards.forEach((card, index) => {
               
            card.removeEventListener('click', card._clickHandler);
            
               
            card._clickHandler = () => {
                this.playSongByIndex(index);
            };
            
            card.addEventListener('click', card._clickHandler);
            
               
            if (!card.querySelector('.play-overlay')) {
                const playOverlay = document.createElement('div');
                playOverlay.className = 'play-overlay';
                playOverlay.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="12" fill="rgba(255, 107, 53, 0.9)"/>
                        <path d="M10 8L16 12L10 16V8Z" fill="white"/>
                    </svg>
                `;
                const coverElement = card.querySelector('.song-cover');
                if (coverElement) {
                    coverElement.appendChild(playOverlay);
                }
            }
        });
    }
}

   
let globalMusicPlayer;

   
document.addEventListener('DOMContentLoaded', () => {
    globalMusicPlayer = new GlobalMusicPlayer();
    window.globalMusicPlayer = globalMusicPlayer;    
});