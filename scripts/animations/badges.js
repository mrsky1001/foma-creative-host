/**
 * Badges Repel Animation
 * Makes elements with class .hero__badge-wrapper move away from the mouse cursor.
 */
document.addEventListener('DOMContentLoaded', () => {
    const badges = document.querySelectorAll('.hero__badge-wrapper');

    // Only run if badges exist and device has a mouse (roughly)
    if (!badges.length || window.matchMedia('(hover: none)').matches) return;

    let mouse = { x: -1000, y: -1000 };

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Configuration
    const maxDistance = 250; // Radius of interaction
    const strength = 120;    // Maximum pixels to move away
    const ease = 0.05;       // Smoothing factor (lower = slower/smoother)

    // Initialize state
    const badgeStates = Array.from(badges).map(el => ({
        el,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
    }));

    function animate() {
        badgeStates.forEach(state => {
            const rect = state.el.getBoundingClientRect();

            // Calculate the original center of the element (subtracting current transform)
            const centerX = rect.left + rect.width / 2 - state.x;
            const centerY = rect.top + rect.height / 2 - state.y;

            const dx = centerX - mouse.x;
            const dy = centerY - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
                // Calculate repel force
                const factor = (maxDistance - distance) / maxDistance;
                // Use quadratic falloff for smoother feel
                const force = factor * factor * strength;

                const angle = Math.atan2(dy, dx);

                state.targetX = Math.cos(angle) * force;
                state.targetY = Math.sin(angle) * force;
            } else {
                state.targetX = 0;
                state.targetY = 0;
            }

            // Smoothly interpolate to target
            state.x += (state.targetX - state.x) * ease;
            state.y += (state.targetY - state.y) * ease;

            // Apply transform
            // We use translate3d for GPU acceleration
            state.el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
        });

        requestAnimationFrame(animate);
    }

    animate();
});
