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
            // Heart Formation Behavior
            // Lerp towards target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;

            this.x += dx * 0.03; // Smooth transition
            this.y += dy * 0.03;

            // Gentle floating/hovering when close to target (gathered)
            // Use coherent noise or smooth sine waves based on initial position
            // Reset rotation speed to be very slow
            this.rotation += 0.005;

            // Only apply hover if close enough to look "formed"
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                const time = Date.now() / 1000;
                // Unique offset for each petal based on its target position
                const offset = this.targetX * 0.01 + this.targetY * 0.01;

                // Smooth, slow hover effect (the "lo lung")
                // Now replaced with random sway (dùng đung đưa) around the target
                // We add the offset to the BASE position (lerped path), but we need to effectively 'float' around it.
                // The lerp above updates `this.x`, so adding to it cumulatively is wrong because it's a position update.
                // Instead, we should modify the position *after* the lerp logic or keep the 'base' position separate.
                // Detailed Approach:
                // `this.x` tracks the actual position.
                // `dx * 0.03` moves `this.x` towards `targetX`.
                // Once close, `this.x` ≈ `targetX`.
                // We want `this.x = targetX + noise`.
                // But `this.x` is persistent. 
                // So we can't just `+=` noise every frame or it drives away.
                // We must apply the sway as an *additional* temporary offset in DRAW or just act as a force?
                // Simpler: Once formed, `targetX` is constant. The lerp keeps puling to `targetX`.
                // If we shift `targetX` itself smoothly?
                // OR: Add the sway result to `this.x` directly but since the lerp pulls it back, it creates a spring effect!
                // Yes: `this.x += sway`. Lerp says `this.x += (target-x)*k`.
                // Equilibrium: `dx = -sway/k`. 
                // Let's just modify the `target` effectively or add to position.

                // Let's effectively add the sway to the current position but small enough that the lerp doesn't cancel it out instantly?
                // Actually, if we just want it to "sway around a spot", the simplest way is to render with an offset 
                // OR modify the `this.targetX` continuously? 

                // Let's modify the `x`/`y` directly with a time-based offset, but we must be careful not to drift.
                // Correct way: `this.x` follows `targetX`.
                // Render at `this.x + sway`. 
                // But if we want actual physics-like sway, we update `this.x`.

                // Let's try adding the sway delta to x/y.
                // sway = sin(t). d_sway = cos(t)*dt.
                // Rather than implementing derivative, let's just use the `draw()` offset method or `this.x` injection.
                // If I modify `this.x` directly:
                // `this.x = lerp(this.x, this.targetX, 0.03) + sway_delta`.

                // Let's use the DRAW method for the "vibration/sway" to ensure stability of the underlying heart shape.
                // Wait, the previous code `this.x += ...` ACTUALLY modifies the state, so it fights the lerp.
                // `this.x += Math.sin(...) * 0.05` -> This accumulates! 
                // `x` changes by sine wave value EACH FRAME? No. 
                // `x += sin(t)` means velocity is sin(t). Position is -cos(t).
                // So the previous code WAS creating movement, but maybe too linear drift or specific path.

                // Let's make it explicitly sway around the target center.
                // We will relax the lerp slightly or just apply the sway offset to `this.x` by overriding it?
                // No, better to keep `this.x` converging to `targetX` and then add a "sway offset" to the drawing.
                // BUT current `draw` uses `this.x`.

                // Revised Plan:
                // Update `this.x` via lerp to `this.targetX`.
                // Then `this.displayX = this.x + swayX`.
                // But I don't want to change `draw()`.

                // Let's just modify `this.x` such that it includes the sway.
                // `this.x = (this.x * (1-k)) + (targetX + swayX) * k`.
                // This makes it trail the swaying target. Good enough.

                // Actually the current code:
                // `this.x += dx * 0.03` acts as the lerp.
                // We can add `sway` to `targetX` effectively by adjusting the `dx` calculation or adding a force.

                // Let's add the sway to `this.x` directly but subtract the previous frame's sway? Too complex.

                // EASIEST: Just modify `this.x` with a small sinusoidal velocity.
                // `this.x += Math.cos(time * speed + offset) * amp * 0.05`.
                // (Velocity is derivative of position. If Pos = Sin, Vel = Cos).
                // 0.05 factor was from previous code.

                // Revert to:
                this.x += Math.sin(time * this.swaySpeed + this.swayOffset) * 0.1; // Velocity
                this.y += Math.cos(time * this.swaySpeed + this.swayOffset) * 0.1;

                // Note: The previous code `this.x += sin(...) * 0.05` was adding velocity.
                // If we want it to sway "around a spot", the lerp `dx * 0.03` pulls it back to center (Spring force).
                // So adding a periodic velocity creates a valid orbit/vibration around the attractor.
                // We just need to tune the Amplitude/Speed.

                // Gentle trembling/fluttering (the "rung rinh")
                // Randomized per petal
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
    }
});
