# 🪩 NEON VELVET: Empty Discotheque Simulator

An interactive, audio-reactive 3D web application simulating an empty, moody discotheque with a physics-driven rolling ball and crazy visual effects.

---

## 🚀 Quick Start

Open [`index.html`](file:///Users/mymacbook/Desktop/Anigravity1/index.html) directly in any modern web browser, or launch a local web server:

```bash
# Using Python
python3 -m http.server 8080

# Or using npm
npm start
```

Then visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## ✨ Highlights & Features

### 🕺 The Empty Discotheque Environment
- **16×16 LED Dancefloor**: 256 glowing tiles reactive to the rolling ball, sub-bass beats, and shockwaves.
- **Giant Mirror Disco Ball**: Faceted sphere reflecting dynamic rotating light specks across walls, dancefloor, and ceiling.
- **DJ Booth & Equalizer**: Turntables, vinyl records, mixer with blinking VU meters, and a giant LED spectrum wall jumping to real-time audio.
- **Club Sound System**: 4 massive speaker stacks with subwoofers punching physically in sync with kick drums.
- **VIP Lounge**: Plush crimson velvet banquettes, brass tables, and glowing neon cocktails.
- **Volumetric Fog & Lighting**: 8 robotic moving-head spotlights, atmospheric fog particles, and overhead steel trusses.

### ⚽ Rolling Ball Physics
- **Realistic Rolling Motion**: Physically accurate angular velocity calculation ($\omega = v / R$) that rolls smoothly across the floor.
- **Interactive Trail & Sparks**: Speed-reactive neon ribbon trails and collision sparks.
- **Ground Slam & Floor Ripples**: Jump into the air and slam down to send concentric light ripples shooting across the dance floor tiles.
- **5 Unlockable Ball Skins**:
  1. *Mirror Disco Ball*
  2. *Cyber Chrome*
  3. *Plasma Core*
  4. *Vaporwave Neon*
  5. *Golden Glitz*

### 🌀 Crazy Visual Effects
- **⚡ Strobe Storm (`F`)**: Blinding multi-frequency strobe bursts synchronized with techno beats.
- **✨ Laser Frenzy (`L`)**: 16 high-intensity volumetric laser beams scanning through nightclub fog.
- **🛸 Zero-G Disco (`G`)**: Club gravity inverts! The ball and VIP drinks levitate toward the disco ball.
- **🌀 Acid Trip (`C`)**: Smooth 360-degree HSV psychedelic color morphing across all club lights and surfaces.
- **🪩 Disco Supernova (`B`)**: Disco ball accelerates into hyper-speed, projecting hundreds of shooting star light beams.
- **👁️ Kaleido-Vision (`K`)**: Hyperspace kaleidoscopic color-dodge warp.
- **💥 Bass Drop Slam (`X` or `Space` impact)**: Screen shake recoil, sub-bass explosion, and radial shockwaves.

### 🎵 Procedural Web Audio Synthesizer
- Built-in French Touch / Nu-Disco / Cyber Techno synthesizer using the Web Audio API (zero external audio files needed).
- Real-time `AnalyserNode` driving the dance floor, equalizers, subwoofer cones, and light fixtures.
- 3 tracks included: *Nu-Disco Inferno*, *Cyber Club 2099*, and *French Touch 1999*.

---

## 🎮 Controls & Shortcuts

| Action | Key / Control |
|---|---|
| **Roll Ball** | `W` `A` `S` `D` or `Arrow Keys` / Touch Joystick |
| **Turbo Boost** | `Shift` (Nitro boost & motion blur FOV kick) |
| **Jump / Slam** | `Spacebar` |
| **Strobe Storm** | `F` |
| **Laser Frenzy** | `L` |
| **Zero-G Mode** | `G` |
| **Acid Trip** | `C` |
| **Disco Supernova** | `B` |
| **Kaleido-Vision** | `K` |
| **Bass Drop Slam** | `X` |
| **Change Camera** | `V` (Chase Cam, Ball POV, DJ Booth, Radar, Fly Cam) |
| **Ball Skins** | `1` to `5` or `Skin` button |
| **Next Track** | `T` or `P` |
| **Toggle Music** | `M` |
