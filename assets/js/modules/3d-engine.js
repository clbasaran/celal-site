/*
 * ============================================================================
 * 3D ENGINE MODULE
 * Advanced WebGL-powered 3D Effects and Particle Systems
 * ============================================================================
 * Features:
 * - WebGL Particle Systems
 * - 3D Background Meshes
 * - Interactive 3D Elements
 * - Performance-optimized Rendering
 * - Responsive 3D Effects
 * ============================================================================
 */

class Engine3D {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.particles = [];
        this.meshes = [];
        this.camera = {
            x: 0,
            y: 0,
            z: 5,
            fov: 75,
            aspect: 1,
            near: 0.1,
            far: 1000
        };
        this.mouse = { x: 0, y: 0 };
        this.time = 0;
        this.isRunning = false;
        this.frameId = null;
        
        this.init();
    }
    
    async init() {
        try {
            this.setupCanvas();
            this.setupWebGL();
            this.createShaders();
            this.createGeometry();
            this.setupEventListeners();
            this.start();
            
            console.log('🎨 3D Engine initialized successfully');
        } catch (error) {
            console.warn('3D Engine fallback to CSS animations:', error);
            this.initializeFallback();
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('heroCanvas');
        if (!this.canvas) {
            // Create canvas if not exists
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'heroCanvas';
            this.canvas.className = 'hero-canvas';
            
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.prepend(this.canvas);
            }
        }
        
        this.resizeCanvas();
    }
    
    setupWebGL() {
        const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        this.gl = gl;
        
        // Set viewport
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // Enable blending for particles
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Clear color
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }
    
    createShaders() {
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aColor;
            attribute float aSize;
            
            uniform mat4 uProjectionMatrix;
            uniform mat4 uModelViewMatrix;
            uniform float uTime;
            
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                vec3 pos = aPosition;
                
                // Add wave motion
                pos.x += sin(uTime + aPosition.y * 2.0) * 0.1;
                pos.y += cos(uTime + aPosition.x * 2.0) * 0.1;
                pos.z += sin(uTime + aPosition.x + aPosition.y) * 0.05;
                
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = aSize;
                
                vColor = aColor;
                vAlpha = 1.0 - (length(aPosition) / 10.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                float distance = length(gl_PointCoord - vec2(0.5));
                float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
                
                gl_FragColor = vec4(vColor, alpha * vAlpha * 0.8);
            }
        `;
        
        const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);
        
        // Get attribute and uniform locations
        this.locations = {
            attributes: {
                position: this.gl.getAttribLocation(this.program, 'aPosition'),
                color: this.gl.getAttribLocation(this.program, 'aColor'),
                size: this.gl.getAttribLocation(this.program, 'aSize')
            },
            uniforms: {
                projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
                time: this.gl.getUniformLocation(this.program, 'uTime')
            }
        };
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}`);
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        
        return program;
    }
    
    createGeometry() {
        this.createParticles();
        this.createBuffers();
    }
    
    createParticles() {
        const numParticles = 150;
        this.particles = [];
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                position: [
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 10
                ],
                color: this.getParticleColor(),
                size: Math.random() * 8 + 2,
                velocity: [
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.01
                ],
                life: Math.random() * 100 + 50
            });
        }
    }
    
    getParticleColor() {
        const colors = [
            [0.0, 0.48, 1.0], // Blue
            [0.35, 0.34, 0.84], // Purple
            [0.69, 0.32, 0.87], // Pink
            [0.0, 0.78, 0.35], // Green
            [1.0, 0.58, 0.0] // Orange
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createBuffers() {
        const positions = [];
        const colors = [];
        const sizes = [];
        
        this.particles.forEach(particle => {
            positions.push(...particle.position);
            colors.push(...particle.color);
            sizes.push(particle.size);
        });
        
        // Position buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        
        // Color buffer
        this.colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        
        // Size buffer
        this.sizeBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        // Mouse interaction
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        // Touch interaction
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        });
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.render();
    }
    
    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
    }
    
    render() {
        if (!this.isRunning) return;
        
        this.time += 0.016; // ~60fps
        this.updateParticles();
        this.draw();
        
        this.frameId = requestAnimationFrame(() => this.render());
    }
    
    updateParticles() {
        const mouseInfluence = 0.0005;
        
        this.particles.forEach(particle => {
            // Update position
            particle.position[0] += particle.velocity[0];
            particle.position[1] += particle.velocity[1];
            particle.position[2] += particle.velocity[2];
            
            // Mouse interaction
            const dx = this.mouse.x * 10 - particle.position[0];
            const dy = this.mouse.y * 10 - particle.position[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 3) {
                particle.velocity[0] += dx * mouseInfluence;
                particle.velocity[1] += dy * mouseInfluence;
            }
            
            // Boundary check and respawn
            if (Math.abs(particle.position[0]) > 15 || 
                Math.abs(particle.position[1]) > 15 || 
                Math.abs(particle.position[2]) > 8) {
                
                particle.position = [
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 10
                ];
                particle.velocity = [
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.01
                ];
            }
            
            // Apply damping
            particle.velocity[0] *= 0.999;
            particle.velocity[1] *= 0.999;
            particle.velocity[2] *= 0.999;
        });
        
        // Update position buffer
        const positions = [];
        this.particles.forEach(particle => {
            positions.push(...particle.position);
        });
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(positions));
    }
    
    draw() {
        const gl = this.gl;
        
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Set up matrices
        const projectionMatrix = this.createPerspectiveMatrix();
        const modelViewMatrix = this.createModelViewMatrix();
        
        // Set uniforms
        gl.uniformMatrix4fv(this.locations.uniforms.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.locations.uniforms.modelViewMatrix, false, modelViewMatrix);
        gl.uniform1f(this.locations.uniforms.time, this.time);
        
        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.attributes.position);
        gl.vertexAttribPointer(this.locations.attributes.position, 3, gl.FLOAT, false, 0, 0);
        
        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(this.locations.attributes.color);
        gl.vertexAttribPointer(this.locations.attributes.color, 3, gl.FLOAT, false, 0, 0);
        
        // Bind size buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.enableVertexAttribArray(this.locations.attributes.size);
        gl.vertexAttribPointer(this.locations.attributes.size, 1, gl.FLOAT, false, 0, 0);
        
        // Draw particles
        gl.drawArrays(gl.POINTS, 0, this.particles.length);
    }
    
    createPerspectiveMatrix() {
        const fieldOfView = this.camera.fov * Math.PI / 180;
        const aspect = this.camera.aspect;
        const zNear = this.camera.near;
        const zFar = this.camera.far;
        
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfView);
        const rangeInv = 1.0 / (zNear - zFar);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (zNear + zFar) * rangeInv, -1,
            0, 0, zNear * zFar * rangeInv * 2, 0
        ]);
    }
    
    createModelViewMatrix() {
        const matrix = new Float32Array(16);
        
        // Identity matrix
        matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
        
        // Add camera translation
        matrix[12] = -this.camera.x;
        matrix[13] = -this.camera.y;
        matrix[14] = -this.camera.z;
        
        // Add mouse rotation
        const rotX = this.mouse.y * 0.1;
        const rotY = this.mouse.x * 0.1;
        
        // Simple rotation (this could be more sophisticated)
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        
        // Apply rotations
        matrix[0] = cosY;
        matrix[2] = sinY;
        matrix[5] = cosX;
        matrix[6] = -sinX;
        matrix[8] = -sinY;
        matrix[9] = sinX;
        matrix[10] = cosX * cosY;
        
        return matrix;
    }
    
    handleResize() {
        this.resizeCanvas();
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.camera.aspect = this.canvas.width / this.canvas.height;
        }
    }
    
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.camera.aspect = this.canvas.width / this.canvas.height;
    }
    
    initializeFallback() {
        // CSS-based fallback for older browsers
        const particleSystem = document.getElementById('particleSystem');
        if (!particleSystem) return;
        
        const numParticles = 50;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'css-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: radial-gradient(circle, rgba(0,122,255,0.8) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                animation: float-css ${Math.random() * 10 + 10}s linear infinite;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 10}s;
            `;
            
            particleSystem.appendChild(particle);
        }
        
        // Add CSS animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float-css {
                0% {
                    transform: translateY(0px) translateX(0px);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
                    opacity: 0;
                }
            }
            
            .css-particle {
                filter: blur(0.5px);
            }
        `;
        
        document.head.appendChild(style);
        
        console.log('🎨 3D Engine fallback activated (CSS animations)');
    }
    
    // Public methods for external control
    addParticle(position, color, size) {
        this.particles.push({
            position: position || [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10],
            color: color || this.getParticleColor(),
            size: size || Math.random() * 8 + 2,
            velocity: [(Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.01],
            life: Math.random() * 100 + 50
        });
        
        this.createBuffers(); // Recreate buffers with new particle
    }
    
    setMousePosition(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }
    
    setCameraPosition(x, y, z) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.z = z;
    }
    
    destroy() {
        this.stop();
        
        if (this.gl) {
            // Clean up WebGL resources
            this.gl.deleteBuffer(this.positionBuffer);
            this.gl.deleteBuffer(this.colorBuffer);
            this.gl.deleteBuffer(this.sizeBuffer);
            this.gl.deleteProgram(this.program);
        }
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize and export
const engine3D = new Engine3D();

export default engine3D; 