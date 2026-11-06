/**
 * Portfolio Page — Vanilla JS Module
 *
 * Handles:
 * 1. Category tab filtering
 * 2. Lightbox gallery (Nastya/gallery type)
 * 3. Video hover/IntersectionObserver (Nikita/video type)
 *
 * Initializes on DOMContentLoaded.
 */

(function () {
  "use strict";

  /* ================================================================
     UTILS
     ================================================================ */

  /** @param {string} selector @param {Element} [ctx] */
  function $(selector, ctx) {
    return (ctx || document).querySelector(selector);
  }

  /** @param {string} selector @param {Element} [ctx] */
  function $$(selector, ctx) {
    return Array.from((ctx || document).querySelectorAll(selector));
  }

  /* ================================================================
     1. TABS / CATEGORY FILTER
     ================================================================ */

  function initTabs() {
    var portfolio = $("#portfolio");
    if (!portfolio) return;

    var categoryTabs = $$(".portfolio__nav-list .portfolio__nav-item");
    var topFilterChips = $$("#portfolioTopFilters .portfolio__filter-chip");
    var groupBtns = $$("#portfolioGroupSwitcher .portfolio__group-btn");
    var cards = $$(".portfolio__card");
    var grid = $("#portfolioGrid");
    var contacts = $("#portfolioContacts");

    var currentFilter = "all";

    function filterProjects(filterVal) {
      currentFilter = filterVal || "all";

      // Show/hide contacts
      if (contacts) {
        if (currentFilter === "contacts") {
          contacts.classList.add("is-visible");
          if (grid) grid.style.display = "none";
          return;
        } else {
          contacts.classList.remove("is-visible");
          if (grid) grid.style.display = "";
        }
      }

      var visibleCount = 0;
      cards.forEach(function (card) {
        var cardCat = card.getAttribute("data-category");
        var cardSubcat = card.getAttribute("data-subcategory");
        var shouldShow = false;

        if (currentFilter === "all") {
          shouldShow = true;
        } else if (currentFilter.indexOf("sub:") === 0) {
          var targetSub = currentFilter.substring(4);
          shouldShow = cardSubcat && cardSubcat.includes(targetSub);
        } else if (currentFilter.indexOf("client:") === 0) {
          var targetClient = currentFilter.substring(7);
          var cardClient = card.getAttribute("data-client");
          shouldShow = cardClient === targetClient;
        } else {
          shouldShow = cardCat === currentFilter;
        }

        if (shouldShow) {
          card.setAttribute("data-hidden", "false");
          card.classList.remove("portfolio__card--hiding");
          card.classList.add("portfolio__card--showing");
          card.style.display = "";
          visibleCount++;
        } else {
          card.classList.add("portfolio__card--hiding");
          card.classList.remove("portfolio__card--showing");
          card.setAttribute("data-hidden", "true");
          card.style.display = "none";
        }
      });

      // Show/hide category groups
      var categoryGroups = $$(".portfolio__category-group");
      categoryGroups.forEach(function (group) {
        var visibleCardsInGroup = $$('.portfolio__card[data-hidden="false"]', group);
        if (visibleCardsInGroup.length > 0) {
          group.style.display = "";
        } else {
          group.style.display = "none";
        }
      });

      var emptyState = $("#portfolioEmptyState");
      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? "flex" : "none";
      }
    }

    // Sidebar category tabs
    categoryTabs.forEach(function (item) {
      item.addEventListener("click", function () {
        var detailContainer = $("#portfolioDetail");
        var grid = $("#portfolioGrid");
        if (detailContainer && detailContainer.style.display === "block" && grid) {
          var bgVideo = $("#detailBgVideo");
          if (bgVideo) bgVideo.pause();
          detailContainer.classList.remove("is-visible");
          detailContainer.style.display = "none";
          grid.style.display = "";
          grid.style.opacity = "1";
          var footer = $("#portfolioFooter");
          if (footer) footer.style.display = "";
        }

        categoryTabs.forEach(function (n) {
          n.classList.remove("portfolio__nav-item--active");
          n.setAttribute("aria-selected", "false");
        });
        item.classList.add("portfolio__nav-item--active");
        item.setAttribute("aria-selected", "true");

        var cat = item.getAttribute("data-category") || "all";

        topFilterChips.forEach(function (chip) {
          if (chip.getAttribute("data-filter") === cat) {
            chip.classList.add("portfolio__filter-chip--active");
          } else {
            chip.classList.remove("portfolio__filter-chip--active");
          }
        });

        filterProjects(cat);
      });
    });

    // Top Filter Chips
    topFilterChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var detailContainer = $("#portfolioDetail");
        var grid = $("#portfolioGrid");
        if (detailContainer && detailContainer.style.display === "block" && grid) {
          var bgVideo = $("#detailBgVideo");
          if (bgVideo) bgVideo.pause();
          detailContainer.classList.remove("is-visible");
          detailContainer.style.display = "none";
          grid.style.display = "";
          grid.style.opacity = "1";
          var footer = $("#portfolioFooter");
          if (footer) footer.style.display = "";
        }

        topFilterChips.forEach(function (c) {
          c.classList.remove("portfolio__filter-chip--active");
          c.setAttribute("aria-selected", "false");
        });
        chip.classList.add("portfolio__filter-chip--active");
        chip.setAttribute("aria-selected", "true");

        var filterVal = chip.getAttribute("data-filter") || "all";

        categoryTabs.forEach(function (n) {
          if (n.getAttribute("data-category") === filterVal) {
            n.classList.add("portfolio__nav-item--active");
          } else {
            n.classList.remove("portfolio__nav-item--active");
          }
        });

        filterProjects(filterVal);
      });
    });

    // Grouping Switcher
    groupBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        groupBtns.forEach(function (b) {
          b.classList.remove("portfolio__group-btn--active");
        });
        btn.classList.add("portfolio__group-btn--active");

        var mode = btn.getAttribute("data-group-by") || "category";
        if (portfolio) {
          portfolio.setAttribute("data-group-mode", mode);
        }
      });
    });
  }

  /* ================================================================
     2. LIGHTBOX (Gallery type only)
     ================================================================ */

  function initLightbox() {
    var portfolio = $("#portfolio");
    if (!portfolio) return;

    var lightbox = $("#portfolioLightbox");
    if (!lightbox) return;

    var lightboxImg = $("#lightboxImg");
    var lightboxCounter = $("#lightboxCounter");
    var closeBtn = $("#lightboxClose");
    var prevBtn = $("#lightboxPrev");
    var nextBtn = $("#lightboxNext");
    var content = $("#lightboxContent");

    var currentImages = [];
    var currentIndex = 0;
    var touchStartX = 0;
    var touchEndX = 0;

    function openLightbox(images, startIndex) {
      currentImages = images;
      currentIndex = startIndex || 0;
      showImage();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    window.openLightbox = openLightbox;

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      currentImages = [];
    }

    function showImage() {
      if (!lightboxImg || !currentImages.length) return;

      // Fade transition
      lightboxImg.style.opacity = "0";
      lightboxImg.style.transform = "scale(0.95)";

      setTimeout(function () {
        lightboxImg.src = currentImages[currentIndex];
        lightboxImg.alt = "Image " + (currentIndex + 1);

        // Wait for load
        lightboxImg.onload = function () {
          lightboxImg.style.opacity = "1";
          lightboxImg.style.transform = "scale(1)";
        };

        if (lightboxCounter) {
          lightboxCounter.textContent =
            currentIndex + 1 + " / " + currentImages.length;
        }
      }, 150);
    }

    function nextImage() {
      if (currentImages.length <= 1) return;
      currentIndex = (currentIndex + 1) % currentImages.length;
      showImage();
    }

    // Prev
    function prevImage() {
      if (currentImages.length <= 1) return;
      currentIndex =
        (currentIndex - 1 + currentImages.length) % currentImages.length;
      showImage();
    }

    // Close
    if (closeBtn) {
      closeBtn.addEventListener("click", closeLightbox);
    }

    // Click on backdrop to close
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target === content) {
        closeLightbox();
      }
    });

    // Navigation
    if (prevBtn) prevBtn.addEventListener("click", prevImage);
    if (nextBtn) nextBtn.addEventListener("click", nextImage);

    // Keyboard
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;

      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
    });

    // Touch swipe
    if (content) {
      content.addEventListener(
        "touchstart",
        function (e) {
          touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true }
      );

      content.addEventListener(
        "touchend",
        function (e) {
          touchEndX = e.changedTouches[0].screenX;
          var diff = touchStartX - touchEndX;

          if (Math.abs(diff) > 50) {
            if (diff > 0) nextImage();
            else prevImage();
          }
        },
        { passive: true }
      );
    }
  }

  /* ================================================================
     3. VIDEO CONTROLLER (Video type only)
     ================================================================ */

  function initVideoController() {
    var portfolio = $("#portfolio");
    if (!portfolio || portfolio.getAttribute("data-type") !== "video") return;

    var cards = $$(".portfolio__card");
    var videos = [];

    cards.forEach(function (card) {
      var video = $(".portfolio__card-video", card);
      if (video) {
        videos.push({ card: card, video: video });
      }
    });

    if (!videos.length) return;

    var isDesktop = window.matchMedia("(min-width: 1125px)");
    var observer = null;

    /* --- Desktop: Hover play --- */
    function setupDesktopHover() {
      videos.forEach(function (item) {
        item.card.addEventListener("mouseenter", handleMouseEnter);
        item.card.addEventListener("mouseleave", handleMouseLeave);
      });
    }

    function teardownDesktopHover() {
      videos.forEach(function (item) {
        item.card.removeEventListener("mouseenter", handleMouseEnter);
        item.card.removeEventListener("mouseleave", handleMouseLeave);
        item.video.pause();
        item.video.classList.remove("is-playing");
      });
    }

    function handleMouseEnter(e) {
      var video = $(".portfolio__card-video", e.currentTarget);
      if (video) {
        video.play().catch(function () {});
        // On desktop, opacity is handled via CSS :hover
      }
    }

    function handleMouseLeave(e) {
      var video = $(".portfolio__card-video", e.currentTarget);
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }

    /* --- Mobile: IntersectionObserver auto-play --- */
    function setupMobileObserver() {
      if (observer) observer.disconnect();

      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var video = $(".portfolio__card-video", entry.target);
            if (!video) return;

            if (entry.isIntersecting) {
              video.play().catch(function () {});
              video.classList.add("is-playing");
            } else {
              video.pause();
              video.classList.remove("is-playing");
            }
          });
        },
        {
          threshold: 0.6,
        }
      );

      videos.forEach(function (item) {
        observer.observe(item.card);
      });
    }

    function teardownMobileObserver() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      videos.forEach(function (item) {
        item.video.pause();
        item.video.classList.remove("is-playing");
      });
    }

    /* --- Mode switching --- */
    function applyMode() {
      if (isDesktop.matches) {
        teardownMobileObserver();
        setupDesktopHover();
      } else {
        teardownDesktopHover();
        setupMobileObserver();
      }
    }

    // Listen for viewport changes
    if (isDesktop.addEventListener) {
      isDesktop.addEventListener("change", applyMode);
    } else if (isDesktop.addListener) {
      // Safari < 14 fallback
      isDesktop.addListener(applyMode);
    }

    applyMode();
  }

  /* ================================================================
     4. PROJECT DETAIL CONTROLLER & FLYING TRANSITION
     ================================================================ */

  function initProjectDetails() {
    var portfolio = $("#portfolio");
    if (!portfolio) return;

    var projectsData = [];
    try {
      projectsData = JSON.parse(portfolio.getAttribute("data-projects") || "[]");
    } catch (e) {
      console.error("Failed to parse projects data", e);
      return;
    }

    var i18n = {};
    try {
      i18n = JSON.parse(portfolio.getAttribute("data-i18n") || "{}");
    } catch (e) {}

    var grid = $("#portfolioGrid");
    var detailContainer = $("#portfolioDetail");
    var backBtn = $("#detailBackBtn");
    var contacts = $("#portfolioContacts");

    if (!detailContainer || !grid) return;

    // Wire up detail meta links (Category & Subcategory) as filter shortcuts
    var detailCatLink = $("#detailCategory");
    var detailSubLink = $("#detailSubcategory");

    if (detailCatLink) {
      detailCatLink.addEventListener("click", function () {
        var catKey = detailCatLink.getAttribute("data-cat-key") || "all";
        if (detailContainer && grid) {
          var bgVideo = $("#detailBgVideo");
          if (bgVideo) bgVideo.pause();
          detailContainer.classList.remove("is-visible");
          detailContainer.style.display = "none";
          grid.style.display = "";
          grid.style.opacity = "1";
          var footer = $("#portfolioFooter");
          if (footer) footer.style.display = "";
        }
        var topChip = $$("#portfolioTopFilters .portfolio__filter-chip").find(function (c) {
          return c.getAttribute("data-filter") === catKey;
        });
        if (topChip) {
          topChip.click();
        } else {
          var sideTab = $$(".portfolio__nav-list .portfolio__nav-item").find(function (n) {
            return n.getAttribute("data-category") === catKey;
          });
          if (sideTab) sideTab.click();
        }
      });
    }

    if (detailSubLink) {
      detailSubLink.addEventListener("click", function () {
        var rawSub = detailSubLink.getAttribute("data-sub-text");
        if (!rawSub) return;
        var cleanSub = rawSub.replace(/^[•\s]+/, "").trim();
        var filterVal = "sub:" + cleanSub;

        if (detailContainer && grid) {
          var bgVideo = $("#detailBgVideo");
          if (bgVideo) bgVideo.pause();
          detailContainer.classList.remove("is-visible");
          detailContainer.style.display = "none";
          grid.style.display = "";
          grid.style.opacity = "1";
          var footer = $("#portfolioFooter");
          if (footer) footer.style.display = "";
        }

        var topChip = $$("#portfolioTopFilters .portfolio__filter-chip").find(function (c) {
          return c.getAttribute("data-filter") === filterVal;
        });
        if (topChip) {
          topChip.click();
        }
      });
    }

    var isDesktop = window.matchMedia("(min-width: 1125px)");

    function updateLanguageLinks(projectId) {
      $$(".language-switcher__link").forEach(function (link) {
        try {
          var url = new URL(link.href, window.location.origin);
          if (projectId) {
            url.searchParams.set("project", projectId);
          } else {
            url.searchParams.delete("project");
          }
          link.href = url.pathname + url.search + url.hash;
        } catch (e) {}
      });
    }

    function openProject(projectId, cardEl, skipHistory) {
      var project = projectsData.find(function (p) { return p.id === projectId; });
      if (!project) return;

      if (!skipHistory) {
        try {
          var url = new URL(window.location.href);
          url.searchParams.set("project", projectId);
          history.pushState({ projectId: projectId }, "", url.toString());
        } catch (e) {}
      }
      updateLanguageLinks(projectId);

      var currentLocale = document.documentElement.lang || "ru";

      // If cardEl not specified or missing media (e.g. direct load from URL), do direct open without animation
      if (!cardEl || !$(".portfolio__card-media", cardEl)) {
        $("#detailTitle").textContent = project.title;

        var descText = (project.description || "").replace(/\n/g, "<br>");
        if (project.author) {
          var authorStr = String(project.author).trim();
          var isMultiple = authorStr.includes(",") || authorStr.includes(" и ") || authorStr.includes(" & ");
          var prefix = isMultiple
            ? (i18n.authors || "Авторы") + ": "
            : (i18n.author || "Автор") + ": ";

          var authorHtml = authorStr;
          if (authorStr.includes("Никита") || authorStr.includes("Nikita")) {
            authorHtml = '<a href="/' + currentLocale + '/portfolio/nikita" class="portfolio__detail-author-link">' + authorStr + '</a>';
          } else if (authorStr.includes("Анастасия") || authorStr.includes("Anastasia") || authorStr.includes("Настя")) {
            authorHtml = '<a href="/' + currentLocale + '/portfolio/nastya" class="portfolio__detail-author-link">' + authorStr + '</a>';
          }
          descText += '<br><br><span class="portfolio__detail-author-line">' + prefix + authorHtml + '</span>';
        }
        $("#detailDesc").innerHTML = descText;

        var proofContainer = $("#detailProofContainer");
        if (proofContainer) {
          proofContainer.innerHTML = "";
          if (project.proofLinks && project.proofLinks.length) {
            var linksPrefix = (i18n.proofLinkPrefix || "Ссылка на публикацию у заказчика") + ": ";
            var linksHtml = '<div class="portfolio__detail-proof-block"><span class="portfolio__detail-proof-label">' + linksPrefix + '</span><div class="portfolio__detail-proof-list">';
            project.proofLinks.forEach(function (link) {
              linksHtml += '<a href="' + link.url + '" target="_blank" rel="noopener noreferrer" class="portfolio__detail-proof-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> <span>' + link.label + '</span></a>';
            });
            linksHtml += '</div></div>';
            proofContainer.innerHTML = linksHtml;
          }
        }

        $("#detailYear").textContent = project.year || "";

        var categoryLabel = project.category;
        var activeNavItem = $$(".portfolio__nav-item").find(function (item) {
          return item.getAttribute("data-category") === project.category;
        });
        if (activeNavItem) {
          categoryLabel = activeNavItem.textContent.trim();
        }
        var detailCatElem = $("#detailCategory");
        if (detailCatElem) {
          detailCatElem.textContent = categoryLabel;
          detailCatElem.setAttribute("data-cat-key", project.category);
        }

        var subcatElem = $("#detailSubcategory");
        if (subcatElem) {
          if (project.subcategory) {
            subcatElem.textContent = "• " + project.subcategory;
            subcatElem.setAttribute("data-sub-text", String(project.subcategory));
            subcatElem.style.display = "inline";
          } else {
            subcatElem.textContent = "";
            subcatElem.removeAttribute("data-sub-text");
            subcatElem.style.display = "none";
          }
        }

        var bgImg = $("#detailBgImg");
        var bgVideo = $("#detailBgVideo");
        if (project.video) {
          bgVideo.src = project.video;
          bgVideo.style.display = "block";
          bgImg.style.display = "none";
          bgVideo.play().catch(function () {});
        } else {
          bgImg.src = project.thumbnail;
          bgImg.style.display = "block";
          bgVideo.style.display = "none";
        }

        var gallery = $("#detailGallery");
        gallery.innerHTML = "";
        if (project.images && project.images.length) {
          project.images.forEach(function (imgSrc, idx) {
            var img = document.createElement("img");
            img.src = imgSrc;
            img.alt = project.title + " gallery " + idx;
            img.addEventListener("click", function () {
              if (window.openLightbox) window.openLightbox(project.images, idx);
            });
            gallery.appendChild(img);
          });
        }

        grid.style.display = "none";
        grid.style.opacity = "0";
        if (contacts) contacts.classList.remove("is-visible");
        detailContainer.style.display = "block";
        detailContainer.classList.add("is-visible");
        var footer = $("#portfolioFooter");
        if (footer) footer.style.display = "none";
        window.scrollTo(0, 0);
        return;
      }

      var cardMedia = $(".portfolio__card-media", cardEl);
      var cardImg = $(".portfolio__card-img", cardEl);
      var cardVideo = $(".portfolio__card-video", cardEl);

      var startRect = cardMedia.getBoundingClientRect();

      // --- Phase 1: Create floating element INVISIBLE ---
      var floating = document.createElement("div");
      floating.style.cssText = [
        "position:fixed",
        "z-index:9999",
        "pointer-events:none",
        "overflow:hidden",
        "visibility:hidden",        // Hidden until layout is committed
        "opacity:1",
        "transition:none",
        "top:" + startRect.top + "px",
        "left:" + startRect.left + "px",
        "width:" + startRect.width + "px",
        "height:" + startRect.height + "px",
        "border-radius:12px"
      ].join(";");

      var clone;
      if (cardVideo && getComputedStyle(cardVideo).opacity === "1") {
        clone = document.createElement("video");
        clone.src = cardVideo.src;
        clone.style.cssText = "display:block;width:100%;height:100%;object-fit:cover;margin:0;padding:0;border:none;transform:none;transition:none;opacity:1;";
        clone.muted = true;
        clone.playsinline = true;
        clone.autoplay = true;
        clone.loop = true;
        clone.play().catch(function () {});
      } else {
        clone = document.createElement("img");
        clone.src = cardImg.src;
        clone.style.cssText = "display:block;width:100%;height:100%;object-fit:cover;margin:0;padding:0;border:none;transform:none;transition:none;";
      }
      floating.appendChild(clone);
      document.body.appendChild(floating);

      // --- Phase 2: Wait for browser to commit layout, then reveal + animate ---
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          floating.style.visibility = "visible";
          floating.offsetHeight;
          floating.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";

          if (isDesktop.matches) {
            var headerH = 60;
            var computedHeader = getComputedStyle(document.documentElement).getPropertyValue('--pf-header-h');
            if (computedHeader) {
              headerH = parseInt(computedHeader) || 60;
            }
            floating.style.top = headerH + "px";
            floating.style.left = (window.innerWidth * 0.45) + "px";
            floating.style.width = (window.innerWidth * 0.65) + "px";
            floating.style.height = (window.innerHeight - headerH) + "px";
          } else {
            var targetMedia = $("#detailMedia");
            var targetRect = targetMedia.getBoundingClientRect();
            floating.style.top = targetRect.top + "px";
            floating.style.left = targetRect.left + "px";
            floating.style.width = targetRect.width + "px";
            floating.style.height = targetRect.height + "px";
          }
          floating.style.borderRadius = "0px";
          floating.style.opacity = "0";
        });
      });

      // Populate detail elements
      $("#detailTitle").textContent = project.title;

      var descText = (project.description || "").replace(/\n/g, "<br>");
      if (project.author) {
        var authorStr = String(project.author).trim();
        var isMultiple = authorStr.includes(",") || authorStr.includes(" и ") || authorStr.includes(" & ");
        var prefix = isMultiple 
          ? (i18n.authors || "Авторы") + ": "
          : (i18n.author || "Автор") + ": ";

        var authorHtml = authorStr;
        if (authorStr.includes("Никита") || authorStr.includes("Nikita")) {
          var nikitaUrl = "/" + currentLocale + "/portfolio/nikita";
          authorHtml = '<a href="' + nikitaUrl + '" class="portfolio__detail-author-link">' + authorStr + '</a>';
        } else if (authorStr.includes("Анастасия") || authorStr.includes("Anastasia") || authorStr.includes("Настя")) {
          var nastyaUrl = "/" + currentLocale + "/portfolio/nastya";
          authorHtml = '<a href="' + nastyaUrl + '" class="portfolio__detail-author-link">' + authorStr + '</a>';
        }

        descText += '<br><br><span class="portfolio__detail-author-line">' + prefix + authorHtml + '</span>';
      }

      $("#detailDesc").innerHTML = descText;

      // Proof / publication links below gallery
      var proofContainer = $("#detailProofContainer");
      if (proofContainer) {
        proofContainer.innerHTML = "";
        var proofLinksAttr = cardEl.getAttribute("data-proof-links");
        if (proofLinksAttr) {
          try {
            var proofLinks = JSON.parse(proofLinksAttr);
            if (proofLinks && proofLinks.length) {
              var linksPrefix = (i18n.proofLinkPrefix || "Ссылка на публикацию у заказчика") + ": ";
              var linksHtml = '<div class="portfolio__detail-proof-block"><span class="portfolio__detail-proof-label">' + linksPrefix + '</span><div class="portfolio__detail-proof-list">';

              proofLinks.forEach(function (link) {
                linksHtml += '<a href="' + link.url + '" target="_blank" rel="noopener noreferrer" class="portfolio__detail-proof-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> <span>' + link.label + '</span></a>';
              });

              linksHtml += '</div></div>';
              proofContainer.innerHTML = linksHtml;
            }
          } catch (e) {}
        }
      }
      $("#detailYear").textContent = project.year || "";

      // Category label
      var categoryLabel = project.category;
      var activeNavItem = $$(".portfolio__nav-item").find(function (item) {
        return item.getAttribute("data-category") === project.category;
      });
      if (activeNavItem) {
        categoryLabel = activeNavItem.textContent.trim();
      }
      var detailCatElem2 = $("#detailCategory");
      if (detailCatElem2) {
        detailCatElem2.textContent = categoryLabel;
        detailCatElem2.setAttribute("data-cat-key", project.category);
      }

      var subcatElem2 = $("#detailSubcategory");
      if (subcatElem2) {
        if (project.subcategory) {
          subcatElem2.textContent = "• " + project.subcategory;
          subcatElem2.setAttribute("data-sub-text", String(project.subcategory));
          subcatElem2.style.display = "inline";
        } else {
          subcatElem2.textContent = "";
          subcatElem2.removeAttribute("data-sub-text");
          subcatElem2.style.display = "none";
        }
      }

      var bgImg = $("#detailBgImg");
      var bgVideo = $("#detailBgVideo");
      if (project.video) {
        bgVideo.src = project.video;
        bgVideo.style.display = "block";
        bgImg.style.display = "none";
        bgVideo.play().catch(function () {});
      } else {
        bgImg.src = project.thumbnail;
        bgImg.style.display = "block";
        bgVideo.style.display = "none";
      }

      // Populate Gallery
      var gallery = $("#detailGallery");
      gallery.innerHTML = "";

      // Render Videos list if present
      var videoList = project.videos || (project.video ? [project.video] : []);
      if (videoList && videoList.length) {
        videoList.forEach(function (vSrc, idx) {
          var vWrap = document.createElement("div");
          vWrap.className = "portfolio__detail-gallery-video-item";
          vWrap.innerHTML = '<video src="' + vSrc + '" controls playsinline preload="metadata"></video>';
          gallery.appendChild(vWrap);
        });
      }

      // Render Images list if present
      if (project.images && project.images.length) {
        project.images.forEach(function (imgSrc, idx) {
          var img = document.createElement("img");
          img.src = imgSrc;
          img.alt = project.title + " gallery " + idx;
          img.addEventListener("click", function () {
            if (window.openLightbox) {
              window.openLightbox(project.images, idx);
            }
          });
          gallery.appendChild(img);
        });
      }

      // Transition visibility
      grid.style.opacity = "0";
      if (contacts) contacts.classList.remove("is-visible");

      setTimeout(function () {
        grid.style.display = "none";
        detailContainer.style.display = "block";
        var footer = $("#portfolioFooter");
        if (footer) footer.style.display = "none";
        
        window.scrollTo(0, 0);

        setTimeout(function () {
          detailContainer.classList.add("is-visible");
        }, 50);

        setTimeout(function () {
          if (floating.parentNode) {
            floating.parentNode.removeChild(floating);
          }
        }, 750);
      }, 400);
    }

    function closeProject(skipHistory) {
      if (!skipHistory) {
        try {
          var url = new URL(window.location.href);
          url.searchParams.delete("project");
          history.pushState(null, "", url.toString());
        } catch (e) {}
      }
      updateLanguageLinks(null);

      detailContainer.classList.remove("is-visible");
      setTimeout(function () {
        detailContainer.style.display = "none";
        grid.style.display = "";
        var footer = $("#portfolioFooter");
        if (footer) footer.style.display = "";
        
        var bgVideo = $("#detailBgVideo");
        if (bgVideo) bgVideo.pause();

        setTimeout(function () {
          grid.style.opacity = "1";
          
          var categoryItem = $(".portfolio__nav-item--active");
          if (categoryItem) {
            var category = categoryItem.getAttribute("data-category");
            if (contacts && category === "contacts") {
              contacts.classList.add("is-visible");
              grid.style.display = "none";
            }
          }
        }, 50);
      }, 300);
    }

    $$(".portfolio__card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var projectId = card.getAttribute("data-id");
        openProject(projectId, card);
      });
    });

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        closeProject();
      });
    }

    // Auto-open project if URL has ?project=...
    var initialProjectId = new URLSearchParams(window.location.search).get("project");
    if (initialProjectId) {
      openProject(initialProjectId, null, true);
    }

    // Support browser Back/Forward navigation
    window.addEventListener("popstate", function () {
      var activeProjectId = new URLSearchParams(window.location.search).get("project");
      if (activeProjectId) {
        openProject(activeProjectId, null, true);
      } else {
        if (detailContainer.style.display === "block") {
          closeProject(true);
        }
      }
    });
  }

  /* ================================================================
     5. MOBILE DRAWER CONTROLLER
     ================================================================ */

  function initMobileDrawer() {
    var burgerBtn = $("#portfolioBurgerBtn");
    var nav = $("#portfolioNav");
    var overlay = $("#portfolioDrawerOverlay");
    if (!burgerBtn || !nav || !overlay) return;

    function openDrawer() {
      burgerBtn.classList.add("portfolio__hamburger--open");
      burgerBtn.setAttribute("aria-expanded", "true");
      nav.classList.add("portfolio__nav--open");
      overlay.classList.add("is-visible");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      burgerBtn.classList.remove("portfolio__hamburger--open");
      burgerBtn.setAttribute("aria-expanded", "false");
      nav.classList.remove("portfolio__nav--open");
      overlay.classList.remove("is-visible");
      document.body.style.overflow = "";
    }

    burgerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = nav.classList.contains("portfolio__nav--open");
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    overlay.addEventListener("click", closeDrawer);

    // Close drawer when clicking nav items on mobile
    var navItems = $$(".portfolio__nav-item");
    navItems.forEach(function (item) {
      item.addEventListener("click", function () {
        if (window.innerWidth < 1125) {
          closeDrawer();
        }
      });
    });
  }

  /* ================================================================
     7. CARD COLOR MODE SWITCHER (B&W vs Full Color)
     ================================================================ */

  function initCardMode() {
    var portfolio = $("#portfolio");
    if (!portfolio) return;

    var STORAGE_KEY = "__portfolio_card_mode";
    var savedMode = localStorage.getItem(STORAGE_KEY) || "color";

    function setMode(mode) {
      portfolio.setAttribute("data-card-mode", mode);
      $$(".portfolio__card-mode-btn").forEach(function (btn) {
        btn.classList.toggle(
          "portfolio__card-mode-btn--active",
          btn.getAttribute("data-mode") === mode
        );
      });
    }

    setMode(savedMode);

    $$(".portfolio__card-mode-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        localStorage.setItem(STORAGE_KEY, mode);
        setMode(mode);
      });
    });
  }

  /* ================================================================
     8. DESKTOP SIDEBAR TOGGLE (Collapsed ↔ Expanded)
     ================================================================ */

  function initSidebarToggle() {
    var toggleBtn = $("#portfolioSidebarToggle");
    var nav = $("#portfolioNav");
    var portfolio = $("#portfolio");
    if (!toggleBtn || !nav || !portfolio) return;

    var STORAGE_KEY = "__portfolio_sidebar_collapsed";
    var isDesktop = window.matchMedia("(min-width: 1125px)");

    function applyState(collapsed) {
      if (collapsed) {
        nav.classList.add("portfolio__nav--collapsed");
        portfolio.style.setProperty("--pf-sidebar-w", "56px");
        toggleBtn.setAttribute("aria-expanded", "false");
      } else {
        nav.classList.remove("portfolio__nav--collapsed");
        portfolio.style.removeProperty("--pf-sidebar-w");
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    }

    // Restore saved state (default: collapsed)
    var saved = localStorage.getItem(STORAGE_KEY);
    var isCollapsed = saved === null ? true : saved === "true";
    applyState(isCollapsed);

    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      isCollapsed = !isCollapsed;
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
      applyState(isCollapsed);
    });

    // Ensure state resets properly on viewport change
    if (isDesktop.addEventListener) {
      isDesktop.addEventListener("change", function () {
        if (!isDesktop.matches) {
          // On mobile, remove inline style override
          portfolio.style.removeProperty("--pf-sidebar-w");
        } else {
          applyState(isCollapsed);
        }
      });
    }
  }

  /* ================================================================
     9. DESKTOP GEAR TOGGLE (Settings slide panel)
     ================================================================ */

  function initGearToggle() {
    var gearBtn = $("#portfolioGearBtn");
    var slidePanel = $("#portfolioSettingsSlide");
    if (!gearBtn || !slidePanel) return;

    var isOpen = false;

    function toggle() {
      isOpen = !isOpen;
      gearBtn.classList.toggle("portfolio__gear-btn--open", isOpen);
      slidePanel.classList.toggle("portfolio__settings-slide--open", isOpen);
      gearBtn.setAttribute("aria-expanded", String(isOpen));
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      gearBtn.classList.remove("portfolio__gear-btn--open");
      slidePanel.classList.remove("portfolio__settings-slide--open");
      gearBtn.setAttribute("aria-expanded", "false");
    }

    gearBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggle();
    });

    // Close on click outside
    document.addEventListener("click", function (e) {
      var container = $("#portfolioGearContainer");
      if (container && !container.contains(e.target)) {
        close();
      }
    });
  }

  /* ================================================================
     10. DESKTOP FILTER TOGGLE (Filter slide panel)
     ================================================================ */

  function initFilterToggle() {
    var filterBtn = $("#portfolioFilterToggleBtn");
    var slidePanel = $("#portfolioFilterSlide");
    if (!filterBtn || !slidePanel) return;

    var isOpen = false;

    function toggle() {
      isOpen = !isOpen;
      filterBtn.classList.toggle("portfolio__filter-toggle-btn--open", isOpen);
      slidePanel.classList.toggle("portfolio__filter-slide--open", isOpen);
      filterBtn.setAttribute("aria-expanded", String(isOpen));
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      filterBtn.classList.remove("portfolio__filter-toggle-btn--open");
      slidePanel.classList.remove("portfolio__filter-slide--open");
      filterBtn.setAttribute("aria-expanded", "false");
    }

    filterBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggle();
    });

    // Close on click outside
    document.addEventListener("click", function (e) {
      var container = $("#portfolioFilterContainer");
      if (container && !container.contains(e.target)) {
        close();
      }
    });
  }

  /* ================================================================
     INIT
     ================================================================ */

  document.addEventListener("DOMContentLoaded", function () {
    initCardMode();
    initMobileDrawer();
    initSidebarToggle();
    initGearToggle();
    initFilterToggle();
    initTabs();
    initLightbox();
    initVideoController();
    initProjectDetails();
  });
})();
