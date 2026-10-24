/**
 * NEON VELVET: Main Application Loop, Controls, Cameras & UI
 */

(function() {
    'use strict';

    let scene, camera, renderer;
    let discoScene, ballPhysics, effectsManager;
    let clock;
    
    // Camera Modes
    const CAM_CHASE = 0;
    const CAM_BALL_POV = 1;
    const CAM_DJ_BOOTH = 2;
    const CAM_TOP_DOWN = 3;
    const CAM_CINEMATIC = 4;
    let currentCamMode = CAM_CHASE;
    
    // Keyboard input state
    const keys = {};
    const inputVector = new THREE.Vector3();
    
    // Virtual joystick / drag state
    let touchStart = null;
    let touchVector = { x: 0, y: 0 };
    let isTouching = false;
    
    // DOM Elements
    let speedEl, trackNameEl, vuCanvas, vuCtx;
    
    function init() {
        clock = new THREE.Clock();
        
        // 1. Scene & Renderer
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0c14, 0.018);
        
        camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 150);
        camera.position.set(0, 5, 12);
        
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        
        const container = document.getElementById('canvas-container');
        container.appendChild(renderer.domElement);
        
        // 2. Initialize Subsystems
        discoScene = new DiscoScene(scene);
        ballPhysics = new BallPhysics(scene, discoScene);
        effectsManager = new EffectsManager(scene, camera, discoScene, ballPhysics);
        
        // 3. Setup UI & Event Listeners
        setupEventListeners();
        setupHUD();
        
        // 4. Start Render Loop
        requestAnimationFrame(animate);
    }
    
    function setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            
            // Audio engine unlock on first user interaction
            if (!window.discoAudio.ctx) {
                window.discoAudio.start();
                updateTrackUI();
            }
            
            // Effect Hotkeys
            switch (e.code) {
                case 'KeyF':
                    toggleEffect('strobe');
                    break;
                case 'KeyL':
                    toggleEffect('lasers');
                    break;
                case 'KeyG':
                    toggleEffect('zeroG');
                    break;
                case 'KeyC':
                    toggleEffect('acidTrip');
                    break;
                case 'KeyB':
                    toggleEffect('supernova');
                    break;
                case 'KeyK':
                    toggleEffect('kaleido');
                    break;
                case 'KeyV':
                    cycleCamera();
                    break;
                case 'KeyT':
                case 'KeyP':
                    const nextName = window.discoAudio.nextTrack();
                    if (trackNameEl) trackNameEl.innerText = nextName;
                    break;
                case 'KeyM':
                    toggleMusic();
                    break;
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                    const skinIdx = parseInt(e.key) - 1;
                    const name = ballPhysics.setSkin(skinIdx);
                    updateSkinUI(name);
                    break;
                case 'KeyX':
                    effectsManager.triggerBassDropImpact(1.6);
                    discoScene.triggerFloorRipple(ballPhysics.position, 1.8);
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
        
        // Window Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Touch & Virtual Joystick for mobile / tablet / mouse drag
        const touchZone = document.getElementById('touch-zone');
        if (touchZone) {
            touchZone.addEventListener('pointerdown', (e) => {
                touchStart = { x: e.clientX, y: e.clientY };
                isTouching = true;
                if (!window.discoAudio.ctx) {
                    window.discoAudio.start();
                    updateTrackUI();
                }
            });
            
            window.addEventListener('pointermove', (e) => {
                if (!isTouching || !touchStart) return;
                const dx = e.clientX - touchStart.x;
                const dy = e.clientY - touchStart.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxRadius = 60;
                
                if (dist > 0) {
                    const norm = Math.min(dist, maxRadius) / maxRadius;
                    touchVector.x = (dx / dist) * norm;
                    touchVector.y = (dy / dist) * norm;
                }
                
                const knob = document.getElementById('joystick-knob');
                if (knob) {
                    knob.style.transform = `translate(${touchVector.x * 45}px, ${touchVector.y * 45}px)`;
                }
            });
            
            const handleTouchEnd = () => {
                isTouching = false;
                touchStart = null;
                touchVector.x = 0;
                touchVector.y = 0;
                const knob = document.getElementById('joystick-knob');
                if (knob) knob.style.transform = 'translate(0px, 0px)';
            };
            
            window.addEventListener('pointerup', handleTouchEnd);
            window.addEventListener('pointercancel', handleTouchEnd);
        }
        
        // UI Action Buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                handleUIAction(action, btn);
            });
        });
    }
    
    function toggleEffect(name) {
        let active = false;
        switch (name) {
            case 'strobe': active = effectsManager.toggleStrobe(); break;
            case 'lasers': active = effectsManager.toggleLasers(); break;
            case 'zeroG': active = effectsManager.toggleZeroG(); break;
            case 'acidTrip': active = effectsManager.toggleAcidTrip(); break;
            case 'supernova': active = effectsManager.toggleSupernova(); break;
            case 'kaleido': active = effectsManager.toggleKaleido(); break;
        }
        
        const btn = document.querySelector(`[data-action="${name}"]`);
        if (btn) {
            btn.classList.toggle('active', active);
        }
    }
    
    function handleUIAction(action, btn) {
        if (!window.discoAudio.ctx) {
            window.discoAudio.start();
            updateTrackUI();
        }
        
        if (['strobe', 'lasers', 'zeroG', 'acidTrip', 'supernova', 'kaleido'].includes(action)) {
            toggleEffect(action);
            return;
        }
        
        switch (action) {
            case 'jump':
                keys['Space'] = true;
                setTimeout(() => { keys['Space'] = false; }, 100);
                break;
            case 'boost':
                keys['ShiftLeft'] = !keys['ShiftLeft'];
                btn.classList.toggle('active', keys['ShiftLeft']);
                break;
            case 'slam':
                effectsManager.triggerBassDropImpact(1.8);
                discoScene.triggerFloorRipple(ballPhysics.position, 2.0);
                break;
            case 'camera':
                cycleCamera();
                break;
            case 'skin':
                const skinName = ballPhysics.cycleSkin();
                updateSkinUI(skinName);
                break;
            case 'palette':
                discoScene.cyclePalette();
                break;
            case 'track':
                const tName = window.discoAudio.nextTrack();
                if (trackNameEl) trackNameEl.innerText = tName;
                break;
            case 'music':
                toggleMusic();
                break;
            case 'help':
                const modal = document.getElementById('help-modal');
                if (modal) modal.classList.toggle('hidden');
                break;
        }
    }
    
    function toggleMusic() {
        const isPlaying = window.discoAudio.toggle();
        const mBtn = document.querySelector('[data-action="music"]');
        if (mBtn) {
            mBtn.innerHTML = isPlaying ? '🔊 MUSIC ON' : '🔇 MUSIC OFF';
            mBtn.classList.toggle('active', isPlaying);
        }
    }
    
    function updateTrackUI() {
        if (trackNameEl) {
            trackNameEl.innerText = window.discoAudio.tracks[window.discoAudio.currentTrack].name;
        }
        const mBtn = document.querySelector('[data-action="music"]');
        if (mBtn) {
            mBtn.innerHTML = '🔊 MUSIC ON';
            mBtn.classList.add('active');
        }
    }
    
    function updateSkinUI(name) {
        const skinLabel = document.getElementById('current-skin-label');
        if (skinLabel) {
            skinLabel.innerText = name;
        }
    }
    
    function cycleCamera() {
        currentCamMode = (currentCamMode + 1) % 5;
        const camLabels = ["CHASE CAM", "BALL POV", "DJ BOOTH", "TOP DOWN", "CINEMATIC"];
        const camBtn = document.querySelector('[data-action="camera"]');
        if (camBtn) {
            camBtn.innerText = `🎥 ${camLabels[currentCamMode]}`;
        }
    }
    
    function setupHUD() {
        speedEl = document.getElementById('speed-display');
        trackNameEl = document.getElementById('track-name');
        vuCanvas = document.getElementById('vu-canvas');
        if (vuCanvas) {
            vuCtx = vuCanvas.getContext('2d');
        }
    }
    
    function updateCamera(delta, time) {
        const ballPos = ballPhysics.position;
        const ballVel = ballPhysics.velocity;
        const speed = ballPhysics.getSpeed();
        
        // Dynamic FOV boost effect
        const targetFOV = ballPhysics.isBoosting ? 78 : 65;
        camera.fov += (targetFOV - camera.fov) * 0.1;
        camera.updateProjectionMatrix();
        
        switch (currentCamMode) {
            case CAM_CHASE: {
                // Smooth chase camera behind velocity or offset
                const lookAhead = ballVel.clone().multiplyScalar(0.2);
                let camOffset = new THREE.Vector3(0, 3.8, 7.5);
                
                // Rotate offset based on movement direction if moving
                if (ballVel.lengthSq() > 1.0) {
                    const heading = Math.atan2(ballVel.x, ballVel.z);
                    camOffset.set(
                        Math.sin(heading) * -7.5,
                        3.6,
                        Math.cos(heading) * -7.5
                    );
                }
                
                const targetCamPos = ballPos.clone().add(camOffset);
                camera.position.lerp(targetCamPos, 0.1);
                
                const targetLookAt = ballPos.clone().add(lookAhead);
                targetLookAt.y += 0.4;
                camera.lookAt(targetLookAt);
                break;
            }
                
            case CAM_BALL_POV: {
                // First person inside/on the rolling ball
                camera.position.copy(ballPos);
                camera.position.y += 0.4;
                
                let lookTarget = ballPos.clone().add(ballVel.clone().normalize().multiplyScalar(5));
                if (ballVel.lengthSq() < 0.2) {
                    lookTarget = ballPos.clone().add(new THREE.Vector3(0, 0, -5));
                }
                lookTarget.y = ballPos.y + 0.3;
                camera.lookAt(lookTarget);
                break;
            }
                
            case CAM_DJ_BOOTH: {
                // Elevated view from the DJ booth overlooking empty dance floor
                camera.position.lerp(new THREE.Vector3(0, 3.6, -discoScene.floorWidth / 2 - 2.5), 0.1);
                camera.lookAt(ballPos.x * 0.4, 0.5, ballPos.z * 0.4);
                break;
            }
                
            case CAM_TOP_DOWN: {
                // Birds eye dancefloor radar
                camera.position.lerp(new THREE.Vector3(ballPos.x * 0.3, 22, ballPos.z * 0.3), 0.1);
                camera.lookAt(ballPos.x, 0, ballPos.z);
                break;
            }
                
            case CAM_CINEMATIC: {
                // Slow dramatic orbit around the club
                const orbitRadius = 18;
                const camX = Math.sin(time * 0.35) * orbitRadius;
                const camZ = Math.cos(time * 0.35) * orbitRadius;
                camera.position.lerp(new THREE.Vector3(camX, 6.5 + Math.sin(time * 0.5) * 2.5, camZ), 0.08);
                camera.lookAt(ballPos.x, ballPos.y + 0.5, ballPos.z);
                break;
            }
        }
        
        // Apply Screen Shake
        camera.position.add(effectsManager.shakeOffset);
    }
    
    function drawVU(audioMetrics) {
        if (!vuCtx || !vuCanvas) return;
        const w = vuCanvas.width;
        const h = vuCanvas.height;
        vuCtx.clearRect(0, 0, w, h);
        
        const bars = 14;
        const barW = (w / bars) - 2;
        const { bass, mid, treble } = audioMetrics;
        
        for (let i = 0; i < bars; i++) {
            let val = (i < 4 ? bass : (i < 9 ? mid : treble)) * (0.6 + Math.random() * 0.4);
            val = Math.min(1.0, val * 1.4);
            const barH = val * h;
            
            const grad = vuCtx.createLinearGradient(0, h, 0, 0);
            grad.addColorStop(0, '#00f0ff');
            grad.addColorStop(0.6, '#bc13fe');
            grad.addColorStop(1, '#ff0055');
            
            vuCtx.fillStyle = grad;
            vuCtx.fillRect(i * (barW + 2), h - barH, barW, barH);
        }
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        const delta = Math.min(clock.getDelta(), 0.1);
        const time = clock.getElapsedTime();
        
        // 1. Process Input Vector
        inputVector.set(0, 0, 0);
        
        // Keyboard WASD / Arrows
        if (keys['KeyW'] || keys['ArrowUp']) inputVector.z -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) inputVector.z += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) inputVector.x -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) inputVector.x += 1;
        
        // Touch / Virtual Joystick input
        if (isTouching) {
            inputVector.x += touchVector.x;
            inputVector.z += touchVector.y;
        }
        
        // Normalize input if vector > 1
        if (inputVector.lengthSq() > 1) {
            inputVector.normalize();
        }
        
        // Relative to Chase Camera orientation if in Chase Cam mode
        if (currentCamMode === CAM_CHASE) {
            const camForward = new THREE.Vector3();
            camera.getWorldDirection(camForward);
            camForward.y = 0;
            camForward.normalize();
            
            const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);
            
            const worldInput = new THREE.Vector3();
            worldInput.addScaledVector(camForward, -inputVector.z);
            worldInput.addScaledVector(camRight, inputVector.x);
            inputVector.copy(worldInput);
        }
        
        const isJump = !!keys['Space'];
        const isBoost = !!(keys['ShiftLeft'] || keys['ShiftRight']);
        
        // 2. Fetch Audio Metrics
        const audioMetrics = window.discoAudio.getMetrics();
        
        // 3. Update Ball Physics
        ballPhysics.update(delta, inputVector, isJump, isBoost, effectsManager.state);
        
        // 4. Update Discotheque Scene
        discoScene.update(time, audioMetrics, ballPhysics.position, effectsManager.state);
        
        // 5. Update Crazy Effects
        effectsManager.update(delta, time, audioMetrics);
        
        // 6. Update Camera
        updateCamera(delta, time);
        
        // 7. Update HUD
        const currentSpeedKmh = Math.round(ballPhysics.getSpeed() * 3.6);
        if (speedEl) {
            speedEl.innerHTML = `${currentSpeedKmh} <span style="font-size:0.6em;color:#00f0ff;">KM/H</span> ${ballPhysics.isBoosting ? '<span style="color:#ff0077;font-weight:900;">[TURBO]</span>' : ''}`;
        }
        drawVU(audioMetrics);
        
        // 8. Render
        renderer.render(scene, camera);
    }
    
    // Start after DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
