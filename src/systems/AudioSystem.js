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

  // ─── Internal helpers ───────────────────────────────────────────

  /** Create a buffer filled with white noise */
  _noiseBuffer(seconds = 1) {
    const sr     = this.audioContext.sampleRate;
    const frames = Math.ceil(sr * seconds);
    const buf    = this.audioContext.createBuffer(1, frames, sr);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Play a noise burst through a bandpass + gain envelope */
  _noiseBurst({ freq = 200, q = 1, filterType = "bandpass", vol = 0.4,
                attack = 0, decay = 0.12, dur = 0.15 }) {
    const ctx  = this.audioContext;
    const now  = ctx.currentTime;
    const src  = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(dur + 0.05);
    const filt = ctx.createBiquadFilter();
    filt.type  = filterType;
    filt.frequency.value = freq;
    filt.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    src.connect(filt); filt.connect(gain); gain.connect(this.masterGain);
    src.start(now); src.stop(now + dur);
  }

  /** Play a tonal burst (oscillator + gain envelope) */
  _toneBurst({ type = "sine", freq = 120, freqEnd = null, vol = 0.25,
               attack = 0, decay = 0.15, dur = 0.2 }) {
    const ctx  = this.audioContext;
    const now  = ctx.currentTime;
    const osc  = ctx.createOscillator();
    osc.type   = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(now); osc.stop(now + dur);
  }

  // ─── Weapon-type metadata ────────────────────────────────────────
  _getWeaponSoundProfile(weaponName) {
    const n = (weaponName ?? "").toLowerCase();
    if (n === "shotgun") return { body: 0.9, snap: 100, snapQ: 0.8, tail: 0.55, tailFreq: 90 };
    if (n === "rifle")   return { body: 0.55, snap: 220, snapQ: 1.8, tail: 0.28, tailFreq: 160 };
    /* pistol default */ return { body: 0.7,  snap: 160, snapQ: 1.2, tail: 0.38, tailFreq: 110 };
  }

  /**
   * Play a sound effect.
   * @param {string} type - 'shoot', 'hit', 'death', 'footstep', 'reload',
   *                        'reload_end', 'empty', 'ambience'
   * @param {Object} options - { weaponName }
   */
  playSound(type, options = {}) {
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    switch (type) {

      // ── Gunshot ─────────────────────────────────────────────────
      case "shoot": {
        const p = this._getWeaponSoundProfile(options.weaponName);

        // Low-end body thump
        this._noiseBurst({ freq: 55, q: 0.5, filterType: "lowpass",
          vol: p.body, attack: 0, decay: 0.18, dur: 0.22 });

        // Mid crack / snap
        this._noiseBurst({ freq: p.snap, q: p.snapQ, filterType: "bandpass",
          vol: 0.5, attack: 0, decay: 0.08, dur: 0.12 });

        // High transient click (the actual mechanical "crack")
        this._noiseBurst({ freq: 2800, q: 0.6, filterType: "highpass",
          vol: 0.35, attack: 0, decay: 0.025, dur: 0.04 });

        // Resonant tail / room reverb illusion
        this._noiseBurst({ freq: p.tailFreq, q: 3, filterType: "bandpass",
          vol: p.tail, attack: 0.01, decay: 0.35, dur: 0.45 });

        // Sub thump
        this._toneBurst({ type: "sine", freq: 42, freqEnd: 22,
          vol: 0.3, decay: 0.18, dur: 0.22 });
        break;
      }

      // ── Bullet impact / flesh hit ────────────────────────────────
      case "hit": {
        // Wet thud — bandpass noise burst
        this._noiseBurst({ freq: 220, q: 1.5, vol: 0.35, decay: 0.12, dur: 0.18 });
        // Sharp smack transient
        this._noiseBurst({ freq: 800, q: 0.8, filterType: "highpass",
          vol: 0.2, decay: 0.04, dur: 0.06 });
        // Low body resonance
        this._toneBurst({ type: "sine", freq: 85, freqEnd: 50,
          vol: 0.2, decay: 0.14, dur: 0.18 });
        break;
      }

      // ── Enemy death ──────────────────────────────────────────────
      case "death": {
        // Guttural groan — three detuned sines fading
        [80, 95, 72].forEach((f, i) => {
          this._toneBurst({ type: "sawtooth", freq: f, freqEnd: f * 0.4,
            vol: 0.18, attack: 0.02, decay: 0.55, dur: 0.7 });
        });
        // Thud
        this._noiseBurst({ freq: 70, q: 0.6, filterType: "lowpass",
          vol: 0.4, decay: 0.22, dur: 0.3 });
        // High wheeze
        this._noiseBurst({ freq: 600, q: 2, filterType: "bandpass",
          vol: 0.12, attack: 0.05, decay: 0.4, dur: 0.55 });
        break;
      }

      // ── Footstep ─────────────────────────────────────────────────
      case "footstep": {
        const pitchShift = 0.9 + Math.random() * 0.2;
        // Foot impact transient
        this._noiseBurst({ freq: 100 * pitchShift, q: 1.2, filterType: "lowpass",
          vol: 0.22, decay: 0.06, dur: 0.09 });
        // Subtle floor resonance
        this._toneBurst({ type: "sine", freq: 55 * pitchShift, freqEnd: 35 * pitchShift,
          vol: 0.08, decay: 0.07, dur: 0.1 });
        break;
      }

      // ── Reload (magazine out / bolt action) ──────────────────────
      case "reload": {
        // Magazine eject click
        this._noiseBurst({ freq: 1800, q: 3, filterType: "bandpass",
          vol: 0.25, decay: 0.04, dur: 0.06 });
        // Plastic/metal slide sound
        this._noiseBurst({ freq: 400, q: 1.5, vol: 0.2,
          attack: 0.01, decay: 0.12, dur: 0.18 });
        break;
      }

      // ── Reload complete (magazine click / chamber) ───────────────
      case "reload_end": {
        // Hard click
        this._noiseBurst({ freq: 2200, q: 4, filterType: "bandpass",
          vol: 0.3, decay: 0.03, dur: 0.05 });
        // Bolt/slide snap
        this._noiseBurst({ freq: 600, q: 2, vol: 0.22, decay: 0.06, dur: 0.09 });
        // Metallic ring
        this._toneBurst({ type: "sine", freq: 1200, freqEnd: 800,
          vol: 0.1, decay: 0.12, dur: 0.18 });
        break;
      }

      // ── Dry fire (empty) ─────────────────────────────────────────
      case "empty": {
        // Thin metallic click
        this._noiseBurst({ freq: 3000, q: 5, filterType: "bandpass",
          vol: 0.18, decay: 0.025, dur: 0.04 });
        this._toneBurst({ type: "sine", freq: 900, freqEnd: 600,
          vol: 0.08, decay: 0.05, dur: 0.07 });
        break;
      }

      // ── Ambient drip/creak ───────────────────────────────────────
      case "ambience": {
        const choice = Math.random();
        if (choice < 0.4) {
          // Distant drip
          this._toneBurst({ type: "sine",
            freq: 600 + Math.random() * 200, freqEnd: 300,
            vol: 0.06, attack: 0, decay: 0.5, dur: 0.6 });
        } else if (choice < 0.7) {
          // Low rumble
          this._noiseBurst({ freq: 40 + Math.random() * 20, q: 0.5,
            filterType: "lowpass", vol: 0.04, attack: 0.3, decay: 1.2, dur: 1.8 });
        } else {
          // Distant metallic creak
          this._noiseBurst({ freq: 800 + Math.random() * 400, q: 6,
            filterType: "bandpass", vol: 0.07, attack: 0.05, decay: 0.6, dur: 0.8 });
        }
        break;
      }

      default: break;
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
