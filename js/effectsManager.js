/**
 * NEON VELVET: Crazy Visual Effects Manager
 * Strobe Storm, Laser Frenzy, Zero-G, Acid Trip, Disco Supernova,
 * Screen Shake, and Kaleido-Warp.
 */

class EffectsManager {
    constructor(scene, camera, discoScene, ballPhysics) {
        this.scene = scene;
        this.camera = camera;
        this.discoScene = discoScene;
        this.ball = ballPhysics;
        
        // Active effect states
        this.state = {
            strobe: false,
            lasers: false,
            zeroG: false,
            acidTrip: false,
            supernova: false,
            kaleido: false
        };
        
        // Strobe internals
        this.strobeLight = new THREE.DirectionalLight(0xffffff, 0);
        this.strobeLight.position.set(0, 15, 0);
        this.scene.add(this.strobeLight);
        this.strobeTimer = 0;
        
        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.92;
        this.shakeOffset = new THREE.Vector3();
        
        // Acid Trip hue
        this.acidHue = 0;
        
        // Strobe flash overlay element
        this.overlayEl = document.getElementById('screen-fx-overlay');
        this.kaleidoEl = document.getElementById('kaleido-overlay');
        
        // Levitation items for Zero-G
        this.floatingObjects = [];
    }
    
    toggleStrobe() {
        this.state.strobe = !this.state.strobe;
        if (this.state.strobe && window.discoAudio) {
            window.discoAudio.playStrobeBurst();
        }
        return this.state.strobe;
    }
    
    toggleLasers() {
        this.state.lasers = !this.state.lasers;
        if (this.state.lasers && window.discoAudio) {
            window.discoAudio.playLaserZap();
        }
        return this.state.lasers;
    }
    
    toggleZeroG() {
        this.state.zeroG = !this.state.zeroG;
        if (window.discoAudio) {
            window.discoAudio.playZeroG(this.state.zeroG);
        }
        
        // Make VIP cocktails float in Zero-G
        if (this.state.zeroG) {
            this.discoScene.cocktails.forEach(c => {
                c.userData.baseY = c.position.y;
                c.userData.floatSpeed = 0.5 + Math.random() * 0.5;
                c.userData.rotSpeed = (Math.random() - 0.5) * 3.0;
            });
        } else {
            this.discoScene.cocktails.forEach(c => {
                c.position.y = c.userData.baseY || 0.55;
                c.rotation.set(0, 0, 0);
            });
        }
        
        return this.state.zeroG;
    }
    
    toggleAcidTrip() {
        this.state.acidTrip = !this.state.acidTrip;
        return this.state.acidTrip;
    }
    
    toggleSupernova() {
        this.state.supernova = !this.state.supernova;
        if (this.state.supernova && window.discoAudio) {
            window.discoAudio.triggerFilterSweep();
        }
        return this.state.supernova;
    }
    
    toggleKaleido() {
        this.state.kaleido = !this.state.kaleido;
        if (this.kaleidoEl) {
            this.kaleidoEl.classList.toggle('active', this.state.kaleido);
        }
        return this.state.kaleido;
    }
    
    addShake(amount) {
        this.shakeIntensity = Math.min(1.6, this.shakeIntensity + amount);
    }
    
    triggerBassDropImpact(force = 1.0) {
        this.addShake(0.8 * force);
        if (window.discoAudio) {
            window.discoAudio.playSlamImpact(force);
        }
        if (this.overlayEl) {
            this.overlayEl.style.backgroundColor = 'rgba(255, 0, 128, 0.45)';
            setTimeout(() => {
                this.overlayEl.style.backgroundColor = 'transparent';
            }, 120);
        }
    }
    
    update(delta, time, audioMetrics) {
        const { bass, isBeat } = audioMetrics;
        
        // 1. Strobe Effect
        if (this.state.strobe) {
            this.strobeTimer += delta * 24; // 24 Hz flash
            const isFlash = Math.sin(this.strobeTimer) > 0.3;
            if (isFlash) {
                const strobeColors = [0xffffff, 0x00f0ff, 0xff00aa, 0x39ff14];
                const col = strobeColors[Math.floor(Math.random() * strobeColors.length)];
                this.strobeLight.color.setHex(col);
                this.strobeLight.intensity = 18.0;
                
                if (this.overlayEl && Math.random() < 0.25) {
                    this.overlayEl.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }
            } else {
                this.strobeLight.intensity = 0;
                if (this.overlayEl) {
                    this.overlayEl.style.backgroundColor = 'transparent';
                }
            }
        } else {
            this.strobeLight.intensity = 0;
            if (this.overlayEl && this.shakeIntensity <= 0.05) {
                this.overlayEl.style.backgroundColor = 'transparent';
            }
        }
        
        // 2. Bass Beat Flash
        if (isBeat && !this.state.strobe) {
            this.addShake(0.12 * bass);
        }
        
        // 3. Acid Trip Psychedelic Cycle
        if (this.state.acidTrip) {
            this.acidHue = (this.acidHue + delta * 0.4) % 1.0;
            const acidColor = new THREE.Color().setHSL(this.acidHue, 1.0, 0.55);
            
            // Tint Disco Ball
            this.discoScene.discoBall.material.color.copy(acidColor);
            
            // Tint Ball core light
            if (this.ball && this.ball.coreLight) {
                this.ball.coreLight.color.copy(acidColor);
            }
            
            // Tint Moving Spotlights
            this.discoScene.movingSpots.forEach((spot, idx) => {
                const spotHue = (this.acidHue + idx * 0.15) % 1.0;
                spot.light.color.setHSL(spotHue, 1.0, 0.6);
                spot.cone.material.color.setHSL(spotHue, 1.0, 0.6);
            });
        }
        
        // 4. Zero-G floating cocktails & items
        if (this.state.zeroG) {
            this.discoScene.cocktails.forEach(c => {
                c.position.y += Math.sin(time * c.userData.floatSpeed) * 0.015;
                c.rotation.x += c.userData.rotSpeed * delta;
                c.rotation.z += c.userData.rotSpeed * delta * 0.7;
            });
        }
        
        // 5. Disco Supernova
        if (this.state.supernova) {
            this.discoScene.pinSpots.forEach(s => {
                s.intensity = 8.0 + Math.random() * 6.0;
            });
            this.addShake(0.04);
        }
        
        // 6. Camera Screen Shake Calculation
        if (this.shakeIntensity > 0.005) {
            this.shakeOffset.set(
                (Math.random() - 0.5) * this.shakeIntensity * 0.8,
                (Math.random() - 0.5) * this.shakeIntensity * 0.6,
                (Math.random() - 0.5) * this.shakeIntensity * 0.8
            );
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeOffset.set(0, 0, 0);
            this.shakeIntensity = 0;
        }
    }
}

window.EffectsManager = EffectsManager;
