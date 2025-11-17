const SC_SCRIPT_ID = 'sc-widget-api';
const PLAYER_ID = 'sc-music-player';
const BASE_VOLUME = 18;

class MusicService {
  private widget: any = null;
  private apiReadyPromise: Promise<void> | null = null;
  private enabled: boolean = true;
  private hasEverPlayed: boolean = false;

  private ensureApiScript() {
    if (document.getElementById(SC_SCRIPT_ID)) return;
    const tag = document.createElement('script');
    tag.src = 'https://w.soundcloud.com/player/api.js';
    tag.id = SC_SCRIPT_ID;
    document.body.appendChild(tag);
  }

  init() {
    if (this.apiReadyPromise) return this.apiReadyPromise;

    this.apiReadyPromise = new Promise<void>((resolve) => {
      const setupWidget = () => {
        if (this.widget) {
          resolve();
          return;
        }

        const iframe = document.getElementById(
          PLAYER_ID,
        ) as HTMLIFrameElement | null;

        if (!iframe || !(window as any).SC?.Widget) {
          resolve();
          return;
        }

        this.widget = (window as any).SC.Widget(iframe);

        this.widget.bind((window as any).SC.Widget.Events.READY, () => {
          this.requestPlay(false);
          this.applyState();
          resolve();
        });

        this.widget.bind((window as any).SC.Widget.Events.PLAY, () => {
          this.hasEverPlayed = true;
        });

        this.widget.bind((window as any).SC.Widget.Events.PAUSE, () => {
          if (this.enabled) {
            this.requestPlay(true);
          }
        });

        this.widget.bind((window as any).SC.Widget.Events.FINISH, () => {
          try {
            this.widget.seekTo(0);
            if (this.enabled) {
              this.widget.play();
            }
          } catch (err) {
            console.warn('Background music loop failed:', err);
          }
        });
      };

      if ((window as any).SC && (window as any).SC.Widget) {
        setupWidget();
      } else {
        this.ensureApiScript();
        const script = document.getElementById(SC_SCRIPT_ID) as
          | HTMLScriptElement
          | null;

        script?.addEventListener('load', () => setupWidget(), { once: true });
      }
    });

    return this.apiReadyPromise;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.applyState();
  }

  private applyState() {
    if (!this.widget) return;

    if (this.enabled) {
      this.requestPlay(true);
    } else {
      try {
        this.widget.setVolume(0);
        this.widget.pause();
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
    if (!this.widget) return;

    try {
      this.widget.setVolume(unmute ? BASE_VOLUME : 0);
      this.widget.play();
    } catch (err) {
      console.warn('Background music playback failed:', err);
    }
  }
}

export const musicService = new MusicService();
