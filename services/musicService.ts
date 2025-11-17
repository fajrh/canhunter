const YT_SCRIPT_ID = 'yt-iframe-api';
const VIDEO_ID = 'p6J5A_Fl-pA';
const BASE_VOLUME = 22;

class MusicService {
  private player: any = null;
  private apiReadyPromise: Promise<void> | null = null;
  private enabled: boolean = true;
  private hasTriedStart: boolean = false;
  private hasEverPlayed: boolean = false;

  private ensureApiScript() {
    if (document.getElementById(YT_SCRIPT_ID)) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.id = YT_SCRIPT_ID;
    document.body.appendChild(tag);
  }

  init() {
    if (this.apiReadyPromise) return this.apiReadyPromise;

    this.apiReadyPromise = new Promise<void>((resolve) => {
      const onApiReady = () => {
        if (this.player) {
          resolve();
          return;
        }

        this.player = new (window as any).YT.Player('yt-music-player', {
          height: '0',
          width: '0',
          videoId: VIDEO_ID,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            playlist: VIDEO_ID,
          },
          events: {
            onReady: () => {
              this.requestPlay(false);
              resolve();
            },
            onStateChange: (event: any) => {
              // Ensure looping on end
              if (event.data === (window as any).YT.PlayerState.ENDED) {
                this.player?.seekTo(0);
                if (this.enabled) this.player?.playVideo();
              }

              if (event.data === (window as any).YT.PlayerState.PLAYING) {
                this.hasTriedStart = true;
                this.hasEverPlayed = true;
              }

              if (
                event.data === (window as any).YT.PlayerState.PAUSED &&
                this.enabled
              ) {
                // Recover from autoplay blocks by retrying
                this.requestPlay(true);
              }
            },
          },
        });
      };

      if ((window as any).YT && (window as any).YT.Player) {
        onApiReady();
      } else {
        this.ensureApiScript();
        const previous = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          previous?.();
          onApiReady();
        };
      }
    });

    return this.apiReadyPromise;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.applyState();
  }

  private applyState() {
    if (!this.player) return;

    if (this.enabled) {
      this.requestPlay(true);
    } else {
      try {
        this.player.pauseVideo();
        this.player.mute();
      } catch (err) {
        console.warn('Background music pause failed:', err);
      }
    }
  }

  kickstartOnInteraction(enabled: boolean) {
    if (this.hasEverPlayed) return;
    const resume = () => {
      this.setEnabled(enabled);
    };
    window.addEventListener('pointerdown', resume, { once: true });
  }

  private requestPlay(unmute: boolean) {
    if (!this.player) return;

    try {
      if (unmute) {
        this.player.unMute();
        this.player.setVolume(BASE_VOLUME);
      } else {
        this.player.mute();
      }
      this.player.playVideo();
    } catch (err) {
      console.warn('Background music playback failed:', err);
    }
  }
}

export const musicService = new MusicService();
