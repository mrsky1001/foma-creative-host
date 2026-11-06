/**
 * Professional Particle Animation Engine
 * 
 * Features:
 * - Physics-based Brownian motion with Simplex noise
 * - "Big Bang" spawn animation from center
 * - Interactive shape morphing on click
 * - Boundary reflection
 * - Depth-based parallax effect
 * 
 * @author AI Assistant
 * @version 2.0.0
 */

// ============================================================================
// SIMPLEX NOISE IMPLEMENTATION (for smooth organic movement)
// ============================================================================

class SimplexNoise {
    constructor(seed = Math.random() * 1000) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);

        // Initialize permutation table with seed
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }

        // Shuffle based on seed
        let n = seed;
        for (let i = 255; i > 0; i--) {
            n = (n * 16807) % 2147483647;
            const j = n % (i + 1);
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }

        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];

        this.F2 = 0.5 * (Math.sqrt(3) - 1);
        this.G2 = (3 - Math.sqrt(3)) / 6;
    }

    noise2D(xin, yin) {
        const { perm, permMod12, grad3, F2, G2 } = this;

        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;

        const ii = i & 255;
        const jj = j & 255;

        let n0 = 0, n1 = 0, n2 = 0;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = permMod12[ii + perm[jj]];
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = permMod12[ii + i1 + perm[jj + j1]];
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = permMod12[ii + 1 + perm[jj + 1]];
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
        }

        return 70 * (n0 + n1 + n2);
    }
}

// ============================================================================
// PARTICLE CLASS
// ============================================================================

class Particle {
    constructor(config, index, totalParticles) {
        this.config = config;
        this.index = index;

        // Shape types
        this.shapeTypes = ['circle', 'rect', 'polygon'];
        this.currentShapeIndex = Math.floor(Math.random() * this.shapeTypes.length);
        this.type = this.shapeTypes[this.currentShapeIndex];

        // Pick a random color
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];

        // Size (with depth factor for parallax)
        this.depth = 0.3 + Math.random() * 0.7; // 0.3 to 1.0 (further = smaller, slower)
        this.baseSize = config.minSize + Math.random() * (config.maxSize - config.minSize);
        this.size = this.baseSize * this.depth;

        // Starting position (center of screen for Big Bang)
        // Account for CSS offset (left: -40% means we need to offset the center)
        this.startX = window.innerWidth * 0.9; // Adjusted for CSS left: -40%
        this.startY = window.innerHeight / 2;

        // Target position (where particle will end up after Big Bang)
        // Use config.docHeight if available (set after content loads), otherwise estimate
        const docHeight = config.docHeight || Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            window.innerHeight * 3
        );

        // Spread across full page width (accounting for CSS: left: -40%, width: 180%)
        // The SVG is positioned at -40% left and is 180% wide, so we need wider spread
        this.targetX = Math.random() * window.innerWidth * 1.8;
        this.targetY = Math.random() * docHeight;

        // Current position
        this.baseX = this.startX;
        this.baseY = this.startY;
        this.noiseDeltaX = 0;
        this.noiseDeltaY = 0;
        this.x = this.startX;
        this.y = this.startY;

        // Rotation
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 0.5;

        // Noise offset for unique movement pattern
        this.noiseOffsetX = Math.random() * 1000;
        this.noiseOffsetY = Math.random() * 1000;

        // Animation state
        this.opacity = 0;
        this.scale = 0;
        this.spawnProgress = 0;
        this.spawnDelay = (index / totalParticles) * config.spawnDuration * 0.3;

        // Morphing state
        this.isMorphing = false;
        this.morphProgress = 0;
        this.morphTargetType = null;
        this.morphVelocityX = 0;
        this.morphVelocityY = 0;

        // Create SVG element
        this.createElement();
    }

    createElement() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.style.cursor = 'pointer';
        this.element.style.pointerEvents = 'auto'; // Re-enable interaction for the shape itself
        this.updateShape();
        this.element.addEventListener('click', (e) => this.onClick(e));
    }

    updateShape() {
        // Clear existing shape
        this.element.innerHTML = '';

        let shape;
        const s = this.size;

        switch (this.type) {
            case 'circle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shape.setAttribute('r', s);
                shape.setAttribute('cx', 0);
                shape.setAttribute('cy', 0);
                break;

            case 'rect':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('width', s * 2);
                shape.setAttribute('height', s * 2);
                shape.setAttribute('x', -s);
                shape.setAttribute('y', -s);
                shape.setAttribute('rx', s * 0.15); // Slight rounded corners
                break;

            case 'polygon':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                // Equilateral triangle with ALL THREE corners smoothly rounded
                const rFactor = 0.25;
                const h = s * 0.866;
                const cr = s * rFactor;
                const ch = h * rFactor;

                const p1x = -ch, p1y = -s + cr * 1.5;
                const p2x = ch, p2y = -s + cr * 1.5;
                const p3x = h - ch, p3y = s * 0.5 - cr * 1.5;
                const p4x = h - ch * 1.5, p4y = s * 0.5;
                const p5x = -h + ch * 1.5, p5y = s * 0.5;
                const p6x = -h + ch, p6y = s * 0.5 - cr * 1.5;

                shape.setAttribute('d',
                    `M ${p1x},${p1y} ` +
                    `Q 0,${-s} ${p2x},${p2y} ` +
                    `L ${p3x},${p3y} ` +
                    `Q ${h},${s * 0.5} ${p4x},${p4y} ` +
                    `L ${p5x},${p5y} ` +
                    `Q ${-h},${s * 0.5} ${p6x},${p6y} Z`
                );
                break;
        }

        shape.setAttribute('fill', this.color);
        shape.setAttribute('opacity', this.config.shapeOpacity);
        this.shapeElement = shape;
        this.element.appendChild(shape);
    }

    onClick(e) {
        e?.stopPropagation();
        this.triggerMorph();
    }

    // Check if a point (in SVG coordinates) is inside this particle
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Use size * 1.5 for easier clicking
        return distance < this.size * 1.5;
    }

    // Trigger morph animation (can be called externally)
    triggerMorph() {
        if (this.isMorphing) return false;

        // Cycle to next shape
        this.currentShapeIndex = (this.currentShapeIndex + 1) % this.shapeTypes.length;
        this.morphTargetType = this.shapeTypes[this.currentShapeIndex];

        // Random velocity for gentle drift during morph
        const angle = Math.random() * Math.PI * 2;
        const force = 50 + Math.random() * 50; // Gentle push 50-100
        this.morphVelocityX = Math.cos(angle) * force;
        this.morphVelocityY = Math.sin(angle) * force;

        this.isMorphing = true;
        this.morphProgress = 0;

        return true; // Morph was triggered
    }

    updateMorph(deltaTime) {
        if (!this.isMorphing) return;

        // morphDuration is in ms, deltaTime is in seconds
        this.morphProgress += (deltaTime * 1000) / this.config.morphDuration;

        // Apply gentle velocity drift
        const decay = Math.pow(0.92, deltaTime * 60);
        this.morphVelocityX *= decay;
        this.morphVelocityY *= decay;
        this.x += this.morphVelocityX * deltaTime;
        this.y += this.morphVelocityY * deltaTime;

        // MELT AND REFORM EFFECT:
        // 0.0 -> 0.5: Shrink to almost 0 (melt)
        // 0.5: Swap shape
        // 0.5 -> 1.0: Grow back to 1 (reform)

        let morphScale = 1;
        if (this.morphProgress < 0.5) {
            // Shrink phase (ease in)
            const t = this.morphProgress * 2; // 0 to 1
            morphScale = 1 - (t * t); // Ease in to 0
        } else {
            // Swap shape at the exact midway point if we haven't already
            if (this.type !== this.morphTargetType) {
                this.type = this.morphTargetType;
                this.updateShape();
            }

            // Grow phase (ease out elastic)
            const t = (this.morphProgress - 0.5) * 2; // 0 to 1
            // Simple ease out or slight overshoot
            morphScale = t * (2 - t);
        }

        // Combine with base scale from spawn/depth (baseScale is handled in render via this.scale)
        // We temporarily override the scale property for the morph effect
        this.currentMorphScale = morphScale;

        // Complete morph
        if (this.morphProgress >= 1) {
            this.isMorphing = false;
            this.currentMorphScale = 1;
            this.morphVelocityX = 0;
            this.morphVelocityY = 0;
            // Ensure final shape is correct
            if (this.type !== this.morphTargetType) {
                this.type = this.morphTargetType;
                this.updateShape();
            }
        }
    }

    updateSpawn(time, deltaTime) {
        if (this.spawnProgress >= 1) return false;

        const elapsed = time - this.spawnDelay;
        if (elapsed < 0) return true;

        // Easing: easeOutExpo
        const duration = this.config.spawnDuration;
        const t = Math.min(elapsed / duration, 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        this.spawnProgress = eased;

        // Interpolate from center to target (update base position)
        this.baseX = this.startX + (this.targetX - this.startX) * eased;
        this.baseY = this.startY + (this.targetY - this.startY) * eased;

        // Update final position (base + noise)
        this.x = this.baseX + this.noiseDeltaX;
        this.y = this.baseY + this.noiseDeltaY;

        // Fade in and scale up
        this.opacity = eased;
        this.scale = eased;

        return this.spawnProgress < 1;
    }

    updateBrownian(time, noise, deltaTime) {
        // Always run brownian motion, blending it in as particles appear
        const { noiseScale, noiseSpeed, moveSpeed } = this.config;

        // Get noise values for smooth direction changes
        const noiseTime = time * noiseSpeed;
        const noiseX = noise.noise2D(
            (this.x * noiseScale) + this.noiseOffsetX,
            noiseTime
        );
        const noiseY = noise.noise2D(
            (this.y * noiseScale) + this.noiseOffsetY,
            noiseTime + 100
        );

        // Move based on noise (deeper particles move slower)
        const combinedSpeed = moveSpeed * this.depth * deltaTime;

        // Accumulate noise offset
        // Multiply by spawnProgress^2 to smoothly ease in the brownian motion
        // This prevents the "jump" when they reach their target because noise starts at 0 impact
        const influence = this.spawnProgress * this.spawnProgress;

        this.noiseDeltaX += noiseX * combinedSpeed * influence;
        this.noiseDeltaY += noiseY * combinedSpeed * influence;

        // Soft boundary steering - steer the BASE position back
        // Allow some overflow but gradually steer back
        const margin = 100; // Allow particles to go this far outside
        const softZone = 200; // Start steering when this close to edge
        const steerStrength = 0.02; // How strongly to steer back

        // Account for CSS offset (left: -40%, width: 180%)
        const maxX = window.innerWidth * 1.8;
        const maxY = this.config.docHeight || document.body.scrollHeight;

        // Determine current effective position for steering check
        const currX = this.baseX + this.noiseDeltaX;
        const currY = this.baseY + this.noiseDeltaY;

        // Soft steering on X axis (affect base position)
        if (currX < softZone) {
            this.baseX += (softZone - currX) * steerStrength;
        } else if (currX > maxX - softZone) {
            this.baseX -= (currX - (maxX - softZone)) * steerStrength;
        }

        // Soft steering on Y axis
        if (currY < softZone) {
            this.baseY += (softZone - currY) * steerStrength;
        } else if (currY > maxY - softZone) {
            this.baseY -= (currY - (maxY - softZone)) * steerStrength;
        }

        // Hard limits (with margin for overflow)
        this.baseX = Math.max(-margin, Math.min(maxX + margin, this.baseX));
        this.baseY = Math.max(-margin, Math.min(maxY + margin, this.baseY));

        // Update final position
        this.x = this.baseX + this.noiseDeltaX;
        this.y = this.baseY + this.noiseDeltaY;

        // Rotate slowly
        this.rotation += this.rotationSpeed * this.depth;
    }

    render() {
        // Use SVG transform attribute for proper rendering
        // Apply morph scale if active, otherwise standard scale (from spawn/base)
        const displayScale = (this.scale || 0) * (this.currentMorphScale !== undefined ? this.currentMorphScale : 1);

        this.element.setAttribute('transform',
            `translate(${this.x}, ${this.y}) rotate(${this.rotation}) scale(${displayScale})`
        );
        // Set opacity on the shape element with depth-of-field effect: smaller/distant particles are more transparent
        if (this.shapeElement) {
            const baseShapeOpacity = this.config.shapeOpacity || 0.6;
            const depthOpacityFactor = 0.4 + 0.6 * Math.pow(this.depth, 1.2);
            const currentOpacity = (this.opacity || 0) * baseShapeOpacity * depthOpacityFactor;
            this.shapeElement.setAttribute('opacity', currentOpacity);
        }
    }
}

// ============================================================================
// PARTICLE ENGINE
// ============================================================================

class ParticleEngine {
    constructor(options = {}) {
        // Palette-specific particle colors
        const PALETTE_COLORS = {
            azure:   ['#3B83BD', '#5AA0D3', '#2E6B9E', '#7DBAEB', '#1D4A6E'],
            default: ['#FD74FF', '#3771FC', '#7C5CE4', '#542A95', '#ACC7FE'],
            mono:    ['#FFFFFF', '#B0B0B0', '#808080', '#505050', '#D0D0D0'],
            purple:  ['#7F77DD', '#5A4FBB', '#9B94E0', '#4A3FA0', '#B5AFEB'],
            coral:   ['#D85A30', '#378ADD', '#E8764A', '#5AA0E8', '#F09070'],
            burgundy:['#A42860', '#2E78C8', '#D05080', '#5AA0E8', '#E06898'],
            amber:   ['#EF9F27', '#97C459', '#F0B040', '#A8D060', '#D08A20'],
        };
        const activePalette = document.documentElement.getAttribute('data-palette') || 'azure';
        const paletteColors = PALETTE_COLORS[activePalette] || PALETTE_COLORS.azure;

        // Expose update function globally for palette switching
        window.__updateParticleColors = (paletteName) => {
            const newColors = PALETTE_COLORS[paletteName] || PALETTE_COLORS.azure;
            this.config.colors = newColors;
            // Re-color existing SVG shapes in the DOM
            const svgEl = this.svg || document.getElementById('shapes');
            if (svgEl) {
                const shapes = svgEl.querySelectorAll('[fill]');
                shapes.forEach((shape) => {
                    const randomColor = newColors[Math.floor(Math.random() * newColors.length)];
                    shape.setAttribute('fill', randomColor);
                });
            }
        };

        this.config = {
            // Particle settings
            particleCount: 150,
            colors: paletteColors,
            minSize: 5,
            maxSize: 40,
            shapeOpacity: 0.6,

            // Spawn animation
            spawnDuration: 2500, // ms

            // Brownian motion
            noiseScale: 0.001,
            noiseSpeed: 0.0003,
            moveSpeed: 80,

            // Morph settings
            morphDuration: 1500, // ms - smooth, graceful transitions

            // Container
            containerId: 'baseContainer',

            ...options
        };

        this.particles = [];
        this.noise = new SimplexNoise();
        this.isRunning = false;
        this.startTime = 0;
        this.lastTime = 0;

        this.init();
    }

    init() {
        // Wait for DOM and content to fully load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.delayedSetup());
        } else {
            this.delayedSetup();
        }
    }

    delayedSetup() {
        // Reveal content immediately - don't wait for particles
        this.revealContent();

        // Wait a bit for all content to render and get proper dimensions
        setTimeout(() => this.setup(), 500);
    }

    setup() {
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.warn('[ParticleEngine] Container not found:', this.config.containerId);
            return;
        }

        // Remove old shapes SVG if exists
        const oldSvg = document.getElementById('shapes');
        if (oldSvg) {
            oldSvg.remove();
        }

        // Calculate full page dimensions
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            container.scrollHeight
        );

        // Store document height in config for particles to use
        this.config.docHeight = docHeight;

        const svgHeight = Math.round(docHeight * 1.3);

        // Create SVG container
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('id', 'shapes');
        this.svg.setAttribute('class', 'shapes');

        // Set only the height - let CSS handle positioning
        // The .shapes class in paralax.scss handles position, z-index, etc.
        this.svg.style.height = svgHeight + 'px';

        // Create a group for particles that accepts pointer events
        this.particleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        // this.particleGroup.style.pointerEvents = 'auto'; // Removed to prevent blocking clicks
        this.svg.appendChild(this.particleGroup);

        // Insert at the beginning of container
        container.insertBefore(this.svg, container.firstChild);

        // Create particles
        this.createParticles();

        // Show SVG with fade
        setTimeout(() => {
            this.svg.classList.add('shapes--show');
        }, 100);

        // Start animation loop
        this.start();

        // Handle window resize
        window.addEventListener('resize', () => this.onResize());

        // Start automatic random morphing (subtle, non-intrusive)
        this.startAutoMorph();

        console.log('[ParticleEngine] Initialized with', this.config.particleCount, 'particles');
    }

    startAutoMorph() {
        // Randomly morph particles at intervals
        const scheduleNextMorph = () => {
            // Random delay between 0.5 - 2 seconds (very frequent)
            const delay = 500 + Math.random() * 1500;

            setTimeout(() => {
                if (!this.isRunning) return;

                // Pick 1-3 random particles to morph
                const count = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    const index = Math.floor(Math.random() * this.particles.length);
                    const particle = this.particles[index];

                    // Only morph if not already morphing and spawn is complete
                    if (!particle.isMorphing && particle.spawnProgress >= 1) {
                        particle.triggerMorph();
                    }
                }

                // Schedule next morph
                scheduleNextMorph();
            }, delay);
        };

        // Start after initial spawn animation completes
        setTimeout(() => scheduleNextMorph(), 4000);
    }

    revealContent() {
        // Show the main content after a short delay
        setTimeout(() => {
            const mobileNav = document.querySelector('#mobileNav');
            const nav = document.querySelector('#navbar');
            const front = document.querySelector('#parallaxFront');

            // Fade in elements
            const elements = [mobileNav, nav, front].filter(el => el !== null);
            elements.forEach(el => {
                if (el) {
                    el.style.transition = 'opacity 1s ease-out';
                    el.style.opacity = '1';
                }
            });
        }, 300);
    }

    createParticles() {
        for (let i = 0; i < this.config.particleCount; i++) {
            const particle = new Particle(this.config, i, this.config.particleCount);
            this.particles.push(particle);
            this.particleGroup.appendChild(particle.element);
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        const elapsed = now - this.startTime;
        const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1); // Cap delta to prevent jumps
        this.lastTime = now;

        // Update all particles
        let stillSpawning = false;

        for (const particle of this.particles) {
            // Spawn animation phase
            if (particle.spawnProgress < 1) {
                if (particle.updateSpawn(elapsed, deltaTime)) {
                    stillSpawning = true;
                }
            }

            // Brownian motion phase
            particle.updateBrownian(elapsed / 1000, this.noise, deltaTime);

            // Morph animation
            particle.updateMorph(deltaTime);

            // Render
            particle.render();
        }

        requestAnimationFrame(() => this.animate());
    }

    updateHeight() {
        const container = document.getElementById(this.config.containerId);
        if (!container || !this.svg) return;

        // Recalculate full page dimensions
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            container.scrollHeight
        );

        // Store document height in config for particles to use
        this.config.docHeight = docHeight;
        const svgHeight = Math.round(docHeight * 1.3);
        this.svg.style.height = `${svgHeight}px`;
        
        console.log('[ParticleEngine] Height updated to:', svgHeight);
    }

    onResize() {
        this.updateHeight();
    }
}

// ============================================================================
// INITIALIZE
// ============================================================================

// Auto-initialize when script loads
window.particleEngine = new ParticleEngine();
