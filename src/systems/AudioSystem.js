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

    // Background music
    this.musicGain = this.audioContext.createGain();
    this.musicGain.connect(this.masterGain);
    this.musicGain.gain.value = 0.75; // Background music volume
    this.currentMusic = null;
    this.musicNodes = [];
    this.isMusicPlaying = false;

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
   * Start background music loop
   * Generates procedural dark ambient music
   */
  startMusic() {
    if (this.isMusicPlaying) return;

    console.log(
      "Starting music...",
      "Audio context state:",
      this.audioContext.state,
    );
    this.isMusicPlaying = true;
    this._playMusicLoop();
  }

  /**
   * Stop background music
   */
  stopMusic() {
    this.isMusicPlaying = false;
    this._stopAllMusicNodes();
  }

  /**
   * Play procedural music loop
   * @private
   */
  _playMusicLoop() {
    if (!this.isMusicPlaying) return;

    const now = this.audioContext.currentTime;
    const duration = 8; // 8-second loop

    console.log("Playing music loop at", now);

    // Bass drone
    this._createBassLine(now, duration);

    // Atmospheric pad
    this._createAtmosphericPad(now, duration);

    // Occasional high notes for tension
    this._createTensionNotes(now, duration);

    // Schedule next loop
    setTimeout(() => this._playMusicLoop(), duration * 1000);
  }

  /**
   * Create bass line
   * @private
   */
  _createBassLine(startTime, duration) {
    const bassOsc = this.audioContext.createOscillator();
    const bassGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(55, startTime); // A1 note

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, startTime);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(this.musicGain);

    bassGain.gain.setValueAtTime(0, startTime);
    bassGain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
    bassGain.gain.setValueAtTime(0.3, startTime + duration - 0.5);
    bassGain.gain.linearRampToValueAtTime(0, startTime + duration);

    bassOsc.start(startTime);
    bassOsc.stop(startTime + duration);

    // Clean up after the oscillator finishes
    bassOsc.onended = () => {
      const index = this.musicNodes.findIndex((n) => n.osc === bassOsc);
      if (index > -1) this.musicNodes.splice(index, 1);
    };

    this.musicNodes.push({ osc: bassOsc, gain: bassGain });
  }

  /**
   * Create atmospheric pad
   * @private
   */
  _createAtmosphericPad(startTime, duration) {
    const notes = [165, 196, 220]; // E3, G3, A3 - minor chord

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, startTime);
      filter.Q.setValueAtTime(1, startTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      const delay = i * 0.3;
      gain.gain.setValueAtTime(0, startTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, startTime + delay + 1);
      gain.gain.setValueAtTime(0.08, startTime + duration - 1);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime + delay);
      osc.stop(startTime + duration);

      // Clean up after the oscillator finishes
      osc.onended = () => {
        const index = this.musicNodes.findIndex((n) => n.osc === osc);
        if (index > -1) this.musicNodes.splice(index, 1);
      };

      this.musicNodes.push({ osc, gain });
    });
  }

  /**
   * Create tension notes
   * @private
   */
  _createTensionNotes(startTime, duration) {
    const tensionTimes = [2, 4.5, 6.8];
    const frequencies = [440, 494, 523]; // A4, B4, C5

    tensionTimes.forEach((time, i) => {
      if (Math.random() > 0.5) {
        // 50% chance for each note
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(
          frequencies[i % frequencies.length],
          startTime + time,
        );

        filter.type = "highpass";
        filter.frequency.setValueAtTime(400, startTime + time);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.05, startTime + time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + time + 1.5);

        osc.start(startTime + time);
        osc.stop(startTime + time + 1.5);

        // Clean up after the oscillator finishes
        osc.onended = () => {
          const index = this.musicNodes.findIndex((n) => n.osc === osc);
          if (index > -1) this.musicNodes.splice(index, 1);
        };

        this.musicNodes.push({ osc, gain });
      }
    });
  }

  /**
   * Stop all music nodes
   * @private
   */
  _stopAllMusicNodes() {
    const now = this.audioContext.currentTime;
    this.musicNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.stop(now + 0.1);
      } catch (e) {
        // Node might already be stopped
      }
    });
    this.musicNodes = [];
  }

  /**
   * Set music volume
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get music volume
   * @returns {number} Current music volume
   */
  getMusicVolume() {
    return this.musicGain.gain.value;
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
    this._previousMusicVolume = this.musicGain.gain.value;
    this.masterGain.gain.value = 0;
  }

  /**
   * Unmute audio
   */
  unmute() {
    this.masterGain.gain.value = this._previousVolume || 0.3;
    this.musicGain.gain.value = this._previousMusicVolume || 0.25;
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
