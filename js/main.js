"use strict";

(() => {
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
  let runId = 0;

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
        reject(new Error("Video loading or playback failed."));
      }

      element.addEventListener(successEvent, onSuccess, {
        once: true,
      });

      element.addEventListener("error", onError, {
        once: true,
      });

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

    // Move one scene at a time.
    if (Math.abs(destination - active) !== 1) return;

    const direction = destination > active ? 1 : -1;

    const clipIndex = direction === 1 ? active : active - 1;

    const file = clips[direction === 1 ? "forward" : "reverse"][clipIndex];

    busy = true;
    setUI();

    const id = ++runId;

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

      if (id !== runId) return;

      // Register the ended listener BEFORE playing,
      // so we never miss a quick ended event.
      const ended = waitForEvent(video, "ended", 30000);

      await video.play();

      video.classList.add("visible");
      still.style.visibility = "hidden";

      message.textContent = "";

      await ended;

      if (id !== runId) return;

      active = destination;

      // Allow the final still image to load before switching.
      const finalStill = new Image();
      finalStill.src = `${root}images/still-${active + 1}.jpg`;

      try {
        await finalStill.decode();
      } catch (_) {
        // Continue even if decoding is unsupported.
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

  // NEXT and BACK buttons only.
  prev.addEventListener("click", () => changeBy(-1));
  next.addEventListener("click", () => changeBy(1));

  // Scene indicators.
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (!busy && Math.abs(index - active) === 1) {
        goto(index);
      }
    });
  });

  /*
   * SCROLL-CONTROLLED SCENE NAVIGATION REMOVED
   *
   * No wheel interception.
   * No touch swipe interception.
   * No scroll lock.
   *
   * Website scrolling is now completely normal.
   */

  // Mobile navigation.
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

  // Footer year.
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // GSAP falling flower petals.
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!reducedMotion) {
    const holder = document.getElementById("petals");

    if (holder) {
      for (let i = 0; i < 17; i++) {
        const petal = document.createElement("i");
        petal.className = "petal";

        holder.appendChild(petal);

        petal.style.left = `${Math.random() * 100}%`;
        petal.style.top = `${-Math.random() * 140}%`;
        petal.style.pointerEvents = "none";

        const delay = -Math.random() * 16;
        const speed = 11 + Math.random() * 12;

        if (window.gsap) {
          gsap.to(petal, {
            y: window.innerHeight + 200,
            x: (Math.random() - 0.5) * 180,
            rotation: 340 + Math.random() * 420,
            duration: speed,
            repeat: -1,
            ease: "none",
            delay,
          });
        } else {
          petal.style.opacity = ".18";
        }
      }
    }
  }

  // Initialize first scene.
  setUI();
  showStill();
})();
