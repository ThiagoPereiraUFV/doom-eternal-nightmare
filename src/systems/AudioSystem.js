/**
 * Audio System - Singleton Pattern
 * Handles all audio playback with procedural generation
 * Following SRP - only audio management
 */

export class AudioSystem {
  static _instance = null;

  constructor() {
    if (AudioSystem._instance) {
      return AudioSystem._instance;
    }

    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3;

    this.sounds = new Map();
    this.ambienceInterval = null;

    AudioSystem._instance = this;
  }

  /**
   * Get singleton instance
   * @returns {AudioSystem} Singleton instance
   */
  static getInstance() {
    if (!AudioSystem._instance) {
      new AudioSystem();
    }
    return AudioSystem._instance;
  }

  /**
   * Play a sound effect
   * @param {string} type - Sound type ('shoot', 'hit', 'death', 'footstep', etc.)
   * @param {Object} options - Sound options
   */
  playSound(type, options = {}) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    const now = this.audioContext.currentTime;

    // Start oscillator before scheduling stop
    oscillator.start(now);

    switch (type) {
      case "shoot":
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.stop(now + 0.1);
        break;

      case "hit":
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.stop(now + 0.15);
        break;

      case "death":
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.stop(now + 0.5);
        break;

      case "footstep":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(60 + Math.random() * 20, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.stop(now + 0.05);
        break;

      case "reload":
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.stop(now + 0.2);
        break;

      case "empty":
        oscillator.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.stop(now + 0.05);
        break;

      case "ambience":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(30 + Math.random() * 20, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.05, now + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 2);
        oscillator.stop(now + 2);
        break;
    }
  }

  /**
   * Start ambient sound loop
   * @param {number} interval - Interval in milliseconds
   */
  startAmbience(interval = 3000) {
    this.stopAmbience();
    this.ambienceInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        this.playSound("ambience");
      }
    }, interval);
  }

  /**
   * Stop ambient sound loop
   */
  stopAmbience() {
    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval);
      this.ambienceInterval = null;
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get master volume
   * @returns {number} Current volume level
   */
  getVolume() {
    return this.masterGain.gain.value;
  }

  /**
   * Mute all audio
   */
  mute() {
    this._previousVolume = this.masterGain.gain.value;
    this.masterGain.gain.value = 0;
  }

  /**
   * Unmute audio
   */
  unmute() {
    this.masterGain.gain.value = this._previousVolume || 0.3;
  }

  /**
   * Resume audio context (required for some browsers)
   */
  resume() {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }
}

export default AudioSystem;
