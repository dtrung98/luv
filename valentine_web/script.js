const canvas = document.getElementById('petalCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const bgMusic = document.getElementById('bgMusic');

let width, height;
let petals = [];
const petalImage = new Image();
petalImage.src = 'petal.png';

let isHeartFormed = false;
const TOTAL_PETALS = 1600; // Increased for density

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
    }

    resetFalling() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.size = Math.random() * 20 + 10; // Varied sizes
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
            // Heart Formation Behavior
            // Lerp towards target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;

            this.x += dx * 0.03; // Smooth transition
            this.y += dy * 0.03;

            // Gentle vibration when close to target (gathered)
            // We apply a small offset based on time and position
            const time = Date.now() / 1000;
            const vibrationStrength = 0.5;

            // Only vibrate if close enough to look "formed"
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                this.x += Math.sin(time * 2 + this.x) * 0.3;
                this.y += Math.cos(time * 3 + this.y) * 0.3;
            }

            this.rotation += 0.5 * Math.sin(time); // Gentle sway rotation
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
    // We want Height = 1/2 Screen Height
    // Scale * 30 = height * 0.5
    // Scale = (height * 0.5) / 30
    const heartScale = (height * 0.5) / 30;

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

        // Hide button
        startBtn.style.opacity = '0';
        setTimeout(() => startBtn.style.display = 'none', 1000);

        // Change text
        document.querySelector('p.subtitle').innerText = "Trái tim anh thuộc về em.";

        isPlaying = true;
    }
});
