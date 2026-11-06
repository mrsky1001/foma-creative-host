{
  /**
   * Mobile Navigation Controller
   * Handles toggle state, overlay clicks, link navigation, and accessibility
   */
  const mobileNav = document.getElementById("mobileNav");
  const hamburgerBtn = document.getElementById("barsBtn");
  const overlay = document.getElementById("navOverlay");
  const menuPanel = document.getElementById("navSideBlock");
  const html = document.documentElement;

  const openClass = "mobile-nav--open";
  const bodyLockClass = "wrapper--shadow";

  // Track menu state
  let isOpen = false;

  /**
   * Toggle menu open/closed state
   */
  function toggleMenu() {
    isOpen = !isOpen;

    if (isOpen) {
      mobileNav.classList.add(openClass);
      html.classList.add(bodyLockClass);
      hamburgerBtn.setAttribute("aria-expanded", "true");

      // Focus trap - focus first menu item
      setTimeout(() => {
        const firstLink = menuPanel.querySelector("a, button");
        if (firstLink) firstLink.focus();
      }, 300);
    } else {
      mobileNav.classList.remove(openClass);
      html.classList.remove(bodyLockClass);
      hamburgerBtn.setAttribute("aria-expanded", "false");
      hamburgerBtn.focus();
    }
  }

  /**
   * Close menu
   */
  function closeMenu() {
    if (isOpen) {
      isOpen = false;
      mobileNav.classList.remove(openClass);
      html.classList.remove(bodyLockClass);
      hamburgerBtn.setAttribute("aria-expanded", "false");
    }
  }

  window.__closeMobileNav = closeMenu;

  // Hamburger button click
  hamburgerBtn.addEventListener("click", toggleMenu);

  // Overlay click closes menu
  overlay.addEventListener("click", closeMenu);

  // Close menu when clicking on a menu link
  const menuLinks = menuPanel.querySelectorAll(".mobile-nav__link");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      // Small delay to allow navigation animation
      setTimeout(closeMenu, 150);
    });
  });

  // Social links in menu
  const socialLinks = menuPanel.querySelectorAll(".mobile-nav__social-btn");
  socialLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      // Don't close menu for external links (they open in new tab)
      if (!link.getAttribute("target")) {
        setTimeout(closeMenu, 150);
      }
    });
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeMenu();
    }
  });

  // Handle window resize - close menu if switching to desktop view
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 1250 && isOpen) {
        closeMenu();
      }
    }, 100);
  });

  // Prevent scroll on menu when at bounds (iOS fix)
  menuPanel.addEventListener("touchmove", (e) => {
    const { scrollTop, scrollHeight, clientHeight } = menuPanel;

    if (scrollTop === 0 && e.touches[0].clientY > 0) {
      // At top, trying to scroll up
      if (e.cancelable) e.preventDefault();
    } else if (scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY < 0) {
      // At bottom, trying to scroll down
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });
}