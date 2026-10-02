/* RECUR script.js
   Plain JavaScript, no libraries. The parts every page shares: the light and
   dark theme, the header, the mobile menu, scroll effects, accordions, the
   "ships today" line and the restock sign-up forms.
   store.js runs after this file and handles the shop itself. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

/* ---------- Light and dark theme ---------- */

// The theme is first picked in a tiny script in each page's <head>, so the
// page never flashes the wrong colours. This keeps the button in sync.
const THEME_KEY = "recur-theme";
const themeColour = document.querySelector('meta[name="theme-color"]');
const themeButtons = document.querySelectorAll(".theme-toggle");

function savedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function showTheme() {
  const dark = root.dataset.theme === "dark";
  themeButtons.forEach((button) => {
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  });
  if (themeColour) themeColour.content = dark ? "#131211" : "#f3f0ea";
}

function setTheme(theme) {
  const apply = () => {
    root.dataset.theme = theme;
    showTheme();
  };
  // A soft cross-fade where the browser supports it
  if (document.startViewTransition && !reduceMotion) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing: the choice just won't be remembered
    }
  });
});

// Follow the system setting until someone picks a theme themselves
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (!savedTheme()) setTheme(event.matches ? "dark" : "light");
});

showTheme();

/* ---------- Delivery bar: the X closes it, and it stays closed ---------- */

const notice = document.querySelector(".notice");

if (notice) {
  notice.querySelector(".notice-close").addEventListener("click", () => {
    try {
      localStorage.setItem("recur-notice", "closed");
    } catch {
      // Private browsing: it'll just come back on the next page
    }

    const hide = () => root.classList.add("notice-closed");
    if (reduceMotion) return hide();

    notice.animate(
      [
        { height: `${notice.offsetHeight}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    ).onfinish = hide;
  });
}

/* ---------- Header: hairline once scrolled, hides while scrolling down ---------- */

const header = document.querySelector(".site-header");
const siteNav = document.getElementById("site-nav");
let lastScrollY = window.scrollY;

function updateHeader() {
  const y = window.scrollY;
  const scrollingDown = y > lastScrollY;
  const menuIsOpen = siteNav && siteNav.classList.contains("is-open");

  header.classList.toggle("is-scrolled", y > 40);
  header.classList.toggle("is-hidden", scrollingDown && y > 240 && !menuIsOpen);
  lastScrollY = y;
}

/* ---------- Small scroll effects ---------- */

// Home: the smaller hero photo drifts up a little slower than the page
const heroVisual = document.querySelector(".hero-visual");

function updateHeroDrift() {
  if (!heroVisual || reduceMotion) return;
  const drift = Math.min(window.scrollY, window.innerHeight) * 0.08;
  heroVisual.style.setProperty("--drift", drift.toFixed(1));
}

// Home: the big mark turns half a circle while its block scrolls past
const ideaMark = document.querySelector(".idea-mark");

function updateIdeaMark() {
  if (!ideaMark || reduceMotion) return;
  const rect = ideaMark.parentElement.getBoundingClientRect();
  const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
  ideaMark.style.setProperty("--turn", Math.min(Math.max(progress, 0), 1).toFixed(3));
}

// Run the scroll work at most once per frame
let ticking = false;

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateHeroDrift();
      updateIdeaMark();
      ticking = false;
    });
  },
  { passive: true }
);

updateHeader();
updateIdeaMark();

/* ---------- Mobile menu ---------- */

const menuToggle = document.querySelector(".menu-toggle");

function setMenu(open) {
  if (open) header.classList.remove("is-hidden"); // keep the header in view while the menu is open
  menuToggle.setAttribute("aria-expanded", String(open));
  siteNav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  // Close the menu after picking a link
  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  // Close it if the screen grows past the mobile layout
  window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });
}

/* ---------- Fade sections in as they scroll into view ---------- */

const revealItems = document.querySelectorAll(".reveal, .stagger");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ---------- Accordions: smooth open and close ---------- */

// Used by the FAQ and the product details. A group marked data-one-open
// keeps a single answer open at a time.
const accordionTiming = { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

function openAccordion(item) {
  const body = item.querySelector(".accordion-body");
  item.open = true;
  body.animate(
    [
      { height: "0px", opacity: 0 },
      { height: `${body.scrollHeight}px`, opacity: 1 },
    ],
    accordionTiming
  );
}

function closeAccordion(item) {
  const body = item.querySelector(".accordion-body");
  item.classList.add("is-closing");
  const animation = body.animate(
    [
      { height: `${body.scrollHeight}px`, opacity: 1 },
      { height: "0px", opacity: 0 },
    ],
    accordionTiming
  );
  animation.onfinish = () => {
    item.open = false;
    item.classList.remove("is-closing");
  };
}

document.addEventListener("click", (event) => {
  const summary = event.target.closest("details.accordion > summary");
  if (!summary || reduceMotion) return; // without motion, the browser opens it instantly
  event.preventDefault();

  const item = summary.parentElement;
  if (item.open && !item.classList.contains("is-closing")) {
    closeAccordion(item);
    return;
  }

  const group = item.closest("[data-one-open]");
  if (group) {
    group.querySelectorAll("details.accordion[open]").forEach((other) => {
      if (other !== item) closeAccordion(other);
    });
  }
  openAccordion(item);
});

/* ---------- "Order in the next 2 h 10 min and it ships today" ---------- */

// Orders placed before 2pm, Monday to Friday, leave the same day.
// Uses the visitor's own clock, like the café site's "Open now" line.
const CUTOFF_HOUR = 14;

function shipNoteText(now = new Date()) {
  const day = now.getDay(); // 0 is Sunday
  const minutes = now.getHours() * 60 + now.getMinutes();
  const minutesLeft = CUTOFF_HOUR * 60 - minutes;
  const isWeekday = day >= 1 && day <= 5;

  if (isWeekday && minutesLeft > 0) {
    const hours = Math.floor(minutesLeft / 60);
    const rest = minutesLeft % 60;
    const time = hours ? `${hours} h ${rest} min` : `${rest} min`;
    return `Order in the next ${time} and it ships today.`;
  }
  if (day >= 1 && day <= 4) return "Order now and it ships tomorrow morning.";
  return "Order now and it ships on Monday.";
}

function updateShipNotes() {
  const text = shipNoteText();
  document.querySelectorAll("[data-ship-note]").forEach((note) => {
    note.textContent = text;
  });
}

updateShipNotes();
setInterval(updateShipNotes, 30 * 1000);

/* ---------- Restock sign-up forms (a demo: nothing is sent) ---------- */

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-alert-form]");
  if (!form) return;
  event.preventDefault();

  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  form.reset();
  button.disabled = true;
  status.className = "form-status is-success";
  status.textContent = "Saved. RECUR is a demo shop, so no email will actually be sent.";
});

/* ---------- About: click the big mark and it turns over ---------- */

const markTurn = document.querySelector(".mark-turn");

if (markTurn) {
  let turns = 0;
  markTurn.addEventListener("click", () => {
    turns += 1;
    markTurn.querySelector(".lemni").style.rotate = `${turns * 180}deg`;
  });
}

/* ---------- Keep the copyright year current ---------- */

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});
