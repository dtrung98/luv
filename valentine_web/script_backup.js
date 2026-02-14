const canvas = document.getElementById('petalCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const bgMusic = document.getElementById('bgMusic');

let width, height;
let petals = [];
const petalImage = new Image();
petalImage.src = 'petal.png';

let isHeartFormed = false;
const TOTAL_PETALS = 2000; // Dense heart

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
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.size = Math.random() * 15 + 10; // Smaller petals for density
        this.speedY = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.5;

        // Target state (for heart)
        this.targetX = 0;
        this.targetY = 0;
        this.targetRotation = 0;
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
            // Heart Formation Behavior with easing
            // Move towards target
            this.x += (this.targetX - this.x) * 0.04;
            this.y += (this.targetY - this.y) * 0.04;

            // Gentle vibration when gathered
            // Use time-based sine waves for smooth, organic vibration
            const time = Date.now() * 0.002;
            const vibrationX = Math.sin(time + this.x * 0.1) * 0.5;
            const vibrationY = Math.cos(time + this.y * 0.1) * 0.5;

            // Apply vibration directly to position for rendering (not accumulating)
            // But we update x/y relative to target, so we need to be careful.
            // Let's just add vibration to the draw position or temporarily modify x/y?
            // Better: update target slightly? No, expensive.
            // Let's just add the vibration *offset* during draw, or add it here but damp it out?
            // Actually, if we just add it to x/y, the spring force will pull it back.
            // So: `this.x += vibrationX` might drift if not careful.
            // Correct approach: `force = spring + vibration`.

            this.x += vibrationX;
            this.y += vibrationY;

            // Rotate slowly
            this.rotation += 0.5;
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
// Heart formula (scale s):
// x = 16 sin^3(t) * s
// y = (13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)) * s
// Target Height = 1/2 Screen Height
// Formula Y range: approx [-17, 13] -> size ~ 30 units
function assignHeartTargets() {
    const cx = width / 2;
    const cy = height / 2;

    // Calculate scale to fit 1/2 height
    // Max Y range of unit heart is roughly 30.
    // desiredHeight = height * 0.5
    // scale * 30 = desiredHeight => scale = desiredHeight / 30
    const heartScale = (height * 0.6) / 30; // 0.6 to be safe and big

    petals.forEach((petal) => {
        // Random angle t
        const t = Math.random() * Math.PI * 2;

        // Random layout (filled heart)
        // Using sqrt(random) for uniform area distribution, 
        // OR just random() for denser center (which looks like "tụm lại")
        // Let's mix: mostly uniform but some bias to center
        let r = Math.sqrt(Math.random());

        // Improve shape: The "point" of the heart is at y ≈ -17 (in formula terms before flipping)
        // Visual center adjustment

        // Formula
        // x = 16 sin^3(t)
        // y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)

        let tx = 16 * Math.pow(Math.sin(t), 3);
        let ty = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        // Scale and Center
        petal.targetX = cx + tx * heartScale * r;
        petal.targetY = cy + ty * heartScale * r - (height * 0.05); // slight vertical adjustment
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

        // Bloom: Add MANY petals to form the dense heart
        const currentCount = petals.length;
        // Add up to TOTAL_PETALS
        for (let i = 0; i < TOTAL_PETALS - currentCount; i++) {
            petals.push(new Petal());
        }

        // Change state
        isHeartFormed = true;

        // Calculate targets for ALL petals
        assignHeartTargets();

        // Hide button
        // startBtn.style.opacity = '0'; // Handled by CSS now
        // setTimeout(() => startBtn.style.display = 'none', 1000);

        // Change text? No, user said fade out subtitle.
        // document.querySelector('p.subtitle').innerText = "Trái tim anh thuộc về em.";

        // Add class for CSS transitions
        document.body.classList.add('bloomed');

        isPlaying = true;
    }
});
