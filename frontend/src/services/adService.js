// Placeholder for a real ad SDK integration
// This would be replaced with actual ad provider SDK

// Mock ad service for development
class AdService {
  constructor() {
    this.adCallback = null;
    this.isAdPlaying = false;
    this.skippableAfter = 15; // seconds
    this.adDuration = 60; // seconds
    this.currentAd = null;
    this.timer = null;
    this.secondsWatched = 0;
  }

  // Initialize the ad service
  init() {
    console.log('Ad service initialized');
    return Promise.resolve();
  }

  // Load an ad
  loadAd() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentAd = {
          id: 'ad_' + Math.random().toString(36).substr(2, 9),
          title: 'Crypto Ad',
          description: 'Watch this ad to earn mining time',
        };
        resolve(this.currentAd);
      }, 500); // Simulate ad loading time
    });
  }

  // Start playing an ad with callback for events
  playAd(callback) {
    if (!this.currentAd) {
      return Promise.reject(new Error('No ad loaded'));
    }

    this.adCallback = callback;
    this.isAdPlaying = true;
    this.secondsWatched = 0;
    
    // Simulate ad progress
    callback({ type: 'started', ad: this.currentAd });
    
    this.timer = setInterval(() => {
      this.secondsWatched++;
      
      // Notify skippable state
      if (this.secondsWatched === this.skippableAfter) {
        callback({ type: 'skippable', ad: this.currentAd });
      }
      
      // Update time progress
      callback({ type: 'progress', ad: this.currentAd, secondsWatched: this.secondsWatched, totalSeconds: this.adDuration });
      
      // End ad after duration
      if (this.secondsWatched >= this.adDuration) {
        this.stopAd();
        callback({ type: 'completed', ad: this.currentAd, secondsWatched: this.secondsWatched });
      }
    }, 1000);

    return Promise.resolve();
  }

  // Skip the current ad
  skipAd() {
    if (!this.isAdPlaying || this.secondsWatched < this.skippableAfter) {
      return;
    }
    
    this.stopAd();
    
    if (this.adCallback) {
      this.adCallback({ type: 'skipped', ad: this.currentAd, secondsWatched: this.secondsWatched });
    }
  }

  // Stop the current ad
  stopAd() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.isAdPlaying = false;
  }

  // Get ad duration watched
  getSecondsWatched() {
    return this.secondsWatched;
  }

  // Check if ad is currently playing
  isPlaying() {
    return this.isAdPlaying;
  }

  // Check if ad is skippable
  isSkippable() {
    return this.secondsWatched >= this.skippableAfter;
  }
  
  // Get current ad info
  getCurrentAd() {
    return this.currentAd;
  }
}

export default new AdService(); 