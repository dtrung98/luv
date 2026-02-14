const canvas = document.getElementById('petalCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const bgMusic = document.getElementById('bgMusic');

let width, height;
let petals = [];
const petalImage = new Image();
petalImage.src = 'petal.png';

let isHeartFormed = false;
let isTextFormed = false; // New state for text
const TOTAL_PETALS = 1600;

// Hidden Canvas for Text Analysis
const textCanvas = document.createElement('canvas');
const textCtx = textCanvas.getContext('2d');
const continueBtn = document.getElementById('continueBtn');

// Resize canvas to full screen
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (isHeartFormed) {
        assignHeartTargets();
    }
}
window.addEventListener('resize', resize);
resize();

// Petal Class
class Petal {
    constructor() {
        // Initial falling state
        this.resetFalling();

        // Target state (for heart)
        this.targetX = 0;
        this.targetY = 0;

        // Random flutter properties
        // Random flutter properties
        this.flutterSpeed = Math.random() * 4 + 2;
        this.flutterOffset = Math.random() * Math.PI * 2;
        this.flutterAmp = Math.random() * 0.03 + 0.01;

        // Random Sway properties
        this.swaySpeed = Math.random() * 3 + 1;
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swayAmpX = Math.random() * 4 + 2; // Sway width 2-6 using absolute pixels since it's movement
        this.swayAmpY = Math.random() * 4 + 2; // Sway height 2-6
    }

    resetFalling() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.size = Math.random() * 20 + 10;
        this.speedY = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.5;
    }

    update() {
        if (!isHeartFormed) {
            // Normal Falling Behavior
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.y * 0.01);
            this.rotation += this.rotationSpeed;

            // Reset if out of view
            if (this.y > height + 50) {
                this.y = -50;
                this.x = Math.random() * width;
            }
        } else {
            // Heart OR Text Formation Behavior
            // Lerp towards target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;

            this.x += dx * 0.03; // Smooth transition
            this.y += dy * 0.03;

            // Gentle floating/hovering 
            this.rotation += 0.005;

            // Only apply hover if close enough to look "formed"
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                const time = Date.now() / 1000;
                // Unique offset for each petal based on its target position
                const offset = this.targetX * 0.01 + this.targetY * 0.01;

                // Smooth, slow hover effect (the "lo lung")
                this.x += Math.sin(time + offset) * 0.05;
                this.y += Math.cos(time * 0.7 + offset) * 0.05;

                // Gentle trembling/fluttering (the "rung rinh")
                this.rotation += Math.sin(time * this.flutterSpeed + this.flutterOffset) * this.flutterAmp;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        if (petalImage.complete) {
            ctx.drawImage(petalImage, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

// Calculate Heart Position
function assignHeartTargets() {
    const cx = width / 2;
    const cy = height / 2;

    // Heart Formula Bounds: Y approx from +13 to -17 (Total 30 units)
    // X approx from -16 to +16 (Total 32 units)

    // We want Height = 1/2 Screen Height OR Width = Screen Width - margin
    // Whichever is smaller (to fit on screen)

    const maxHeartHeight = height * 0.5;
    const maxHeartWidth = width * 0.9; // 90% of screen width

    // Scale based on height: scale * 30 = maxHeartHeight
    const scaleH = maxHeartHeight / 30;

    // Scale based on width: scale * 32 = maxHeartWidth
    const scaleW = maxHeartWidth / 32;

    // Use smaller scale to ensure it fits both dimensions
    const heartScale = Math.min(scaleH, scaleW);

    petals.forEach((petal) => {
        // Generate random point inside heart using rejection sampling or scaled polar coords
        // Actually, scaling the boundary equation by random factor `r` works well for star-shaped domains.
        // Heart is roughly star-shaped from (0, -5).

        let t = Math.random() * Math.PI * 2;
        // Distribution factor: sqrt(random) gives uniform distribution area-wise
        // We want "dense", so uniform is good. 
        // Maybe slightly biased to center for "tụm lại" feel? 
        // Let's stick to uniform (sqrt) or slightly powered (pow 0.4) to pull in?
        let r = Math.pow(Math.random(), 0.6); // Power < 1 pushes away from center (more uniform), Power > 1 clusters at center.
        // sqrt is 0.5. 
        // 1.0 is linear (clusters at center).
        // Let's use linear random for density at center (tụm lại).
        // Actually, let's use a mix.

        // Heart formula
        // x = 16 sin^3(t)
        // y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)

        // We need to invert Y because Canvas Y is down.
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        // Scale to size
        hx *= heartScale;
        hy *= heartScale;

        // Scale to fill (r)
        // Use a slight random offset to simulate volume/stacking
        petal.targetX = cx + hx * r;
        petal.targetY = cy + hy * r;

        // Vertical offset adjustment to center the heart visually
        // The heart geometrical center is slightly above 0 in the formula (due to the tail).
        // We shift it up a bit.
        petal.targetY -= height * 0.05;
    });
}

// Calculate Text Position (T♥T)
function assignTextTargets() {
    // 1. Setup off-screen canvas
    textCanvas.width = width;
    textCanvas.height = height;

    // Use a bold, serif font. Size relative to screen.
    const fontSize = Math.min(width, height) * 0.4;
    textCtx.font = `bold ${fontSize}px "Playfair Display", serif`;
    textCtx.fillStyle = 'red';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';

    // Draw T♥T centered
    textCtx.fillText('T♥T', width / 2, height / 2);

    // 2. Scan for pixels
    const imageData = textCtx.getImageData(0, 0, width, height).data;
    const pixelPoints = [];

    // Step size for sampling - lower is denser but requires more petals
    // With 1600 petals, step 4 or 5 is good for 1920x1080.
    const step = 4; // Adjust based on total petals? 

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            // Check alpha > 128 (pixel is part of text)
            if (imageData[index + 3] > 128) {
                pixelPoints.push({ x, y });
            }
        }
    }

    // 3. Shuffle points to avoid linear filling look
    for (let i = pixelPoints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pixelPoints[i], pixelPoints[j]] = [pixelPoints[j], pixelPoints[i]];
    }

    // 4. Assign to petals
    petals.forEach((petal, i) => {
        // Reset flutter for new state? 
        // Text mode might need less wild flutter to be readable.
        if (i < pixelPoints.length) {
            petal.targetX = pixelPoints[i].x;
            petal.targetY = pixelPoints[i].y;
            petal.opacity = Math.random() * 0.5 + 0.5; // Ensure visible
        } else {
            // Extra petals: float around randomly in background or hide
            petal.targetX = Math.random() * width;
            petal.targetY = Math.random() * height;
            petal.opacity = 0; // Hide unused petals 
        }
    });
}

function initPetals(count) {
    petals = [];
    for (let i = 0; i < count; i++) {
        petals.push(new Petal());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach(petal => {
        petal.update();
        petal.draw();
    });
    requestAnimationFrame(animate);
}

// Audio Handling
let isPlaying = false;

petalImage.onload = () => {
    initPetals(100); // Start with fewer petals
    animate();
};

startBtn.addEventListener('click', () => {
    if (!isPlaying) {
        if (bgMusic.src) {
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
        }

        // Bloom: Add MANY petals to form the heart
        const currentCount = petals.length;
        for (let i = 0; i < TOTAL_PETALS - currentCount; i++) {
            petals.push(new Petal());
        }

        // Change state
        isHeartFormed = true;

        // Calculate targets
        assignHeartTargets();

        // Trigger CSS Animations
        document.body.classList.add('bloomed');

        // Note: The CSS handles the fade out/in overlap logic now.
        // main-title fades out/moves up over 1.5s
        // header-title fades in after 0.5s delay over 1s.
        // Overlap happens between 0.5s and 1.5s (approx 2/3 fraction start).

        // Hide button interaction immediately to prevent double clicks
        startBtn.style.pointerEvents = 'none';

        // Hide button
        startBtn.style.opacity = '0';
        setTimeout(() => startBtn.style.display = 'none', 1000);

        // Change text
        document.querySelector('p.subtitle').innerText = "Trái tim anh thuộc về em.";

        isPlaying = true;

        // --- PHASE 2 SETUP ---
        // Show "Continue to Bloom" button after delay
        setTimeout(() => {
            continueBtn.classList.add('visible');
        }, 3000); // 3 seconds after heart starts forming
    }
});

// Calculate Note Rectangle Position
function assignNoteTargets() {
    // Determine rectangle size
    const noteWidth = Math.min(width * 0.8, 500);
    const noteHeight = noteWidth * 1.2;

    // Center it
    const startX = (width - noteWidth) / 2;
    const startY = (height - noteHeight) / 2;

    // Filter to get only currently visible petals (those used in T♥T)
    const activePetals = [];
    petals.forEach(p => {
        if (p.opacity > 0.1) { // Threshold for visibility
            activePetals.push(p);
        } else {
            // Ensure hidden ones stay hidden/away
            p.targetX = Math.random() * width;
            p.targetY = Math.random() * height;
        }
    });

    const count = activePetals.length;
    if (count === 0) return;

    // Calculate circumference for border only
    const perimeter = 2 * (noteWidth + noteHeight);

    // We want to distribute them along the perimeter.
    // If we have too many petals, we can layer them or fill inside slightly.
    // If just "border", we map 0..perimeter.

    activePetals.forEach((petal, i) => {
        // Uniform distribution along perimeter
        let pos = (i / count) * perimeter;

        let x, y;

        // Logic to map 'pos' to rectangle edge
        if (pos < noteWidth) {
            // Top edge: (startX, startY) to (startX + W, startY)
            x = startX + pos;
            y = startY;
        } else if (pos < noteWidth + noteHeight) {
            // Right edge: (startX + W, startY) to (startX + W, startY + H)
            x = startX + noteWidth;
            y = startY + (pos - noteWidth);
        } else if (pos < 2 * noteWidth + noteHeight) {
            // Bottom edge: (startX + W, startY + H) to (startX, startY + H)
            // pos goes from (W+H) to (2W+H)
            let offset = pos - (noteWidth + noteHeight);
            x = startX + noteWidth - offset;
            y = startY + noteHeight;
        } else {
            // Left edge: (startX, startY + H) to (startX, startY)
            let offset = pos - (2 * noteWidth + noteHeight);
            x = startX;
            y = startY + noteHeight - offset;
        }

        // Add some jitter for organic look (messy border)
        const jitter = (Math.random() - 0.5) * 10;

        petal.targetX = x + jitter;
        petal.targetY = y + jitter;
        // Keep visible
        petal.opacity = Math.random() * 0.3 + 0.6;
        petal.rotation = (Math.random() - 0.5) * 180;
    });
}

// Continue Button Interaction
continueBtn.addEventListener('click', () => {
    isTextFormed = true;

    // 1. Fade out button
    continueBtn.classList.add('fade-out');
    continueBtn.classList.remove('visible');

    // 2. Form Text "T♥T"
    assignTextTargets();

    // 3. Wait for reading (5 seconds)
    setTimeout(() => {
        // Transform to Note Shape
        assignNoteTargets();

        // 4. Wait for petals to settle (2 seconds)
        setTimeout(() => {
            // Show Real Note Overlay
            document.getElementById('note').classList.add('visible');

            // Show Accept Button after Note fades in (1s duration for note, wait slightly more)
            setTimeout(() => {
                document.getElementById('acceptBtn').classList.add('visible');
            }, 1000);

        }, 2000);

    }, 5000);
});

// Accept Button Interaction
document.getElementById('acceptBtn').addEventListener('click', () => {
    // 1. Hide Button (clicked)
    document.getElementById('acceptBtn').style.transform = "translateX(-50%) scale(0)";

    // 3. Show 'Approved' Stamp on Note
    setTimeout(() => {
        document.getElementById('stampMark').classList.add('visible');

        // 4. Fire Confetti!
        var duration = 3 * 1000;
        var end = Date.now() + duration;

        (function frame() {
            // launch a few confetti from the left edge
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff0000', '#ffeb3b', '#ffffff']
            });
            // and launch a few from the right edge
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff0000', '#ffeb3b', '#ffffff']
            });

            // Keep going forever
            requestAnimationFrame(frame);
        }());

        // Fire a big burst immediately too
        confetti({
            origin: { y: 0.7 },
            zIndex: 100,
            particleCount: 150,
            spread: 100
        });

    }, 300); // Slight delay for button shrink animation
});
