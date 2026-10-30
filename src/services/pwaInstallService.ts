/**
 * PWA Install & App Download Service
 * Manages beforeinstallprompt events, standalone status, and app download triggers.
 */

type InstallListener = () => void;

class PWAInstallService {
  private deferredPrompt: any = null;
  private isAppInstalled = false;
  private listeners: Set<InstallListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkStandalone();

      window.addEventListener('beforeinstallprompt', (e: Event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        this.deferredPrompt = e;
        this.notifyListeners();
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.isAppInstalled = true;
        try {
          localStorage.setItem('climb1600_just_downloaded', 'true');
          localStorage.setItem('climb1600_has_downloaded', 'true');
        } catch {
          // Ignore local storage error
        }
        this.notifyListeners();
        // Dispatch custom event so App component can trigger the splash loading screen
        window.dispatchEvent(new CustomEvent('climb1600:app-downloaded'));
      });
    }
  }

  private checkStandalone(): void {
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    this.isAppInstalled = isStandalone;
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  public isStandalone(): boolean {
    this.checkStandalone();
    return this.isAppInstalled;
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }
    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners();
      return choiceResult.outcome === 'accepted';
    } catch (err) {
      console.warn('[PWA] Prompt installation error:', err);
      return false;
    }
  }

  public subscribe(listener: InstallListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('[PWA] Listener callback error:', e);
      }
    });
  }
}

export const pwaInstallService = new PWAInstallService();
