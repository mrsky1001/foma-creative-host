{
  const themes = { light: 0, dark: 1 };
  const STORAGE_KEY = "__foma-creative-studio_theme";
  const themeBtns = document.querySelectorAll(".theme-btn");

  // Detect browser's system/OS color scheme preference
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function setFillAllSVG(fill, stroke) {
    const svgs = Array.from(document.getElementsByClassName("path"));
    svgs.forEach((svg) => {
      svg.setAttribute("fill-off", fill);
      svg.setAttribute("stroke-off", stroke);
    });
  }

  themeBtns.forEach((btn) => btn.classList.add("show"));

  function setTheme(theme) {
    const lastHeroTitleEl = document.querySelector(".hero__title span:last-child");
    const themeColorMeta = document.getElementById("meta-theme-color");

    if (Number(theme) === themes.dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      lastHeroTitleEl?.classList.add("dark");

      // Update iOS Safari theme-color meta tag for status bar
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#0f0f1a");
      }

      // Update buttons active state
      document.querySelectorAll(".theme-btn--dark").forEach((btn) => btn.classList.add("active"));
      document
        .querySelectorAll(".theme-btn--light")
        .forEach((btn) => btn.classList.remove("active"));
    } else {
      document.documentElement.removeAttribute("data-theme");
      lastHeroTitleEl?.classList.remove("dark");

      // Update iOS Safari theme-color meta tag for status bar
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#ffffff");
      }

      // Update buttons active state
      document.querySelectorAll(".theme-btn--light").forEach((btn) => btn.classList.add("active"));
      document
        .querySelectorAll(".theme-btn--dark")
        .forEach((btn) => btn.classList.remove("active"));
    }
  }

  // Get the system's preferred color scheme
  function getSystemTheme() {
    return prefersDarkScheme.matches ? themes.dark : themes.light;
  }

  // Theme initialization:
  // 1. If there's a saved theme in localStorage, use it
  // 2. Otherwise, use the browser's system color scheme
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme !== null) {
    setTheme(savedTheme);
  } else {
    setTheme(getSystemTheme());
  }

  // Listen for system color scheme changes (when user changes OS settings)
  prefersDarkScheme.addEventListener("change", (e) => {
    // Apply system theme only if the user hasn't manually selected a theme
    if (localStorage.getItem(STORAGE_KEY) === null) {
      setTheme(e.matches ? themes.dark : themes.light);
    }
  });

  // Theme toggle button handlers
  document.querySelectorAll(".theme-btn--light").forEach((btn) => {
    btn.onclick = () => {
      localStorage.setItem(STORAGE_KEY, themes.light);
      setTheme(themes.light);
    };
  });

  document.querySelectorAll(".theme-btn--dark").forEach((btn) => {
    btn.onclick = () => {
      localStorage.setItem(STORAGE_KEY, themes.dark);
      setTheme(themes.dark);
    };
  });

  /* =============================================================
     PALETTE SWITCHING
     ============================================================= */
  const PALETTE_STORAGE_KEY = "__foma-creative-studio_palette";
  const VALID_PALETTES = ["azure", "default", "mono", "purple", "coral", "burgundy", "amber"];

  // Dark-mode background colors per palette (for meta-theme-color)
  const PALETTE_DARK_BG = {
    azure:   "#101010",
    default: "#0f0f1a",
    mono:    "#0f0f1a",
    purple:  "#0E0E14",
    coral:   "#12121A",
    burgundy: "#12121A",
    amber:   "#14140F",
  };

  function setPalette(name) {
    if (!VALID_PALETTES.includes(name)) name = "azure";

    if (name === "default") {
      document.documentElement.removeAttribute("data-palette");
    } else {
      document.documentElement.setAttribute("data-palette", name);
    }

    // Update active button state
    document.querySelectorAll(".palette-btn").forEach((btn) => {
      btn.classList.toggle(
        "palette-btn--active",
        btn.dataset.palette === name
      );
    });

    // Update meta-theme-color if dark mode is active
    const themeColorMeta = document.getElementById("meta-theme-color");
    if (themeColorMeta) {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        themeColorMeta.setAttribute("content", PALETTE_DARK_BG[name] || "#101010");
      }
    }

    // Update particle colors if engine is available
    if (window.__updateParticleColors) {
      window.__updateParticleColors(name);
    }
  }

  // Initialize palette from localStorage (default to azure)
  const MIGRATION_KEY = "__foma_azure_default_v1";
  try {
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.setItem(MIGRATION_KEY, "1");
      localStorage.setItem(PALETTE_STORAGE_KEY, "azure");
    }
  } catch (e) {}

  const savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY) || "azure";
  if (savedPalette && VALID_PALETTES.includes(savedPalette)) {
    setPalette(savedPalette);
  }

  // Palette dropdown toggle
  document.querySelectorAll(".palette-switcher").forEach((switcher) => {
    const trigger = switcher.querySelector(".palette-trigger");
    if (trigger) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = switcher.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
  });

  // Close dropdown on outside click
  document.addEventListener("click", () => {
    document.querySelectorAll(".palette-switcher.is-open").forEach((s) => {
      s.classList.remove("is-open");
      const t = s.querySelector(".palette-trigger");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  });

  // Palette button click handlers
  document.querySelectorAll(".palette-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const palette = btn.dataset.palette;
      localStorage.setItem(PALETTE_STORAGE_KEY, palette);
      setPalette(palette);
      // Close dropdown
      document.querySelectorAll(".palette-switcher.is-open").forEach((s) => {
        s.classList.remove("is-open");
        const t = s.querySelector(".palette-trigger");
        if (t) t.setAttribute("aria-expanded", "false");
      });
    };
  });

  /**
   * Smooth Scroll for Parallax Container & Anchor Links
   * Intercepts hash links (e.g. /#about, /ru/#about, #about) to prevent page reloads
   */
  const scrollContainer = document.getElementById("baseContainer");

  function scrollToElement(targetElement) {
    if (!targetElement) return;
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const currentScroll = scrollContainer.scrollTop;
      const relativeTop = targetRect.top - containerRect.top;
      const offset = 80;

      scrollContainer.scrollTo({
        top: currentScroll + relativeTop - offset,
        behavior: 'smooth'
      });
    } else {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const normPath = (p) => (p || '').split('#')[0].replace(/\/$/, '');

  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref) return;

    const hashIndex = rawHref.indexOf('#');
    if (hashIndex === -1) return;

    const targetId = rawHref.substring(hashIndex + 1);
    if (!targetId) return;

    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const linkPath = rawHref.substring(0, hashIndex);
    const currentPath = window.location.pathname;

    const isSamePage = !linkPath || normPath(linkPath) === normPath(currentPath);

    if (isSamePage) {
      e.preventDefault();

      if (window.__closeMobileNav) {
        window.__closeMobileNav();
      }

      scrollToElement(targetElement);
      history.pushState(null, null, `#${targetId}`);
    }
  });

  // Handle initial page load with hash (e.g. arriving from another page)
  if (window.location.hash) {
    const initialId = window.location.hash.substring(1);
    const initialEl = document.getElementById(initialId);
    if (initialEl) {
      setTimeout(() => {
        scrollToElement(initialEl);
      }, 150);
    }
  }
}
