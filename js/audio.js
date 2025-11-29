/**
 * Audio System for Magitech Engine
 * Procedurally generated audio using Web Audio API
 */
const AudioSystem = {
    ctx: null,
    isMuted: false,
    initialized: false,
    masterGain: null,
    bgmNodes: [],

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3; // Respect initial mute state
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
            this.startBGM();
            console.log("Audio System Initialized");
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            const t = this.ctx.currentTime;
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.3, t, 0.1);
        }
        return this.isMuted;
    },

    startBGM() {
        if (!this.ctx) return;

        // Magitech Drone (Dark & Electrical)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();

        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Deep Drone (D2 = 73.42 Hz)
        osc1.type = 'sawtooth';
        osc1.frequency.value = 73.42;

        // Detuned Drone
        osc2.type = 'triangle';
        osc2.frequency.value = 72.80;

        // Filter Setup
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        filter.Q.value = 2;

        // LFO for filter sweep
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05; // Very slow cycle (20s)
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 150;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        // Mix
        gain.gain.value = 0.15;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start();
        osc2.start();
        lfo.start();

        this.bgmNodes.push(osc1, osc2, lfo);
    },

    playSFX(type) {
        if (!this.initialized) return; // Wait for user interaction to init
        this.resume();
        if (this.isMuted) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        switch (type) {
            case 'click': // UI Click
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.start(t);
                osc.stop(t + 0.05);
                break;

            case 'place': // Place Component (High tech beep)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'delete': // Remove Component (Static burst)
                osc.disconnect(); // Don't use the simple osc
                this.createNoise(t, 0.1, 500, 100);
                break;

            case 'rotate': // Rotate (Mechanical click)
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, t);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                osc.start(t);
                osc.stop(t + 0.03);
                break;

            case 'spawn': // Particle Spawn (Charge up)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.linearRampToValueAtTime(600, t + 0.2);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.001, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;

            case 'boost': // Rail Boost (Zap)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, t);
                osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                break;

            case 'score': // Score (Chime)
                this.playTone(523.25, t, 0.1, 'sine'); // C5
                this.playTone(659.25, t + 0.05, 0.1, 'sine'); // E5
                this.playTone(783.99, t + 0.1, 0.2, 'sine'); // G5
                break;

            case 'explode': // Explosion
                this.createNoise(t, 0.6, 800, 50);
                break;

            case 'error':
                 osc.type = 'sawtooth';
                 osc.frequency.setValueAtTime(150, t);
                 osc.frequency.linearRampToValueAtTime(100, t + 0.1);
                 gain.gain.setValueAtTime(0.1, t);
                 gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
                 osc.start(t);
                 osc.stop(t + 0.1);
                 break;
        }
    },

    playTone(freq, time, dur, type='sine') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(this.masterGain);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.start(time);
        osc.stop(time + dur);
    },

    createNoise(time, dur, startFreq, endFreq) {
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(startFreq, time);
        filter.frequency.exponentialRampToValueAtTime(endFreq, time + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
    }
};

window.AudioSystem = AudioSystem;
