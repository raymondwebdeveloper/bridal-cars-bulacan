"use strict";

(() => {
  // ==========================================
  // CINEMATIC HERO
  // ==========================================

  const video = document.getElementById("sceneVideo");
  const still = document.getElementById("sceneStill");

  const prev = document.getElementById("prevScene");
  const next = document.getElementById("nextScene");
  const count = document.getElementById("sceneCount");
  const small = document.getElementById("sceneSmall");
  const title = document.getElementById("heroTitle");
  const desc = document.getElementById("heroDesc");
  const message = document.getElementById("loadMessage");

  const root = "assets/";

  const stages = [
    {
      small: "THE FIRST LOOK",
      heading: "Arrive Beautifully<br>on Your <em>Special Day</em>",
      description:
        "Make your wedding day unforgettable with our elegant White MG ZS Alpha bridal car — a beautiful beginning to your forever.",
    },
    {
      small: "INSIDE THE EXPERIENCE",
      heading: "A Beautiful Journey<br><em>Together</em>",
      description:
        "Share a romantic moment together in a comfortable cabin, beneath the beautiful panoramic glass sunroof.",
    },
    {
      small: "A JOYFUL SEND-OFF",
      heading: "Celebrate Every<br><em>Beautiful Moment</em>",
      description:
        "The happiest beginnings deserve a memorable arrival. Your special day, styled with love.",
    },
  ];

  const clips = {
    forward: ["video/forward-1.mp4", "video/forward-2.mp4"],
    reverse: ["video/reverse-1.mp4", "video/reverse-2.mp4"],
  };

  let active = 0;
  let busy = false;

  const dots = [...document.querySelectorAll(".dot")];

  function setUI() {
    count.textContent = `0${active + 1} / 03`;
    small.textContent = stages[active].small;
    title.innerHTML = stages[active].heading;
    desc.textContent = stages[active].description;

    still.src = `${root}images/still-${active + 1}.jpg`;

    prev.disabled = busy || active === 0;
    next.disabled = busy || active === 2;

    dots.forEach((dot, index) => {
      const selected = index === active;

      dot.classList.toggle("is-active", selected);

      dot.disabled = busy;

      if (selected) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function showStill() {
    video.classList.remove("visible");
    still.style.visibility = "visible";
  }

  function releaseVideo() {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function waitForEvent(element, successEvent, timeout = 15000) {
    return new Promise((resolve, reject) => {
      let timer;

      function cleanup() {
        clearTimeout(timer);
        element.removeEventListener(successEvent, onSuccess);
        element.removeEventListener("error", onError);
      }

      function onSuccess() {
        cleanup();
        resolve();
      }

      function onError() {
        cleanup();
        reject(new Error("Video operation failed."));
      }

      element.addEventListener(successEvent, onSuccess, { once: true });

      element.addEventListener("error", onError, { once: true });

      timer = setTimeout(() => {
        cleanup();
        reject(new Error("Video operation timed out."));
      }, timeout);
    });
  }

  async function goto(destination) {
    if (busy || destination < 0 || destination > 2 || destination === active) {
      return;
    }

    if (Math.abs(destination - active) !== 1) {
      return;
    }

    const direction = destination > active ? 1 : -1;

    const clipIndex = direction === 1 ? active : active - 1;

    const file = clips[direction === 1 ? "forward" : "reverse"][clipIndex];

    busy = true;
    setUI();

    message.textContent = "Preparing cinematic transition…";

    showStill();

    try {
      video.pause();
      video.muted = true;
      video.playsInline = true;
      video.loop = false;
      video.preload = "auto";

      video.src = root + file;
      video.load();

      if (video.readyState < 2) {
        await waitForEvent(video, "loadeddata", 15000);
      }

      await video.play();

      video.classList.add("visible");
      still.style.visibility = "hidden";
      message.textContent = "";

      // Wait until transition finishes.
      if (!video.ended) {
        await waitForEvent(video, "ended", 30000);
      }

      active = destination;

      const finalStill = new Image();

      finalStill.src = `${root}images/still-${active + 1}.jpg`;

      try {
        await finalStill.decode();
      } catch (_) {
        // Use the still even if decode fails.
      }

      setUI();
      showStill();
      releaseVideo();

      busy = false;
      setUI();
    } catch (error) {
      console.warn("Cinematic transition error:", error);

      message.textContent = "Video playback unavailable. Please try again.";

      showStill();
      releaseVideo();

      busy = false;
      setUI();
    }
  }

  function changeBy(direction) {
    goto(active + direction);
  }

  // ==========================================
  // NEXT / BACK BUTTONS
  // ==========================================

  prev.addEventListener("click", () => {
    changeBy(-1);
  });

  next.addEventListener("click", () => {
    changeBy(1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (!busy && Math.abs(index - active) === 1) {
        goto(index);
      }
    });
  });

  // No wheel interception.
  // No swipe interception.
  // Normal page scrolling.

  // ==========================================
  // MOBILE NAVIGATION
  // ==========================================

  const menu = document.getElementById("menuToggle");

  const mobile = document.getElementById("mobileNav");

  if (menu && mobile) {
    menu.addEventListener("click", () => {
      const opened = mobile.classList.toggle("open");

      menu.setAttribute("aria-expanded", String(opened));
    });

    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobile.classList.remove("open");

        menu.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ==========================================
  // FOOTER YEAR
  // ==========================================

  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // ==========================================
  // REUSABLE CONTINUOUS GSAP PETALS
  // ==========================================

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function createFallingPetals({
    containerId,
    sectionId,
    desktopCount = 20,
    mobileCount = 10,
    minSize = 14,
    maxSize = 32,
    minDuration = 12,
    maxDuration = 22,
    colors = ["#FFFFFF"],
    maxOpacity = 0.75,
    wind = 140,
  }) {
    const container = document.getElementById(containerId);

    const section = document.getElementById(sectionId);

    if (!container || !section || !window.gsap || reducedMotion) {
      return;
    }

    const isMobile = window.innerWidth < 768;

    const petalCount = isMobile ? mobileCount : desktopCount;

    const timelines = [];

    const random = (min, max) => gsap.utils.random(min, max);

    const getHeight = () =>
      container.clientHeight || section.offsetHeight || window.innerHeight;

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement("i");

      petal.className = "petal";

      container.appendChild(petal);

      const size = random(minSize, maxSize);

      const color = colors[Math.floor(Math.random() * colors.length)];

      const duration = random(minDuration, maxDuration);

      const peakOpacity = random(maxOpacity * 0.65, maxOpacity);

      // Initial petal appearance.
      gsap.set(petal, {
        position: "absolute",
        top: 0,
        left: `${random(0, 100)}%`,
        width: size,
        height: size * 0.7,
        background: color,
        opacity: 0,
        pointerEvents: "none",
        transformOrigin: "center center",
      });

      // One repeating timeline per petal.
      // No new timelines created per cycle.
      const timeline = gsap.timeline({
        repeat: -1,
        repeatRefresh: true,
        paused: true,
      });

      // Continuous downward movement.
      timeline.fromTo(
        petal,
        {
          x: 0,
          y: -size - 50,
          rotation: () => random(-90, 90),
        },
        {
          x: () => random(-wind, wind),
          y: () => getHeight() + size + 60,
          rotation: () => random(300, 720),
          duration,
          ease: "none",
          immediateRender: false,
        },
        0,
      );

      // Smooth fade in.
      timeline.fromTo(
        petal,
        {
          opacity: 0,
        },
        {
          opacity: peakOpacity,
          duration: Math.min(2.5, duration * 0.22),
          ease: "sine.out",
          immediateRender: false,
        },
        0,
      );

      // Smooth fade out near bottom.
      timeline.to(
        petal,
        {
          opacity: 0,
          duration: Math.min(3.5, duration * 0.3),
          ease: "sine.inOut",
        },
        duration - Math.min(3.5, duration * 0.3),
      );

      // Distribute petals along the path,
      // avoiding a synchronized start.
      timeline.progress(Math.random());
      timelines.push(timeline);
    }

    // ========================================
    // PAUSE WHEN SECTION IS NOT VISIBLE
    // ========================================

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries[0].isIntersecting;

          timelines.forEach((timeline) => {
            if (visible) {
              timeline.play();
            } else {
              timeline.pause();
            }
          });
        },
        {
          threshold: 0.01,
        },
      );

      observer.observe(section);
    } else {
      // Fallback for older browsers.
      timelines.forEach((timeline) => {
        timeline.play();
      });
    }
  }

  // ==========================================
  // HERO — PINK FALLING PETALS
  // ==========================================

  createFallingPetals({
    containerId: "petals",
    sectionId: "home",

    desktopCount: 24,
    mobileCount: 12,

    minSize: 18,
    maxSize: 38,

    minDuration: 10,
    maxDuration: 19,

    colors: ["#F8B6C5", "#F5A2B8", "#FFE0E6", "#EAB0C2"],

    maxOpacity: 0.7,
    wind: 180,
  });

  // ==========================================
  // CTA — WHITE / IVORY FALLING PETALS
  // ==========================================

  createFallingPetals({
    containerId: "ctaPetals",
    sectionId: "contact",

    desktopCount: 14,
    mobileCount: 7,

    minSize: 14,
    maxSize: 28,

    minDuration: 13,
    maxDuration: 23,

    colors: ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFF8F2", "#FFE8ED"],

    maxOpacity: 0.85,
    wind: 100,
  });

  // ==========================================
  // INITIALIZE HERO
  // ==========================================

  setUI();
  showStill();
})();

// ==========================================
// ACTIVE NAVIGATION ON SCROLL
// ==========================================

const navSections = ["home", "about", "packages", "gallery", "contact"];

const navLinks = document.querySelectorAll(
  '.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]',
);

function updateActiveNav() {
  const scrollPosition = window.scrollY;
  const headerHeight =
    document.querySelector(".site-header")?.offsetHeight || 80;

  const marker = scrollPosition + headerHeight + 100;

  let currentSection = "home";

  navSections.forEach((id) => {
    const section = document.getElementById(id);

    if (section && section.offsetTop <= marker) {
      currentSection = id;
    }
  });

  // Ensure Contact becomes active at page bottom.
  if (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 5
  ) {
    currentSection = "contact";
  }

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${currentSection}`;

    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

let navTicking = false;

window.addEventListener(
  "scroll",
  () => {
    if (!navTicking) {
      window.requestAnimationFrame(() => {
        updateActiveNav();
        navTicking = false;
      });

      navTicking = true;
    }
  },
  { passive: true },
);

window.addEventListener("resize", updateActiveNav);
window.addEventListener("load", updateActiveNav);

updateActiveNav();

const slides = document.querySelectorAll(".gallery-slide");
const thumbs = document.querySelectorAll(".gallery-thumbnails .thumb");
const dots = document.querySelectorAll(".gallery-dots .dot");
const prevBtn = document.querySelector(".gallery-nav.prev");
const nextBtn = document.querySelector(".gallery-nav.next");

let currentSlide = 0;

function showSlide(index) {
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  thumbs.forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  currentSlide = index;
}

prevBtn.addEventListener("click", () => {
  showSlide(currentSlide - 1);
});

nextBtn.addEventListener("click", () => {
  showSlide(currentSlide + 1);
});

thumbs.forEach((thumb) => {
  thumb.addEventListener("click", () => {
    showSlide(Number(thumb.dataset.index));
  });
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showSlide(Number(dot.dataset.index));
  });
});

// Optional auto slide
setInterval(() => {
  showSlide(currentSlide + 1);
}, 5000);

showSlide(0);

/* Same-image blurred gallery background */
document
  .querySelectorAll(".wedding-gallery-section .gallery-slide")
  .forEach((slide) => {
    const img = slide.querySelector("img");

    if (!img) return;

    const imageUrl = new URL(img.getAttribute("src"), document.baseURI).href;

    slide.style.setProperty("--gallery-bg", `url("${imageUrl}")`);
  });

/* ==========================================
   BRIDAL CARS BULACAN
   BLURRED GALLERY BACKGROUND
   ========================================== */

function setupGalleryBackgrounds() {
  const slides = document.querySelectorAll(
    ".wedding-gallery-section .gallery-slide",
  );

  slides.forEach(function (slide) {
    const img = slide.querySelector("img");

    if (!img) return;

    const imageUrl = img.src;

    slide.style.setProperty("--gallery-bg", 'url("' + imageUrl + '")');
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupGalleryBackgrounds);
} else {
  setupGalleryBackgrounds();
}
