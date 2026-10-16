"use strict";
(() => {
  const video = document.getElementById("sceneVideo"),
    still = document.getElementById("sceneStill"),
    cinema = document.getElementById("home");
  const prev = document.getElementById("prevScene"),
    next = document.getElementById("nextScene"),
    count = document.getElementById("sceneCount"),
    small = document.getElementById("sceneSmall"),
    title = document.getElementById("heroTitle"),
    desc = document.getElementById("heroDesc"),
    message = document.getElementById("loadMessage");
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
  let active = 0,
    busy = false,
    gestureAt = 0,
    runId = 0;
  const dots = [...document.querySelectorAll(".dot")];
  function setUI() {
    count.textContent = `0${active + 1} / 03`;
    small.textContent = stages[active].small;
    title.innerHTML = stages[active].heading;
    desc.textContent = stages[active].description;
    still.src = `${root}images/still-${active + 1}.jpg`;
    prev.disabled = busy || active === 0;
    next.disabled = busy || active === 2;
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", i === active);
      d.disabled = busy;
      d.setAttribute("aria-current", String(i === active));
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
  async function goto(destination) {
    if (busy || destination < 0 || destination > 2 || destination === active)
      return;
    const direction = destination > active ? 1 : -1,
      clipIndex = direction === 1 ? active : active - 1;
    busy = true;
    setUI();
    const id = ++runId;
    message.textContent = "Preparing cinematic transition…";
    showStill();
    const file = clips[direction === 1 ? "forward" : "reverse"][clipIndex];
    try {
      video.pause();
      video.src = root + file;
      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;
      video.load();
      await new Promise((resolve, reject) => {
        if (video.readyState >= 2) return resolve();
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Video loading timed out."));
        }, 15000);
        function cleanup() {
          clearTimeout(timer);
          video.removeEventListener("loadeddata", ok);
          video.removeEventListener("error", bad);
        }
        function ok() {
          cleanup();
          resolve();
        }
        function bad() {
          cleanup();
          reject(new Error("Video failed to load."));
        }
        video.addEventListener("loadeddata", ok);
        video.addEventListener("error", bad);
      });
      if (id !== runId) return;
      await video.play();
      video.classList.add("visible");
      message.textContent = "";
      await new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
          clear();
          reject(new Error("Playback took too long."));
        }, 25000);
        function clear() {
          clearTimeout(timer);
          video.removeEventListener("ended", ended);
          video.removeEventListener("error", bad);
        }
        function ended() {
          clear();
          resolve();
        }
        function bad() {
          clear();
          reject(new Error("Playback interrupted."));
        }
        video.addEventListener("ended", ended);
        video.addEventListener("error", bad);
      });
      if (id !== runId) return;
      active += direction;
      setUI();
      showStill();
      releaseVideo();
      busy = false;
      setUI();
    } catch (e) {
      console.warn(e);
      message.textContent =
        "Video playback unavailable. Tap Next / Back to try again.";
      showStill();
      releaseVideo();
      busy = false;
      setUI();
    }
  }
  function changeBy(dir) {
    goto(active + dir);
  }
  prev.addEventListener("click", () => changeBy(-1));
  next.addEventListener("click", () => changeBy(1));
  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      if (Math.abs(i - active) === 1) goto(i);
    }),
  );
  function heroVisible() {
    const r = cinema.getBoundingClientRect();
    return r.top < innerHeight * 0.45 && r.bottom > innerHeight * 0.55;
  }
  window.addEventListener(
    "wheel",
    (e) => {
      if (!heroVisible() || Math.abs(e.deltaY) < 7) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (busy) {
        e.preventDefault();
        return;
      }
      if ((dir === 1 && active < 2) || (dir === -1 && active > 0)) {
        e.preventDefault();
        const now = performance.now();
        if (now - gestureAt > 520) {
          gestureAt = now;
          changeBy(dir);
        }
      }
    },
    { passive: false },
  );
  let touchStart = null;
  cinema.addEventListener(
    "touchstart",
    (e) => {
      touchStart = e.touches[0]?.clientY ?? null;
    },
    { passive: true },
  );
  cinema.addEventListener(
    "touchend",
    (e) => {
      if (touchStart === null) return;
      const dist = touchStart - (e.changedTouches[0]?.clientY ?? touchStart);
      touchStart = null;
      if (Math.abs(dist) > 55 && !busy) {
        if (dist > 0 && active < 2) changeBy(1);
        else if (dist < 0 && active > 0) changeBy(-1);
      }
    },
    { passive: true },
  );
  window.addEventListener("keydown", (e) => {
    if (
      !heroVisible() ||
      ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    )
      return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      changeBy(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      changeBy(-1);
    }
  });
  const menu = document.getElementById("menuToggle"),
    mobile = document.getElementById("mobileNav");
  menu.addEventListener("click", () => {
    const opened = mobile.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(opened));
  });
  mobile.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobile.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }),
  );
  document.getElementById("year").textContent = new Date().getFullYear();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    const holder = document.getElementById("petals");
    for (let i = 0; i < 17; i++) {
      const el = document.createElement("i");
      el.className = "petal";
      holder.appendChild(el);
      const x = Math.random() * 100,
        y = -Math.random() * 140;
      el.style.left = x + "%";
      el.style.top = y + "%";
      const delay = -Math.random() * 16,
        speed = 11 + Math.random() * 12;
      if (window.gsap) {
        gsap.to(el, {
          y: innerHeight + 200,
          x: (Math.random() - 0.5) * 180,
          rotation: 340 + Math.random() * 420,
          duration: speed,
          repeat: -1,
          ease: "none",
          delay,
        });
      } else {
        el.style.opacity = ".18";
      }
    }
  }
  setUI();
})();
