/**
 * NEON VELVET: Procedural Disco & Techno Audio Synthesizer
 * Built using Web Audio API - 100% self-contained, no external files needed!
 */

class DiscoAudioEngine {
    constructor() {
        this.ctx = null;
        this.analyser = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.filterNode = null;
        this.compressor = null;
        
        this.isPlaying = false;
        this.isMuted = false;
        this.bpm = 124;
        this.currentTrack = 0; // 0: Nu Disco, 1: Cyber Rave, 2: French House
        this.step = 0;
        this.timer = null;
        
        // Rolling sound oscillator
        this.rollOsc = null;
        this.rollGain = null;
        this.rollFilter = null;
        
        // Frequency data arrays
        this.freqData = null;
        this.timeData = null;
        
        this.audioMetrics = {
            bass: 0,
            mid: 0,
            treble: 0,
            overall: 0,
            beatTriggered: false
        };
        
        this.tracks = [
            {
                name: "Nu-Disco Inferno",
                bpm: 124,
                scale: [48, 51, 53, 55, 58], // C minor pentatonic
                chords: [
                    [48, 55, 58, 63], // Cm7
                    [44, 51, 56, 60], // Abmaj7
                    [46, 53, 58, 62], // Bb7
                    [43, 50, 55, 58]  // Gm7
                ]
            },
            {
                name: "Cyber Club 2099",
                bpm: 132,
                scale: [45, 47, 48, 52, 55], // A minor
                chords: [
                    [45, 52, 57, 60], // Am
                    [41, 48, 53, 57], // Fmaj7
                    [43, 50, 55, 59], // G
                    [40, 47, 52, 55]  // Em
                ]
            },
            {
                name: "French Touch 1999",
                bpm: 120,
                scale: [50, 53, 55, 57, 60], // D minor
                chords: [
                    [50, 57, 60, 65], // Dm7
                    [46, 53, 58, 62], // Bbmaj7
                    [48, 55, 60, 64], // C
                    [45, 52, 57, 60]  // Am7
                ]
            }
        ];
    }
    
    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        
        // Master Compressor to glue the disco mix
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.1, this.ctx.currentTime);
        
        // Master Filter for crazy DJ sweeps
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(18000, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);
        
        // Gains
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        
        // Analyser for real-time visual light reaction
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Graph routing
        this.musicGain.connect(this.filterNode);
        this.sfxGain.connect(this.filterNode);
        this.filterNode.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        
        this.initRollingHum();
    }
    
    initRollingHum() {
        if (!this.ctx) return;
        this.rollOsc = this.ctx.createOscillator();
        this.rollOsc.type = 'triangle';
        this.rollOsc.frequency.setValueAtTime(40, this.ctx.currentTime);
        
        this.rollFilter = this.ctx.createBiquadFilter();
        this.rollFilter.type = 'lowpass';
        this.rollFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
        
        this.rollGain = this.ctx.createGain();
        this.rollGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        
        this.rollOsc.connect(this.rollFilter);
        this.rollFilter.connect(this.rollGain);
        this.rollGain.connect(this.sfxGain);
        this.rollOsc.start();
    }
    
    updateBallSpeed(speed, isGrounded) {
        if (!this.rollGain || !this.ctx) return;
        const normalized = Math.min(speed / 25, 1.0);
        if (isGrounded && normalized > 0.05) {
            const targetGain = normalized * 0.25;
            const targetFreq = 40 + normalized * 180;
            this.rollGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
            this.rollOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
            this.rollFilter.frequency.setTargetAtTime(200 + normalized * 600, this.ctx.currentTime, 0.05);
        } else {
            this.rollGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
        }
    }
    
    start() {
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.step = 0;
        this.scheduleBeat();
    }
    
    stop() {
        this.isPlaying = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    
    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    }
    
    setTrack(index) {
        this.currentTrack = index % this.tracks.length;
        this.bpm = this.tracks[this.currentTrack].bpm;
    }
    
    nextTrack() {
        this.setTrack(this.currentTrack + 1);
        return this.tracks[this.currentTrack].name;
    }
    
    scheduleBeat() {
        if (!this.isPlaying) return;
        const track = this.tracks[this.currentTrack];
        const stepTime = (60 / track.bpm) / 4; // 16th note
        
        this.playStep(this.step, track);
        this.step = (this.step + 1) % 64;
        
        this.timer = setTimeout(() => {
            this.scheduleBeat();
        }, stepTime * 1000);
    }
    
    playStep(step, track) {
        if (!this.ctx || this.isMuted) return;
        const time = this.ctx.currentTime;
        const beat16 = step % 16;
        const bar = Math.floor(step / 16);
        
        // 1. Kick Drum: 4 on the floor (steps 0, 4, 8, 12)
        if (beat16 % 4 === 0) {
            this.playKick(time);
            this.audioMetrics.beatTriggered = true;
        }
        
        // 2. Snare / Disco Clap: beats 4 and 12 (backbeat)
        if (beat16 === 4 || beat16 === 12) {
            this.playSnare(time);
        }
        
        // 3. Hi-Hats:
        // Closed hat on 16ths, Open hat on the offbeats (2, 6, 10, 14)
        if (beat16 % 4 === 2) {
            this.playOpenHat(time);
        } else if (beat16 % 2 === 0) {
            this.playClosedHat(time);
        }
        
        // 4. Funky Octave Disco Bassline
        this.playBassline(time, step, track);
        
        // 5. Synth Chords / Brass Stabs on accents
        if (beat16 === 0 || beat16 === 6 || beat16 === 10) {
            this.playChord(time, bar % 4, track);
        }
    }
    
    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);
        
        gain.gain.setValueAtTime(1.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.36);
        
        // Punch click transient
        const click = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        click.type = 'triangle';
        click.frequency.setValueAtTime(300, time);
        click.frequency.exponentialRampToValueAtTime(30, time + 0.02);
        clickGain.gain.setValueAtTime(0.6, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
        click.connect(clickGain);
        clickGain.connect(this.musicGain);
        click.start(time);
        click.stop(time + 0.03);
    }
    
    playSnare(time) {
        // Noise component
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, time);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.musicGain);
        
        // Body tone
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
        oscGain.gain.setValueAtTime(0.5, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
        
        osc.connect(oscGain);
        oscGain.connect(this.musicGain);
        
        noise.start(time);
        osc.start(time);
        noise.stop(time + 0.2);
        osc.stop(time + 0.15);
    }
    
    playClosedHat(time) {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        source.start(time);
    }
    
    playOpenHat(time) {
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(8500, time);
        filter.Q.setValueAtTime(2.0, time);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        source.start(time);
    }
    
    playBassline(time, step, track) {
        const beat16 = step % 16;
        const barIndex = Math.floor(step / 16) % track.chords.length;
        const rootMidi = track.chords[barIndex][0] - 12; // sub octave
        
        // Moroder-style octave bounce: root on even, octave on odd
        const isOctave = (beat16 % 2 === 1);
        const midiNote = isOctave ? rootMidi + 12 : rootMidi;
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
        
        const osc = this.ctx.createOscillator();
        osc.type = this.currentTrack === 1 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(freq, time);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const cutoff = isOctave ? 1200 : 700;
        filter.frequency.setValueAtTime(cutoff, time);
        filter.frequency.exponentialRampToValueAtTime(150, time + 0.12);
        filter.Q.setValueAtTime(6.0, time); // juicy resonant squelch
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.14);
    }
    
    playChord(time, chordIdx, track) {
        const chord = track.chords[chordIdx % track.chords.length];
        
        chord.forEach((midi, idx) => {
            const freq = 440 * Math.pow(2, (midi - 69) / 12);
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            // slight detune for rich vintage analog chorus
            osc.detune.setValueAtTime((idx - 1.5) * 8, time);
            osc.frequency.setValueAtTime(freq, time);
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2500, time);
            filter.frequency.exponentialRampToValueAtTime(800, time + 0.35);
            filter.Q.setValueAtTime(3.0, time);
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(time);
            osc.stop(time + 0.42);
        });
    }
    
    // --- CRAZY SFX ---
    playJump() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(750, time + 0.25);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.3);
    }
    
    playSlamImpact(force = 1.0) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        
        // Massive Sub Boom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110 * force, time);
        osc.frequency.exponentialRampToValueAtTime(25, time + 0.4);
        
        gain.gain.setValueAtTime(Math.min(1.0, 0.7 * force), time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.65);
    }
    
    playBounce() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, time);
        osc.frequency.exponentialRampToValueAtTime(110, time + 0.08);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.1);
    }
    
    playLaserZap() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400, time);
        osc.frequency.exponentialRampToValueAtTime(200, time + 0.16);
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.2);
    }
    
    playStrobeBurst() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.12);
    }
    
    playZeroG(activate = true) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        if (activate) {
            osc.frequency.setValueAtTime(220, time);
            osc.frequency.exponentialRampToValueAtTime(880, time + 0.6);
        } else {
            osc.frequency.setValueAtTime(880, time);
            osc.frequency.exponentialRampToValueAtTime(220, time + 0.5);
        }
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.75);
    }
    
    triggerFilterSweep() {
        if (!this.filterNode || !this.ctx) return;
        const time = this.ctx.currentTime;
        this.filterNode.frequency.cancelScheduledValues(time);
        this.filterNode.frequency.setValueAtTime(500, time);
        this.filterNode.frequency.exponentialRampToValueAtTime(18000, time + 1.2);
    }
    
    getMetrics() {
        if (!this.analyser) {
            return { bass: 0.1, mid: 0.1, treble: 0.1, overall: 0.1, isBeat: false };
        }
        this.analyser.getByteFrequencyData(this.freqData);
        
        let bSum = 0, mSum = 0, tSum = 0;
        const bCount = 8;
        const mCount = 32;
        const tCount = 64;
        
        for (let i = 0; i < bCount; i++) bSum += this.freqData[i];
        for (let i = bCount; i < bCount + mCount; i++) mSum += this.freqData[i];
        for (let i = bCount + mCount; i < bCount + mCount + tCount; i++) tSum += this.freqData[i];
        
        const bass = (bSum / bCount) / 255;
        const mid = (mSum / mCount) / 255;
        const treble = (tSum / tCount) / 255;
        const overall = (bass + mid + treble) / 3;
        
        const isBeat = this.audioMetrics.beatTriggered;
        this.audioMetrics.beatTriggered = false; // reset flag
        
        return { bass, mid, treble, overall, isBeat };
    }
}

// Global audio engine instance
window.discoAudio = new DiscoAudioEngine();
