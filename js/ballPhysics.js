/**
 * NEON VELVET: Rolling Ball Physics, Controls, Skins & Light Trails
 * Physically accurate rolling rotation, jumping, turbo boost,
 * boundary collision, particle spark trails, and multiple skins.
 */

class BallPhysics {
    constructor(scene, discoScene) {
        this.scene = scene;
        this.discoScene = discoScene;
        
        // Physics properties
        this.radius = 0.65;
        this.position = new THREE.Vector3(0, this.radius + 0.08, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = 36.0;
        this.maxSpeed = 16.0;
        this.boostMultiplier = 2.2;
        this.friction = 0.94;
        this.airDrag = 0.985;
        this.gravity = -32.0;
        this.jumpForce = 14.5;
        this.isGrounded = true;
        this.isBoosting = false;
        
        // Boundaries
        this.boundX = this.discoScene.roomWidth / 2 - this.radius - 0.5;
        this.boundZ = this.discoScene.roomDepth / 2 - this.radius - 0.5;
        
        // DJ Stage Collision Box
        this.djBox = {
            minX: -7.5,
            maxX: 7.5,
            minZ: -this.discoScene.floorWidth / 2 - 4.5,
            maxZ: -this.discoScene.floorWidth / 2 - 1.2,
            height: 1.2
        };
        
        // Ball Mesh & Container
        this.ballMesh = null;
        this.coreLight = null;
        this.trailPoints = [];
        this.maxTrailLength = 40;
        this.trailMesh = null;
        this.sparkParticles = null;
        this.sparks = [];
        
        // Skins
        this.currentSkinIndex = 0;
        this.skins = [
            { name: "Mirror Disco Ball", type: "disco" },
            { name: "Cyber Chrome", type: "chrome" },
            { name: "Plasma Core", type: "plasma" },
            { name: "Vaporwave Neon", type: "vapor" },
            { name: "Golden Glitz", type: "gold" }
        ];
        
        this.createBallMesh();
        this.createTrailSystem();
        this.createSparkSystem();
    }
    
    createBallMesh() {
        const geo = new THREE.SphereGeometry(this.radius, 32, 24);
        
        // Initial skin: Mirror Disco
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.96,
            roughness: 0.08,
            normalMap: this.discoScene.textures.discoFacets
        });
        
        this.ballMesh = new THREE.Mesh(geo, this.material);
        this.ballMesh.position.copy(this.position);
        this.ballMesh.castShadow = true;
        this.scene.add(this.ballMesh);
        
        // Internal Point Light (casts glow onto floor tiles right beneath ball)
        this.coreLight = new THREE.PointLight(0x00f0ff, 2.5, 6.0, 1.5);
        this.coreLight.position.copy(this.position);
        this.scene.add(this.coreLight);
    }
    
    setSkin(index) {
        this.currentSkinIndex = index % this.skins.length;
        const skin = this.skins[this.currentSkinIndex];
        
        switch (skin.type) {
            case "disco":
                this.material.color.setHex(0xffffff);
                this.material.metalness = 0.96;
                this.material.roughness = 0.08;
                this.material.normalMap = this.discoScene.textures.discoFacets;
                this.material.emissive.setHex(0x000000);
                this.material.wireframe = false;
                this.coreLight.color.setHex(0x00f0ff);
                break;
                
            case "chrome":
                this.material.color.setHex(0xd0e8ff);
                this.material.metalness = 1.0;
                this.material.roughness = 0.02;
                this.material.normalMap = null;
                this.material.emissive.setHex(0x101530);
                this.material.wireframe = false;
                this.coreLight.color.setHex(0xff00aa);
                break;
                
            case "plasma":
                this.material.color.setHex(0xff3300);
                this.material.metalness = 0.2;
                this.material.roughness = 0.2;
                this.material.normalMap = null;
                this.material.emissive.setHex(0xff4400);
                this.material.emissiveIntensity = 0.8;
                this.material.wireframe = false;
                this.coreLight.color.setHex(0xff5500);
                break;
                
            case "vapor":
                this.material.color.setHex(0x110033);
                this.material.metalness = 0.5;
                this.material.roughness = 0.3;
                this.material.normalMap = null;
                this.material.emissive.setHex(0xbc13fe);
                this.material.emissiveIntensity = 0.6;
                this.material.wireframe = true;
                this.coreLight.color.setHex(0xbc13fe);
                break;
                
            case "gold":
                this.material.color.setHex(0xffd700);
                this.material.metalness = 0.95;
                this.material.roughness = 0.1;
                this.material.normalMap = this.discoScene.textures.discoFacets;
                this.material.emissive.setHex(0x332200);
                this.material.wireframe = false;
                this.coreLight.color.setHex(0xffaa00);
                break;
        }
        
        return skin.name;
    }
    
    cycleSkin() {
        return this.setSkin(this.currentSkinIndex + 1);
    }
    
    createTrailSystem() {
        // Dynamic ribbon trail behind the rolling ball
        const trailGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxTrailLength * 3);
        const colors = new Float32Array(this.maxTrailLength * 3);
        
        for (let i = 0; i < this.maxTrailLength; i++) {
            positions[i * 3] = this.position.x;
            positions[i * 3 + 1] = this.position.y;
            positions[i * 3 + 2] = this.position.z;
            
            const alpha = 1.0 - (i / this.maxTrailLength);
            colors[i * 3] = 0.0;
            colors[i * 3 + 1] = 0.95 * alpha;
            colors[i * 3 + 2] = 1.0 * alpha;
        }
        
        trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const trailMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            linewidth: 3,
            blending: THREE.AdditiveBlending
        });
        
        this.trailMesh = new THREE.Line(trailGeo, trailMat);
        this.scene.add(this.trailMesh);
    }
    
    createSparkSystem() {
        const maxSparks = 120;
        const sparkGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(maxSparks * 3);
        const colors = new Float32Array(maxSparks * 3);
        
        for (let i = 0; i < maxSparks; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -100; // hidden initially
            positions[i * 3 + 2] = 0;
            
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 0.2;
            
            this.sparks.push({
                x: 0, y: -100, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 0,
                maxLife: 1.0
            });
        }
        
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const sparkMat = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            map: this.discoScene.textures.fog,
            depthWrite: false
        });
        
        this.sparkParticles = new THREE.Points(sparkGeo, sparkMat);
        this.scene.add(this.sparkParticles);
    }
    
    emitSparks(origin, count = 15, speed = 6.0, colorHex = 0x00f0ff) {
        let spawned = 0;
        const c = new THREE.Color(colorHex);
        const colAttr = this.sparkParticles.geometry.attributes.color;
        
        for (let i = 0; i < this.sparks.length && spawned < count; i++) {
            const s = this.sparks[i];
            if (s.life <= 0) {
                s.x = origin.x;
                s.y = origin.y;
                s.z = origin.z;
                
                const angle = Math.random() * Math.PI * 2;
                const spread = Math.random() * speed;
                s.vx = Math.cos(angle) * spread;
                s.vy = 2.0 + Math.random() * speed;
                s.vz = Math.sin(angle) * spread;
                
                s.maxLife = 0.4 + Math.random() * 0.4;
                s.life = s.maxLife;
                
                colAttr.setXYZ(i, c.r, c.g, c.b);
                spawned++;
            }
        }
        colAttr.needsUpdate = true;
    }
    
    update(delta, inputVector, isJumpRequested, isBoostActive, effectsState) {
        const audio = window.discoAudio;
        this.isBoosting = isBoostActive;
        
        // 1. Acceleration & Movement
        const currentAccel = this.acceleration * (this.isBoosting ? this.boostMultiplier : 1.0);
        const maxSpd = this.maxSpeed * (this.isBoosting ? this.boostMultiplier : 1.0);
        
        if (inputVector.lengthSq() > 0.001) {
            this.velocity.x += inputVector.x * currentAccel * delta;
            this.velocity.z += inputVector.z * currentAccel * delta;
        }
        
        // Horizontal speed clamp
        const hSpeedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
        if (hSpeedSq > maxSpd * maxSpd) {
            const hSpeed = Math.sqrt(hSpeedSq);
            this.velocity.x = (this.velocity.x / hSpeed) * maxSpd;
            this.velocity.z = (this.velocity.z / hSpeed) * maxSpd;
        }
        
        // 2. Friction / Drag
        if (this.isGrounded) {
            this.velocity.x *= Math.pow(this.friction, delta * 60);
            this.velocity.z *= Math.pow(this.friction, delta * 60);
        } else {
            this.velocity.x *= Math.pow(this.airDrag, delta * 60);
            this.velocity.z *= Math.pow(this.airDrag, delta * 60);
        }
        
        // 3. Gravity & Jumping
        const currentGravity = effectsState.zeroG ? 1.8 : this.gravity;
        
        if (effectsState.zeroG) {
            // In Zero-G, float upward and allow 3D vertical steering
            this.velocity.y += (1.5 - this.velocity.y) * 2.0 * delta;
            if (isJumpRequested) {
                this.velocity.y += 6.0 * delta;
            }
            if (this.position.y > this.discoScene.roomHeight - 2.5) {
                this.position.y = this.discoScene.roomHeight - 2.5;
                this.velocity.y = -1.0;
            }
        } else {
            // Normal gravity
            this.velocity.y += currentGravity * delta;
            
            if (isJumpRequested && this.isGrounded) {
                this.velocity.y = this.jumpForce;
                this.isGrounded = false;
                if (audio) audio.playJump();
                this.emitSparks(this.position, 12, 4.0, 0x00f0ff);
            }
        }
        
        // 4. Update Position
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.position.z += this.velocity.z * delta;
        
        // 5. Floor Collision
        const floorHeight = this.radius + 0.08;
        if (this.position.y <= floorHeight) {
            this.position.y = floorHeight;
            
            // Check landing impact force
            if (this.velocity.y < -4.0) {
                const impactForce = Math.min(2.5, Math.abs(this.velocity.y) / 6.0);
                if (audio) audio.playSlamImpact(impactForce);
                this.discoScene.triggerFloorRipple(this.position, impactForce);
                this.emitSparks(this.position, Math.floor(18 * impactForce), 8.0, 0xff00ff);
            }
            
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // 6. Wall Collisions (Elastic Bounce)
        if (Math.abs(this.position.x) > this.boundX) {
            this.position.x = Math.sign(this.position.x) * this.boundX;
            this.velocity.x = -this.velocity.x * 0.75;
            if (audio && Math.abs(this.velocity.x) > 2) audio.playBounce();
            this.emitSparks(this.position, 10, 5.0, 0xff0066);
        }
        
        if (Math.abs(this.position.z) > this.boundZ) {
            this.position.z = Math.sign(this.position.z) * this.boundZ;
            this.velocity.z = -this.velocity.z * 0.75;
            if (audio && Math.abs(this.velocity.z) > 2) audio.playBounce();
            this.emitSparks(this.position, 10, 5.0, 0xff0066);
        }
        
        // 7. DJ Stage Collision
        const dj = this.djBox;
        if (this.position.x > dj.minX && this.position.x < dj.maxX &&
            this.position.z > dj.minZ && this.position.z < dj.maxZ) {
            if (this.position.y < dj.height + this.radius) {
                // Bounce out towards dancefloor
                this.position.z = dj.maxZ + this.radius + 0.05;
                this.velocity.z = Math.abs(this.velocity.z) * 0.7 + 2.0;
                if (audio) audio.playBounce();
                this.emitSparks(this.position, 12, 6.0, 0x00ffff);
            }
        }
        
        // 8. Physically Accurate Rolling Rotation!
        // As the sphere rolls over distance (dx, dz), angle = distance / radius
        const dx = this.velocity.x * delta;
        const dz = this.velocity.z * delta;
        
        if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
            // Rotation axis perpendicular to movement vector
            const rotAxis = new THREE.Vector3(dz, 0, -dx).normalize();
            const distanceMoved = Math.sqrt(dx * dx + dz * dz);
            const rotAngle = distanceMoved / this.radius;
            
            const q = new THREE.Quaternion();
            q.setFromAxisAngle(rotAxis, rotAngle);
            this.ballMesh.quaternion.premultiply(q);
        }
        
        // Sync Mesh position
        this.ballMesh.position.copy(this.position);
        this.coreLight.position.copy(this.position);
        this.coreLight.position.y += 0.2;
        
        // Audio hum update
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (audio) {
            audio.updateBallSpeed(currentSpeed, this.isGrounded);
        }
        
        // 9. Update Trail
        this.updateTrail(currentSpeed);
        
        // 10. Update Sparks
        this.updateSparks(delta);
    }
    
    updateTrail(currentSpeed) {
        if (!this.trailMesh) return;
        
        // Add current position to head of trail
        this.trailPoints.unshift(this.position.clone());
        if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.pop();
        }
        
        const posAttr = this.trailMesh.geometry.attributes.position;
        const colAttr = this.trailMesh.geometry.attributes.color;
        
        const boostColor = new THREE.Color(0xff0077);
        const normalColor = new THREE.Color(0x00f0ff);
        const trailColor = this.isBoosting ? boostColor : normalColor;
        
        for (let i = 0; i < this.maxTrailLength; i++) {
            if (i < this.trailPoints.length) {
                const pt = this.trailPoints[i];
                posAttr.setXYZ(i, pt.x, pt.y, pt.z);
                
                const alpha = Math.pow(1.0 - (i / this.maxTrailLength), 1.8);
                colAttr.setXYZ(i, trailColor.r * alpha, trailColor.g * alpha, trailColor.b * alpha);
            } else {
                posAttr.setXYZ(i, this.position.x, this.position.y, this.position.z);
                colAttr.setXYZ(i, 0, 0, 0);
            }
        }
        
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        
        // When boosting or going fast, occasionally shed sparks
        if ((this.isBoosting || currentSpeed > 10.0) && Math.random() < 0.4) {
            this.emitSparks(this.position, 3, 3.0, this.isBoosting ? 0xff0055 : 0x00f0ff);
        }
    }
    
    updateSparks(delta) {
        if (!this.sparkParticles) return;
        const posAttr = this.sparkParticles.geometry.attributes.position;
        
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            if (s.life > 0) {
                s.life -= delta;
                s.vy -= 18.0 * delta; // spark gravity
                
                s.x += s.vx * delta;
                s.y += s.vy * delta;
                s.z += s.vz * delta;
                
                // Ground bounce
                if (s.y < 0.1) {
                    s.y = 0.1;
                    s.vy = -s.vy * 0.4;
                    s.vx *= 0.7;
                    s.vz *= 0.7;
                }
                
                posAttr.setXYZ(i, s.x, s.y, s.z);
            } else {
                posAttr.setXYZ(i, 0, -100, 0);
            }
        }
        
        posAttr.needsUpdate = true;
    }
    
    getSpeed() {
        return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    }
}

window.BallPhysics = BallPhysics;
