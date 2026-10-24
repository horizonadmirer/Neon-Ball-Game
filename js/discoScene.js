/**
 * NEON VELVET: 3D Empty Discotheque Environment
 * High-detail club interior, 16x16 interactive LED dancefloor,
 * massive speaker stacks, DJ booth, mirror disco ball & light rigs.
 */

class DiscoScene {
    constructor(scene) {
        this.scene = scene;
        
        // References to dynamic scene objects
        this.discoBall = null;
        this.discoBallChain = null;
        this.mirrorSpecks = null;
        this.floorTiles = [];
        this.speakers = [];
        this.movingSpots = [];
        this.laserBeams = [];
        this.fogParticles = null;
        this.djEqBars = [];
        this.neonSigns = [];
        this.cocktails = [];
        
        // Dimensions
        this.floorGridSize = 16;
        this.floorTileSize = 1.4; // 16 * 1.4 = 22.4m
        this.floorWidth = this.floorGridSize * this.floorTileSize;
        this.roomWidth = 46;
        this.roomDepth = 56;
        this.roomHeight = 16;
        
        // Color palettes
        this.palettes = [
            // Cyber Synthwave
            [new THREE.Color(0xff007f), new THREE.Color(0x00f0ff), new THREE.Color(0x8b00ff), new THREE.Color(0x00ffaa)],
            // 70s Disco Gold & Crimson
            [new THREE.Color(0xffaa00), new THREE.Color(0xff1493), new THREE.Color(0x00ffff), new THREE.Color(0x9400d3)],
            // Acid Neon Green & Violet
            [new THREE.Color(0x39ff14), new THREE.Color(0xbc13fe), new THREE.Color(0x04d9ff), new THREE.Color(0xff073a)],
            // Electric Midnight Blue
            [new THREE.Color(0x0055ff), new THREE.Color(0x00e5ff), new THREE.Color(0xff00aa), new THREE.Color(0x7928ca)]
        ];
        this.currentPalette = 0;
        
        // Procedural Textures Cache
        this.textures = this.generateProceduralTextures();
        
        // Build the discotheque
        this.buildRoom();
        this.buildCeilingTrusses();
        this.buildDiscoBall();
        this.buildLEDDancefloor();
        this.buildDJBooth();
        this.buildSpeakerStacks();
        this.buildVIPLounges();
        this.buildLightingRigs();
        this.buildLasers();
        this.buildFog();
    }
    
    generateProceduralTextures() {
        const textures = {};
        
        // 1. Dark Club Acoustic Tile Texture
        const canvasWall = document.createElement('canvas');
        canvasWall.width = 512;
        canvasWall.height = 512;
        const ctxW = canvasWall.getContext('2d');
        ctxW.fillStyle = '#111218';
        ctxW.fillRect(0, 0, 512, 512);
        // Subtle brick/panel grid
        ctxW.strokeStyle = '#08080c';
        ctxW.lineWidth = 4;
        for (let x = 0; x < 512; x += 64) {
            ctxW.beginPath();
            ctxW.moveTo(x, 0);
            ctxW.lineTo(x, 512);
            ctxW.stroke();
        }
        for (let y = 0; y < 512; y += 32) {
            ctxW.beginPath();
            ctxW.moveTo(0, y);
            ctxW.lineTo(512, y);
            ctxW.stroke();
        }
        // Subtle noise/speckles
        for (let i = 0; i < 4000; i++) {
            const nx = Math.random() * 512;
            const ny = Math.random() * 512;
            const lum = Math.floor(Math.random() * 25);
            ctxW.fillStyle = `rgb(${lum}, ${lum + 2}, ${lum + 6})`;
            ctxW.fillRect(nx, ny, 2, 2);
        }
        textures.wall = new THREE.CanvasTexture(canvasWall);
        textures.wall.wrapS = THREE.RepeatWrapping;
        textures.wall.wrapT = THREE.RepeatWrapping;
        textures.wall.repeat.set(6, 3);
        
        // 2. Speaker Honeycomb Grille
        const canvasSpk = document.createElement('canvas');
        canvasSpk.width = 256;
        canvasSpk.height = 256;
        const ctxS = canvasSpk.getContext('2d');
        ctxS.fillStyle = '#0a0a0d';
        ctxS.fillRect(0, 0, 256, 256);
        ctxS.fillStyle = '#181822';
        for (let y = 8; y < 256; y += 16) {
            const offset = (y / 16) % 2 === 0 ? 0 : 8;
            for (let x = 8 + offset; x < 256; x += 16) {
                ctxS.beginPath();
                ctxS.arc(x, y, 4, 0, Math.PI * 2);
                ctxS.fill();
            }
        }
        textures.speaker = new THREE.CanvasTexture(canvasSpk);
        textures.speaker.wrapS = THREE.RepeatWrapping;
        textures.speaker.wrapT = THREE.RepeatWrapping;
        textures.speaker.repeat.set(2, 2);
        
        // 3. Disco Ball Facets Normal Map
        const canvasMirror = document.createElement('canvas');
        canvasMirror.width = 512;
        canvasMirror.height = 512;
        const ctxM = canvasMirror.getContext('2d');
        ctxM.fillStyle = '#8080ff'; // flat normal
        ctxM.fillRect(0, 0, 512, 512);
        const tileSize = 16;
        for (let y = 0; y < 512; y += tileSize) {
            for (let x = 0; x < 512; x += tileSize) {
                // Perturb normal slightly per facet
                const r = 128 + Math.floor((Math.random() - 0.5) * 60);
                const g = 128 + Math.floor((Math.random() - 0.5) * 60);
                ctxM.fillStyle = `rgb(${r}, ${g}, 255)`;
                ctxM.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
                ctxM.strokeStyle = '#5050c0';
                ctxM.strokeRect(x, y, tileSize, tileSize);
            }
        }
        textures.discoFacets = new THREE.CanvasTexture(canvasMirror);
        textures.discoFacets.wrapS = THREE.RepeatWrapping;
        textures.discoFacets.wrapT = THREE.RepeatWrapping;
        textures.discoFacets.repeat.set(4, 2);
        
        // 4. Fog particle soft circle
        const canvasFog = document.createElement('canvas');
        canvasFog.width = 128;
        canvasFog.height = 128;
        const ctxF = canvasFog.getContext('2d');
        const grad = ctxF.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.3, 'rgba(200, 220, 255, 0.4)');
        grad.addColorStop(0.7, 'rgba(120, 160, 255, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctxF.fillStyle = grad;
        ctxF.fillRect(0, 0, 128, 128);
        textures.fog = new THREE.CanvasTexture(canvasFog);
        
        return textures;
    }
    
    buildRoom() {
        // Concrete polished floor around dancefloor
        const floorGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomDepth);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0c0d12,
            roughness: 0.25,
            metalness: 0.85
        });
        const mainFloor = new THREE.Mesh(floorGeo, floorMat);
        mainFloor.rotation.x = -Math.PI / 2;
        mainFloor.receiveShadow = true;
        this.scene.add(mainFloor);
        
        // Dark metallic perimeter walls
        const wallMat = new THREE.MeshStandardMaterial({
            map: this.textures.wall,
            roughness: 0.5,
            metalness: 0.4
        });
        
        // Back Wall (behind DJ booth)
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.roomHeight), wallMat);
        backWall.position.set(0, this.roomHeight / 2, -this.roomDepth / 2);
        this.scene.add(backWall);
        
        // Front Wall (entrance)
        const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.roomHeight), wallMat);
        frontWall.rotation.y = Math.PI;
        frontWall.position.set(0, this.roomHeight / 2, this.roomDepth / 2);
        this.scene.add(frontWall);
        
        // Left Wall
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(this.roomDepth, this.roomHeight), wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-this.roomWidth / 2, this.roomHeight / 2, 0);
        this.scene.add(leftWall);
        
        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(this.roomDepth, this.roomHeight), wallMat);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(this.roomWidth / 2, this.roomHeight / 2, 0);
        this.scene.add(rightWall);
        
        // Ceiling
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x08090d,
            roughness: 0.9,
            metalness: 0.1
        });
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.roomDepth), ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.roomHeight;
        this.scene.add(ceiling);
        
        // Floor border trim (raised metallic ramp around dancefloor)
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x222430,
            metalness: 0.9,
            roughness: 0.2
        });
        const trimW = this.floorWidth + 0.6;
        const trimH = 0.1;
        const trimGeo = new THREE.BoxGeometry(trimW, trimH, trimW);
        const trimMesh = new THREE.Mesh(trimGeo, trimMat);
        trimMesh.position.set(0, 0.05, 0);
        this.scene.add(trimMesh);
    }
    
    buildCeilingTrusses() {
        const trussMat = new THREE.MeshStandardMaterial({
            color: 0x2a2c38,
            metalness: 0.8,
            roughness: 0.4
        });
        
        // Create rectangular truss grid suspended from ceiling
        const trussY = this.roomHeight - 2.5;
        const trussZPositions = [-15, -5, 5, 15];
        
        trussZPositions.forEach(z => {
            const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, this.roomWidth - 4, 8);
            const beam = new THREE.Mesh(beamGeo, trussMat);
            beam.rotation.z = Math.PI / 2;
            beam.position.set(0, trussY, z);
            this.scene.add(beam);
            
            const beam2 = beam.clone();
            beam2.position.set(0, trussY + 0.8, z);
            this.scene.add(beam2);
            
            // Cross bars
            for (let x = -this.roomWidth / 2 + 3; x <= this.roomWidth / 2 - 3; x += 4) {
                const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
                const strut = new THREE.Mesh(strutGeo, trussMat);
                strut.position.set(x, trussY + 0.4, z);
                this.scene.add(strut);
            }
        });
        
        // Longitudinal trusses
        [-10, 0, 10].forEach(x => {
            const longBeamGeo = new THREE.CylinderGeometry(0.08, 0.08, 36, 8);
            const longBeam = new THREE.Mesh(longBeamGeo, trussMat);
            longBeam.rotation.x = Math.PI / 2;
            longBeam.position.set(x, trussY, 0);
            this.scene.add(longBeam);
        });
    }
    
    buildDiscoBall() {
        const ballRadius = 1.35;
        const ballY = 9.8;
        
        // Group for rotation
        this.discoBallGroup = new THREE.Group();
        this.discoBallGroup.position.set(0, ballY, 0);
        
        // Hanging chain
        const chainGeo = new THREE.CylinderGeometry(0.03, 0.03, this.roomHeight - ballY, 8);
        const chainMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
        const chain = new THREE.Mesh(chainGeo, chainMat);
        chain.position.set(0, (this.roomHeight - ballY) / 2, 0);
        this.discoBallGroup.add(chain);
        
        // Faceted mirror sphere
        const sphereGeo = new THREE.SphereGeometry(ballRadius, 32, 24);
        const mirrorMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.98,
            roughness: 0.08,
            normalMap: this.textures.discoFacets,
            flatShading: true
        });
        this.discoBall = new THREE.Mesh(sphereGeo, mirrorMat);
        this.discoBallGroup.add(this.discoBall);
        
        this.scene.add(this.discoBallGroup);
        
        // Mirrored glint reflections (hundreds of light dots dancing on walls/floor)
        const speckCount = 280;
        const speckGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(speckCount * 3);
        const colors = new Float32Array(speckCount * 3);
        this.speckData = [];
        
        for (let i = 0; i < speckCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const dist = 6 + Math.random() * 22;
            
            const x = Math.sin(phi) * Math.cos(theta) * dist;
            const y = Math.max(0.2, ballY + Math.cos(phi) * dist);
            const z = Math.sin(phi) * Math.sin(theta) * dist;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
            
            this.speckData.push({
                dist,
                theta,
                phi,
                speed: 0.2 + Math.random() * 0.4
            });
        }
        
        speckGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        speckGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const speckMat = new THREE.PointsMaterial({
            size: 0.45,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            map: this.textures.fog,
            depthWrite: false
        });
        
        this.mirrorSpecks = new THREE.Points(speckGeo, speckMat);
        this.scene.add(this.mirrorSpecks);
        
        // 4 Dedicated Pin Spotlights focusing on the Disco Ball
        const pinSpotPositions = [
            [-8, 12, -8],
            [8, 12, -8],
            [-8, 12, 8],
            [8, 12, 8]
        ];
        
        this.pinSpots = [];
        pinSpotPositions.forEach((pos, idx) => {
            const spot = new THREE.SpotLight(0xffffff, 4.0, 30, Math.PI / 10, 0.4, 1.2);
            spot.position.set(...pos);
            spot.target = this.discoBall;
            this.scene.add(spot);
            this.pinSpots.push(spot);
            
            // Visual cone lamp fixture
            const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.8 });
            const fixtureGeo = new THREE.ConeGeometry(0.35, 0.7, 12);
            const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
            fixture.position.set(...pos);
            fixture.lookAt(0, ballY, 0);
            fixture.rotateX(Math.PI / 2);
            this.scene.add(fixture);
        });
    }
    
    buildLEDDancefloor() {
        const halfGrid = this.floorGridSize / 2;
        const startX = - (this.floorGridSize * this.floorTileSize) / 2 + this.floorTileSize / 2;
        const startZ = - (this.floorGridSize * this.floorTileSize) / 2 + this.floorTileSize / 2;
        
        const tileGeo = new THREE.BoxGeometry(this.floorTileSize * 0.94, 0.12, this.floorTileSize * 0.94);
        
        for (let gx = 0; gx < this.floorGridSize; gx++) {
            this.floorTiles[gx] = [];
            for (let gz = 0; gz < this.floorGridSize; gz++) {
                const posX = startX + gx * this.floorTileSize;
                const posZ = startZ + gz * this.floorTileSize;
                
                // Emissive neon material per tile
                const mat = new THREE.MeshStandardMaterial({
                    color: 0x111118,
                    emissive: 0x000000,
                    emissiveIntensity: 0.6,
                    roughness: 0.2,
                    metalness: 0.3
                });
                
                const tileMesh = new THREE.Mesh(tileGeo, mat);
                tileMesh.position.set(posX, 0.08, posZ);
                tileMesh.receiveShadow = true;
                this.scene.add(tileMesh);
                
                // Store metadata for wave animations
                const distFromCenter = Math.sqrt(
                    Math.pow(gx - halfGrid + 0.5, 2) + Math.pow(gz - halfGrid + 0.5, 2)
                );
                
                this.floorTiles[gx][gz] = {
                    mesh: tileMesh,
                    material: mat,
                    x: posX,
                    z: posZ,
                    gx,
                    gz,
                    distFromCenter,
                    baseColor: new THREE.Color(),
                    targetColor: new THREE.Color(),
                    intensity: 0.2,
                    ripple: 0
                };
            }
        }
    }
    
    buildDJBooth() {
        const djGroup = new THREE.Group();
        const djZ = -this.floorWidth / 2 - 3.8;
        djGroup.position.set(0, 0, djZ);
        
        // Elevated stage
        const stageMat = new THREE.MeshStandardMaterial({ color: 0x15161e, metalness: 0.7, roughness: 0.3 });
        const stageGeo = new THREE.BoxGeometry(14, 1.2, 5);
        const stage = new THREE.Mesh(stageGeo, stageMat);
        stage.position.y = 0.6;
        djGroup.add(stage);
        
        // Neon edge strip along the stage
        const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const stripGeo = new THREE.BoxGeometry(14.05, 0.08, 0.1);
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0, 1.2, 2.5);
        djGroup.add(strip);
        
        // DJ Table Counter
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, metalness: 0.9, roughness: 0.2 });
        const table = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 1.4), tableMat);
        table.position.set(0, 1.2 + 0.55, 0.8);
        djGroup.add(table);
        
        // Dual Turntables
        [-1.3, 1.3].forEach(x => {
            // Deck chassis
            const deck = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.9), new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.8 }));
            deck.position.set(x, 1.2 + 1.14, 0.8);
            djGroup.add(deck);
            // Vinyl Platter
            const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 24), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 }));
            platter.position.set(x, 1.2 + 1.19, 0.8);
            djGroup.add(platter);
            // Label
            const label = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.035, 16), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
            label.position.set(x, 1.2 + 1.2, 0.8);
            djGroup.add(label);
        });
        
        // DJ Mixer (Center)
        const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.85), new THREE.MeshStandardMaterial({ color: 0x181820, metalness: 0.6 }));
        mixer.position.set(0, 1.2 + 1.14, 0.8);
        djGroup.add(mixer);
        
        // Mixer LED VU meters
        for (let i = 0; i < 6; i++) {
            const led = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.02, 0.03),
                new THREE.MeshBasicMaterial({ color: i < 4 ? 0x00ff88 : 0xff0044 })
            );
            led.position.set(-0.15 + (i % 2) * 0.3, 1.2 + 1.19, 0.65 + Math.floor(i / 2) * 0.06);
            djGroup.add(led);
        }
        
        // Laptop screen
        const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.45), new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9 }));
        laptopBase.position.set(0.6, 1.2 + 1.3, 0.3);
        laptopBase.rotation.x = -0.15;
        djGroup.add(laptopBase);
        
        const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.02), new THREE.MeshBasicMaterial({ color: 0x00ffee }));
        laptopScreen.position.set(0.6, 1.2 + 1.5, 0.1);
        laptopScreen.rotation.x = 0.25;
        djGroup.add(laptopScreen);
        
        // Giant Equalizer LED Wall behind DJ
        const eqWallWidth = 14;
        const eqWallHeight = 7;
        const eqBarCount = 20;
        const barWidth = (eqWallWidth / eqBarCount) * 0.8;
        
        this.djEqBars = [];
        for (let i = 0; i < eqBarCount; i++) {
            const barGeo = new THREE.BoxGeometry(barWidth, 1, 0.2);
            const hue = i / eqBarCount;
            const barMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.8 - hue * 0.7, 1.0, 0.5)
            });
            const barMesh = new THREE.Mesh(barGeo, barMat);
            const xPos = -eqWallWidth / 2 + (i + 0.5) * (eqWallWidth / eqBarCount);
            barMesh.position.set(xPos, 1.2 + 0.5, -2.1);
            djGroup.add(barMesh);
            this.djEqBars.push({
                mesh: barMesh,
                targetHeight: 1.0,
                currentHeight: 1.0,
                index: i
            });
        }
        
        this.scene.add(djGroup);
    }
    
    buildSpeakerStacks() {
        const stackPositions = [
            [-11, -this.floorWidth / 2 - 2],
            [11, -this.floorWidth / 2 - 2],
            [-15, 6],
            [15, 6]
        ];
        
        this.speakers = [];
        
        stackPositions.forEach(pos => {
            const stackGroup = new THREE.Group();
            stackGroup.position.set(pos[0], 0, pos[1]);
            // Point towards center of dance floor
            stackGroup.lookAt(0, 1.5, 0);
            
            // Subwoofer Box (Bottom)
            const subBoxMat = new THREE.MeshStandardMaterial({
                map: this.textures.speaker,
                roughness: 0.6,
                metalness: 0.3
            });
            const sub = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.0), subBoxMat);
            sub.position.y = 1.1;
            stackGroup.add(sub);
            
            // Large Subwoofer Speaker Cone (physics bounce to bass!)
            const coneMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.2, metalness: 0.5 });
            const subCone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.2, 0.3, 24), coneMat);
            subCone.rotation.x = Math.PI / 2;
            subCone.position.set(0, 1.1, 1.01);
            stackGroup.add(subCone);
            
            // Mid Horn Cabinet (Middle)
            const midBox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.8), subBoxMat);
            midBox.position.y = 2.2 + 0.9;
            stackGroup.add(midBox);
            
            // Dual Mid cones
            [-0.5, 0.5].forEach(cx => {
                const midCone = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.1, 0.2, 20), coneMat);
                midCone.rotation.x = Math.PI / 2;
                midCone.position.set(cx, 3.1, 0.91);
                stackGroup.add(midCone);
            });
            
            // Tweeter / High horn cabinet (Top)
            const topBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.6), subBoxMat);
            topBox.position.y = 4.0 + 0.6;
            stackGroup.add(topBox);
            
            // Horn flare
            const horn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0x050508 }));
            horn.position.set(0, 4.6, 0.81);
            stackGroup.add(horn);
            
            this.scene.add(stackGroup);
            
            this.speakers.push({
                group: stackGroup,
                subCone,
                baseZ: 1.01
            });
        });
    }
    
    buildVIPLounges() {
        const velvetMat = new THREE.MeshStandardMaterial({
            color: 0x5a0a20, // luxurious deep crimson velvet
            roughness: 0.8,
            metalness: 0.1
        });
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37, // golden brass
            metalness: 0.9,
            roughness: 0.15
        });
        
        // Lounges on left and right walls
        [-1, 1].forEach(side => {
            const xPos = side * (this.roomWidth / 2 - 3.5);
            
            [-10, 2, 14].forEach(zPos => {
                const boothGroup = new THREE.Group();
                boothGroup.position.set(xPos, 0, zPos);
                boothGroup.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
                
                // Curved / Box velvet bench
                const seat = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.55, 1.4), velvetMat);
                seat.position.set(0, 0.28, 0);
                boothGroup.add(seat);
                
                const backrest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 0.4), velvetMat);
                backrest.position.set(0, 0.85, -0.6);
                boothGroup.add(backrest);
                
                // VIP Low Glass Table
                const tableTop = new THREE.Mesh(
                    new THREE.BoxGeometry(2.6, 0.08, 1.0),
                    new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 })
                );
                tableTop.position.set(0, 0.45, 1.2);
                boothGroup.add(tableTop);
                
                // Brass table legs
                const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), brassMat);
                tableLeg.position.set(-1.1, 0.22, 1.2);
                boothGroup.add(tableLeg);
                const tableLeg2 = tableLeg.clone();
                tableLeg2.position.set(1.1, 0.22, 1.2);
                boothGroup.add(tableLeg2);
                
                // Abandoned Glowing Cocktails on the table!
                const glassMat = new THREE.MeshBasicMaterial({
                    color: side === 1 ? 0x00ffcc : 0xff0077,
                    transparent: true,
                    opacity: 0.9
                });
                const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.16, 10), glassMat);
                glass.position.set(-0.4 + Math.random() * 0.8, 0.55, 1.2 + (Math.random() - 0.5) * 0.3);
                boothGroup.add(glass);
                this.cocktails.push(glass);
                
                this.scene.add(boothGroup);
            });
        });
        
        // Neon Wall Signs
        this.createNeonSign("PARADISO", new THREE.Vector3(0, 11.5, -this.roomDepth / 2 + 0.2), 0xff0066);
        this.createNeonSign("DISCO 2099", new THREE.Vector3(-this.roomWidth / 2 + 0.2, 8.5, 0), 0x00f0ff, Math.PI / 2);
        this.createNeonSign("NO EXIT", new THREE.Vector3(this.roomWidth / 2 - 0.2, 8.5, 0), 0x39ff14, -Math.PI / 2);
    }
    
    createNeonSign(text, position, colorHex, rotY = 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 512, 128);
        
        ctx.font = 'bold 64px "Arial Black", "Helvetica", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multi-layer neon bloom text
        ctx.shadowColor = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.fillText(text, 256, 64);
        
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, 256, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        const planeMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.6), planeMat);
        sign.position.copy(position);
        sign.rotation.y = rotY;
        this.scene.add(sign);
        
        this.neonSigns.push({
            mesh: sign,
            baseColor: new THREE.Color(colorHex),
            flicker: 0
        });
    }
    
    buildLightingRigs() {
        // 8 Robotic Moving Spotlights on the suspended trusses
        const spotCoords = [
            [-9, 13, -12], [0, 13, -12], [9, 13, -12],
            [-9, 13, 0],                  [9, 13, 0],
            [-9, 13, 12],  [0, 13, 12],  [9, 13, 12]
        ];
        
        const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111116, metalness: 0.9 });
        
        spotCoords.forEach((coord, i) => {
            const group = new THREE.Group();
            group.position.set(...coord);
            
            // Base fixture
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12), fixtureMat);
            group.add(base);
            
            // Yoke
            const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.7), fixtureMat);
            yoke.position.y = -0.3;
            group.add(yoke);
            
            // Head
            const head = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 14), fixtureMat);
            head.position.y = -0.55;
            head.rotation.x = Math.PI;
            group.add(head);
            
            // Spotlight
            const colors = [0xff007f, 0x00f0ff, 0x8b00ff, 0x00ffaa, 0xffaa00, 0xbc13fe];
            const spotLight = new THREE.SpotLight(colors[i % colors.length], 5.0, 32, Math.PI / 8, 0.3, 1.4);
            spotLight.position.set(0, -0.6, 0);
            
            const target = new THREE.Object3D();
            target.position.set(0, 0, 0);
            this.scene.add(target);
            spotLight.target = target;
            
            group.add(spotLight);
            this.scene.add(group);
            
            // Volumetric Light Cone Mesh (Additive Blending)
            const coneGeo = new THREE.ConeGeometry(2.2, 14, 16, 1, true);
            coneGeo.translate(0, -7, 0);
            const coneMat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.12,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const beamCone = new THREE.Mesh(coneGeo, coneMat);
            beamCone.position.set(0, -0.6, 0);
            group.add(beamCone);
            
            this.movingSpots.push({
                group,
                light: spotLight,
                target,
                cone: beamCone,
                baseAngle: i * (Math.PI / 4),
                speed: 0.8 + (i % 3) * 0.4
            });
        });
        
        // Ambient Club Night Light (deep moody blue)
        const amb = new THREE.AmbientLight(0x0a0c1a, 1.2);
        this.scene.add(amb);
    }
    
    buildLasers() {
        const laserColors = [0x00ff44, 0x00f0ff, 0xff0055, 0xbc13fe];
        const laserOriginY = 13.5;
        const laserOrigins = [
            new THREE.Vector3(-14, laserOriginY, -18),
            new THREE.Vector3(14, laserOriginY, -18),
            new THREE.Vector3(-14, laserOriginY, 18),
            new THREE.Vector3(14, laserOriginY, 18)
        ];
        
        this.laserBeams = [];
        
        laserOrigins.forEach((orig, oIdx) => {
            // 4 beams per projector = 16 laser beams!
            for (let b = 0; b < 4; b++) {
                const beamGeo = new THREE.CylinderGeometry(0.025, 0.05, 38, 6);
                beamGeo.translate(0, 19, 0);
                beamGeo.rotateX(Math.PI / 2);
                
                const color = laserColors[(oIdx + b) % laserColors.length];
                const beamMat = new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                
                const mesh = new THREE.Mesh(beamGeo, beamMat);
                mesh.position.copy(orig);
                this.scene.add(mesh);
                
                this.laserBeams.push({
                    mesh,
                    material: beamMat,
                    origin: orig,
                    offsetAngle: (b * Math.PI) / 6,
                    speed: 1.2 + b * 0.3,
                    color: new THREE.Color(color)
                });
            }
        });
    }
    
    buildFog() {
        const count = 350;
        const fogGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        
        this.fogData = [];
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * (this.roomWidth - 4);
            const y = 0.2 + Math.random() * 4.5;
            const z = (Math.random() - 0.5) * (this.roomDepth - 4);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            scales[i] = 2.0 + Math.random() * 3.0;
            
            this.fogData.push({
                baseX: x,
                baseZ: z,
                y,
                driftSpeedX: (Math.random() - 0.5) * 0.6,
                driftSpeedZ: (Math.random() - 0.5) * 0.6
            });
        }
        
        fogGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const fogMat = new THREE.PointsMaterial({
            size: 4.5,
            map: this.textures.fog,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0x4466aa
        });
        
        this.fogParticles = new THREE.Points(fogGeo, fogMat);
        this.scene.add(this.fogParticles);
    }
    
    update(time, audioMetrics, ballPos, effectsState) {
        const { bass, mid, treble, overall, isBeat } = audioMetrics;
        const palette = this.palettes[this.currentPalette];
        
        // 1. Rotate Disco Ball & Mirrored Glint Specks
        const spinSpeed = effectsState.supernova ? 4.5 : (0.25 + overall * 0.8);
        this.discoBall.rotation.y += 0.015 * spinSpeed;
        
        // Animate mirror specks across the room
        if (this.mirrorSpecks) {
            const posAttr = this.mirrorSpecks.geometry.attributes.position;
            const ballY = 9.8;
            for (let i = 0; i < this.speckData.length; i++) {
                const s = this.speckData[i];
                s.theta += 0.008 * s.speed * spinSpeed;
                
                const x = Math.sin(s.phi) * Math.cos(s.theta) * s.dist;
                const y = Math.max(0.1, ballY + Math.cos(s.phi) * s.dist);
                const z = Math.sin(s.phi) * Math.sin(s.theta) * s.dist;
                
                posAttr.setXYZ(i, x, y, z);
            }
            posAttr.needsUpdate = true;
            this.mirrorSpecks.material.opacity = 0.6 + bass * 0.4;
        }
        
        // 2. Animate 16x16 LED Dancefloor
        const tileDistRadius = 2.2;
        for (let gx = 0; gx < this.floorGridSize; gx++) {
            for (let gz = 0; gz < this.floorGridSize; gz++) {
                const tile = this.floorTiles[gx][gz];
                
                // Distance to ball
                const distToBall = Math.sqrt(
                    Math.pow(tile.x - ballPos.x, 2) + Math.pow(tile.z - ballPos.z, 2)
                );
                
                // Color pattern: diagonal wave + bass pulse
                const wavePhase = (gx * 0.25 + gz * 0.25) - time * 2.8;
                const waveVal = Math.sin(wavePhase) * 0.5 + 0.5;
                
                // Palette color interpolation
                const palIdx1 = Math.floor(waveVal * (palette.length - 1));
                const palIdx2 = (palIdx1 + 1) % palette.length;
                const colorBlend = (waveVal * (palette.length - 1)) % 1;
                
                tile.baseColor.copy(palette[palIdx1]).lerp(palette[palIdx2], colorBlend);
                
                // Ball interaction: tiles glow super bright beneath and around the ball
                let ballInfluence = 0;
                if (distToBall < tileDistRadius) {
                    ballInfluence = (1.0 - (distToBall / tileDistRadius)) * 2.8;
                }
                
                // Shockwave / Ripple from ball landing or space slam
                if (tile.ripple > 0) {
                    ballInfluence += tile.ripple * 2.5;
                    tile.ripple = Math.max(0, tile.ripple - 0.04);
                }
                
                // Bass boost to floor
                const finalIntensity = 0.25 + waveVal * 0.45 + bass * 0.8 + ballInfluence;
                
                if (ballInfluence > 0.5) {
                    // Golden/Cyan flare right under ball
                    tile.material.emissive.setHex(0xffffff);
                    tile.material.emissiveIntensity = finalIntensity;
                } else {
                    tile.material.emissive.copy(tile.baseColor);
                    tile.material.emissiveIntensity = finalIntensity;
                }
            }
        }
        
        // 3. Animate DJ Equalizer Wall Bars
        this.djEqBars.forEach((bar, idx) => {
            const freqVal = (Math.sin(time * 6 + idx * 0.4) * 0.5 + 0.5) * (idx < 5 ? bass : (idx < 12 ? mid : treble));
            const targetH = 0.4 + freqVal * 4.5;
            bar.currentHeight += (targetH - bar.currentHeight) * 0.25;
            bar.mesh.scale.y = Math.max(0.2, bar.currentHeight);
            bar.mesh.position.y = 1.2 + bar.mesh.scale.y / 2;
        });
        
        // 4. Punch Subwoofer Cones on bass kicks
        this.speakers.forEach(spk => {
            const punch = bass * 0.22;
            spk.subCone.position.z = spk.baseZ + punch;
        });
        
        // 5. Robotic Moving Spotlights Sweep
        this.movingSpots.forEach((spot, idx) => {
            const angle = time * spot.speed + spot.baseAngle;
            const targetX = Math.sin(angle) * 8;
            const targetZ = Math.cos(angle * 0.8) * 8;
            spot.target.position.set(targetX, 0, targetZ);
            
            spot.group.lookAt(targetX, 0, targetZ);
            
            // Light intensity pulses with treble and beat
            spot.light.intensity = 3.5 + treble * 4.0 + (isBeat ? 4.0 : 0);
            spot.cone.material.opacity = 0.12 + treble * 0.25;
        });
        
        // 6. Laser Beams Sweep & Strobe
        if (this.laserBeams.length > 0) {
            const laserActive = effectsState.lasers || effectsState.strobe;
            this.laserBeams.forEach((laser, idx) => {
                if (laserActive) {
                    laser.mesh.visible = true;
                    const angle = time * laser.speed + laser.offsetAngle;
                    const targetX = Math.sin(angle) * 16;
                    const targetZ = Math.cos(angle * 1.3) * 16;
                    const targetY = Math.abs(Math.sin(angle * 0.7)) * 4.0;
                    
                    laser.mesh.lookAt(targetX, targetY, targetZ);
                    laser.material.opacity = 0.6 + Math.random() * 0.4;
                } else {
                    // Chill laser scanning
                    const angle = time * 0.6 + laser.offsetAngle;
                    const targetX = Math.sin(angle) * 10;
                    const targetZ = Math.cos(angle * 0.9) * 10;
                    laser.mesh.lookAt(targetX, 0.5, targetZ);
                    laser.material.opacity = 0.25 + mid * 0.35;
                }
            });
        }
        
        // 7. Fog Particle Drift
        if (this.fogParticles) {
            const posAttr = this.fogParticles.geometry.attributes.position;
            for (let i = 0; i < this.fogData.length; i++) {
                const f = this.fogData[i];
                let x = posAttr.getX(i) + f.driftSpeedX * 0.02;
                let z = posAttr.getZ(i) + f.driftSpeedZ * 0.02;
                
                // Wrap around room bounds
                if (Math.abs(x) > this.roomWidth / 2 - 2) x = -x * 0.9;
                if (Math.abs(z) > this.roomDepth / 2 - 2) z = -z * 0.9;
                
                posAttr.setXYZ(i, x, f.y, z);
            }
            posAttr.needsUpdate = true;
            this.fogParticles.material.opacity = 0.18 + bass * 0.15;
        }
        
        // 8. Neon Signs subtle electrical flicker
        this.neonSigns.forEach(sign => {
            if (Math.random() < 0.03) {
                sign.mesh.visible = Math.random() > 0.4;
            } else {
                sign.mesh.visible = true;
            }
        });
    }
    
    triggerFloorRipple(centerPos, force = 1.0) {
        // Expand a shockwave ring across dancefloor tiles
        for (let gx = 0; gx < this.floorGridSize; gx++) {
            for (let gz = 0; gz < this.floorGridSize; gz++) {
                const tile = this.floorTiles[gx][gz];
                const d = Math.sqrt(Math.pow(tile.x - centerPos.x, 2) + Math.pow(tile.z - centerPos.z, 2));
                const delay = d * 40; // ms
                setTimeout(() => {
                    tile.ripple = Math.min(1.5, force * (1.0 - Math.min(d / 18, 0.8)));
                }, delay);
            }
        }
    }
    
    cyclePalette() {
        this.currentPalette = (this.currentPalette + 1) % this.palettes.length;
        return this.currentPalette;
    }
}

window.DiscoScene = DiscoScene;
