/* =====================================================================
   Ctrl+Click — Expert Mode controller
   Turns the site into a CLI. Opt-in only, remembered per browser, and
   never on by default. Works on both the landing page and the blog.

   Companion to assets/expert-mode.css. The no-flash class is applied by a
   tiny inline <script> in each page's <head>; this file wires up the
   toggle, injects the terminal chrome, and runs the command line.
   ===================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "ctrlclick:expert";
  var root = document.documentElement;

  /* Links are resolved per page (Jekyll vs. static index) and handed to us
     on window.CTRLCLICK_LINKS so this file stays route-agnostic. */
  var LINKS = window.CTRLCLICK_LINKS || {
    home: "/", blog: "/blog/", business: "/#business",
    personal: "/#personal", contact: "/#contact",
    schedule: "https://calendar.app.google/QtYaUwA72XbuKN468",
    message: "https://forms.gle/wAiDD2GtcD1rzkPq7"
  };

  function stored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function persist(on) {
    try { localStorage.setItem(STORAGE_KEY, on ? "on" : "off"); } catch (e) {}
  }
  function isOn() { return root.classList.contains("expert"); }
  /* `cli-home` marks the landing page as the terminal's "home" — it shows the
     boot banner. Every OTHER page renders its own content into the terminal. */
  function isCliHome() { return root.classList.contains("cli-home"); }

  /* `cli-full` is the live "takeover is active" flag. In expert mode EVERY page
     becomes a full-screen terminal on every screen size (desktop and mobile
     alike): the rich HTML content steps aside and its copy is rendered as
     terminal text instead. Entering expert mode stays a hidden easter egg. */
  function fullCliActive() { return root.classList.contains("cli-full"); }
  function updateCliFull() {
    root.classList.toggle("cli-full", isOn());
  }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---- Service catalogue: read live from the landing page DOM when present ---- */
  function readServices() { return readServicesIn(".card[data-slug]"); }
  function readServicesIn(selector) {
    var out = [];
    document.querySelectorAll(selector).forEach(function (card) {
      var h = card.querySelector("h4");
      var p = card.querySelector("p");
      out.push({
        slug: card.dataset.slug,
        title: h ? h.textContent.trim() : card.dataset.slug,
        blurb: p ? p.textContent.trim() : "",
        url: card.dataset.url || ""
      });
    });
    return out;
  }
