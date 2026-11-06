/**
 * Hero Text Gradient Animation
 * Periodically fills the hero text with a random-angle gradient.
 */

document.addEventListener('DOMContentLoaded', () => {
    const letters = document.querySelectorAll('.hero__title-letter');
    if (!letters.length) return;

    // Configuration
    const ANIMATION_DURATION = 3000; // Total time for fade-in + fade-out (ms)
    const PERIOD = 5000;             // Time between starts (ms)

    // Calculate transition time for CSS (half of total duration)
    // We want 1.5s fade in, 1.5s fade out.
    // CSS should have transition: opacity 1.5s ease-in-out
    const HALF_CYCLE = ANIMATION_DURATION / 2;

    function runAnimation() {
        // 1. Pick a random angle for this cycle
        const angle = Math.floor(Math.random() * 360);

        // 2. Apply to all letters
        letters.forEach(letter => {
            letter.style.setProperty('--grad-angle', `${angle}deg`);
            letter.classList.add('gradient-active');
        });

        // 3. Schedule the fade out (return to orig) after the fade-in completes
        setTimeout(() => {
            letters.forEach(letter => {
                letter.classList.remove('gradient-active');
            });
        }, HALF_CYCLE);
    }

    // Initial Start Delay + Periodic Loop
    // Start the first one after a short delay or immediately? User said "Period 5 sec".
    // Let's assume start loop immediately.

    // Use setInterval for the period
    setInterval(runAnimation, PERIOD);

    // Optional: Run one immediately? Maybe wait for the first period.
    // Let's wait 1s then start loop? 
    // Standard approach: SetInterval runs after 5s.
    // Let's run first one after 2s to not overwhelm page load
    setTimeout(() => {
        runAnimation();
        // The interval continues from 5s mark if we aligned it... 
        // Actually setInterval waits `period` before first run.
    }, 2000);

});
