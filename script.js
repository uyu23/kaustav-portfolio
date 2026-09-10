(() => {
  "use strict";

  const root = document.documentElement;
  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const pointerQuery = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );
  const mobileQuery = window.matchMedia("(max-width: 760px)");

  const toggle = document.getElementById("motion-toggle");
  const progress = document.querySelector(".reading-progress");
  const year = document.getElementById("year");

  const interactionResets = [];
  const revealTimers = new Map();
  let manualReduction = false;

  try {
    manualReduction =
      localStorage.getItem("kaustav-reduce-motion") === "true";
  } catch {
    // Storage may be blocked. The website still works.
  }

  const motionReduced = () =>
    motionQuery.matches || manualReduction;

  const pointerMotionAllowed = () =>
    pointerQuery.matches && !motionReduced();

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  // Compatibility helper for older MediaQueryList implementations.
  function onMediaChange(query, callback) {
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", callback);
    } else if (typeof query.addListener === "function") {
      query.addListener(callback);
    }
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /* =========================================
     SECTION STAGGER TIMING
  ========================================= */
  document.querySelectorAll(".stagger-grid").forEach((grid) => {
    [...grid.children].forEach((card, index) => {
      const delay = mobileQuery.matches
        ? (index % 2) * 65
        : (index % 3) * 100;

      card.style.setProperty("--entry-delay", `${delay}ms`);
    });
  });

  document.querySelectorAll(".skill-card .tags").forEach((group) => {
    [...group.children].forEach((chip, index) => {
      chip.style.setProperty("--chip-index", index);
    });
  });

  /* =========================================
     ACCESSIBLE STATISTICS COUNTERS
     Assistive technology receives final values.
  ========================================= */
  const counters = [...document.querySelectorAll("[data-count]")]
    .map((element) => {
      const target = Number(element.dataset.count);
      if (!Number.isFinite(target)) return null;

      const original = element.textContent.trim();
      const suffix = element.dataset.suffix || "";

      element.setAttribute("aria-label", original);

      const visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      visual.textContent = original;
      element.replaceChildren(visual);

      return {
        element,
        visual,
        original,
        target,
        suffix,
        frame: null,
        started: false
      };
    })
    .filter(Boolean);

  function finishCounters() {
    counters.forEach((counter) => {
      if (counter.frame !== null) {
        cancelAnimationFrame(counter.frame);
      }

      counter.frame = null;
      counter.visual.textContent = counter.original;
    });
  }

  function startCounter(counter) {
    if (counter.started || motionReduced()) return;

    counter.started = true;
    let startedAt = null;
    const duration = 1100;

    function tick(now) {
      if (motionReduced() || document.hidden) {
        counter.visual.textContent = counter.original;
        counter.frame = null;
        return;
      }

      if (startedAt === null) startedAt = now;

      const fraction = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - fraction, 3);
      const value = Math.round(counter.target * eased);

      counter.visual.textContent = value + counter.suffix;

      if (fraction < 1) {
        counter.frame = requestAnimationFrame(tick);
      } else {
        counter.visual.textContent = counter.original;
        counter.frame = null;
      }
    }

    counter.frame = requestAnimationFrame(tick);
  }

  /* =========================================
     MOTION PREFERENCE
  ========================================= */
  function clearEntrances() {
    revealTimers.forEach((timer, element) => {
      clearTimeout(timer);
      element.classList.remove("motion-enter");
    });

    revealTimers.clear();

    document.querySelectorAll(".motion-enter").forEach((element) => {
      element.classList.remove("motion-enter");
    });

    document.querySelector(".timeline")
      ?.classList.remove("timeline-drawing");
  }

  function updateMotionPreference() {
    root.classList.toggle("motion-off", motionReduced());

    if (toggle) {
      toggle.hidden = false;
      toggle.disabled = motionQuery.matches;
      toggle.setAttribute("aria-pressed", String(motionReduced()));

      toggle.textContent = motionQuery.matches
        ? "Reduced motion: system setting"
        : manualReduction
          ? "Enable motion"
          : "Reduce motion";
    }

    if (motionReduced()) {
      finishCounters();
      clearEntrances();
    }

    interactionResets.forEach((reset) => reset());
  }

  toggle?.addEventListener("click", () => {
    manualReduction = !manualReduction;

    try {
      localStorage.setItem(
        "kaustav-reduce-motion",
        String(manualReduction)
      );
    } catch {}

    updateMotionPreference();
  });

  onMediaChange(motionQuery, updateMotionPreference);
  updateMotionPreference();

  /* =========================================
     SECTION REVEALS
     Run once as each element enters the screen.
     No permanently hidden content.
  ========================================= */
  if ("IntersectionObserver" in window) {
    root.classList.add("js");

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;

        if (!motionReduced()) {
          element.classList.add("motion-enter");

          // Let child animations finish, then free the card
          // for desktop tilt interactions.
          const timer = window.setTimeout(() => {
            element.classList.remove("motion-enter");
            revealTimers.delete(element);
          }, 1900);

          revealTimers.set(element, timer);
        }

        revealObserver.unobserve(element);
      });
    }, {
      threshold: 0.06
    });

    document.querySelectorAll(".reveal").forEach((element) => {
      revealObserver.observe(element);
    });

    const stats = document.querySelector(".stats");

    if (stats) {
      const counterObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        counters.forEach(startCounter);
        counterObserver.disconnect();
      }, {
        threshold: 0.25
      });

      counterObserver.observe(stats);
    }

    const timeline = document.querySelector(".timeline");

    if (timeline) {
      const timelineObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        if (!motionReduced()) {
          timeline.classList.add("timeline-drawing");
        }

        timelineObserver.disconnect();
      }, {
        threshold: 0
      });

      timelineObserver.observe(timeline);
    }

    // Continuous graphics only run while their region is visible.
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          "on-screen",
          entry.isIntersecting
        );
      });
    }, {
      threshold: 0
    });

    document.querySelectorAll(".hero, .ticker, #contact").forEach((region) => {
      visibilityObserver.observe(region);
    });
  }

  /* =========================================
     DESKTOP POINTER EFFECTS
     Phones use CSS tap feedback instead.
  ========================================= */
  function attachPointerEffect(element, render, reset) {
    let frame = null;
    let point = null;

    function clear() {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = null;
      reset();
    }

    element.addEventListener("pointermove", (event) => {
      if (
        !pointerMotionAllowed() ||
        event.pointerType === "touch"
      ) {
        clear();
        return;
      }

      point = {
        x: event.clientX,
        y: event.clientY
      };

      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        frame = null;

        if (!pointerMotionAllowed()) {
          clear();
          return;
        }

        render(point, element.getBoundingClientRect());
      });
    });

    element.addEventListener("pointerleave", clear);
    element.addEventListener("pointercancel", clear);
    element.addEventListener("blur", clear);

    interactionResets.push(clear);
  }

  // Restrained tilt and spotlight.
  document.querySelectorAll(".motion-card").forEach((card) => {
    attachPointerEffect(
      card,

      (point, bounds) => {
        const x = (point.x - bounds.left) / bounds.width - .5;
        const y = (point.y - bounds.top) / bounds.height - .5;

        card.style.setProperty(
          "--tilt-x",
          `${clamp(-y * 6, -3, 3)}deg`
        );

        card.style.setProperty(
          "--tilt-y",
          `${clamp(x * 6, -3, 3)}deg`
        );

        card.style.setProperty("--mx", `${point.x - bounds.left}px`);
        card.style.setProperty("--my", `${point.y - bounds.top}px`);
      },

      () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      }
    );
  });

  // Magnetic buttons: maximum movement of a few pixels.
  document.querySelectorAll(".magnetic").forEach((button) => {
    attachPointerEffect(
      button,

      (point, bounds) => {
        const x = (point.x - bounds.left - bounds.width / 2) * .1;
        const y = (point.y - bounds.top - bounds.height / 2) * .14;

        button.style.setProperty(
          "--magnet-x",
          `${clamp(x, -7, 7)}px`
        );

        button.style.setProperty(
          "--magnet-y",
          `${clamp(y, -5, 5)}px`
        );
      },

      () => {
        button.style.setProperty("--magnet-x", "0px");
        button.style.setProperty("--magnet-y", "0px");
      }
    );
  });

  onMediaChange(pointerQuery, () => {
    interactionResets.forEach((reset) => reset());
  });

  /* =========================================
     READING PROGRESS
  ========================================= */
  let progressFrame = null;

  function updateProgress() {
    progressFrame = null;
    if (!progress) return;

    const available =
      document.documentElement.scrollHeight - window.innerHeight;

    const fraction = available > 0
      ? clamp(window.scrollY / available, 0, 1)
      : 0;

    progress.style.transform = `scaleX(${fraction})`;
  }

  window.addEventListener("scroll", () => {
    if (progressFrame === null) {
      progressFrame = requestAnimationFrame(updateProgress);
    }
  }, { passive: true });

  window.addEventListener("resize", updateProgress);

  /* =========================================
     PAUSE BACKGROUND ACTIVITY IN HIDDEN TABS
  ========================================= */
  function updatePageVisibility() {
    root.classList.toggle("page-hidden", document.hidden);

    if (document.hidden) {
      finishCounters();
      interactionResets.forEach((reset) => reset());
    }
  }

  document.addEventListener("visibilitychange", updatePageVisibility);

  updatePageVisibility();
  updateProgress();
})();
