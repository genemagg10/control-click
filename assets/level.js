/* =====================================================================
   Ctrl+Click — Audience control (Individual / Team / Expert)
   Runs on every page. Individual and Team stay on the light site.
   Team reveals the "how" + tool chips on the homepage's service cards
   (via html.team). Expert hands off to expert-mode.js: a command-line
   Easter egg, just for fun, not a separate service.

   The choice is remembered in localStorage `ctrlclick:level`
   ("individual" or "team"). Stale values from the old skill ladder
   migrate before paint in the inline head script, and again here:
   beginner → individual, intermediate → team. Anything else defaults
   to team. Expert mode (`ctrlclick:expert`) stays independent, so
   leaving the command line returns you to the audience you chose.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;

  function currentAudience() {
    return root.classList.contains("individual") ? "individual" : "team";
  }
  function persist(level) {
    try { localStorage.setItem("ctrlclick:level", level); } catch (e) {}
  }
  function syncButtons() {
    var lvl = currentAudience();
    document.querySelectorAll(".level-btn").forEach(function (btn) {
      var on = !btn.classList.contains("is-locked") && btn.dataset.level === lvl;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* A locked button (if a page still marks one) is a conversation hook,
     not a switch. The live site no longer locks Team or Expert. */
  function showUnlock() {
    var note = document.getElementById("levelUnlock");
    if (note) note.hidden = false;
    toast("The command-line view is just for fun. For real help, book a free chat.");
  }

  var TOASTS = {
    individual: "Individual · help for one person.",
    team: "Team · businesses, nonprofits, and families."
  };
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "level-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.remove("is-visible");
    void toastEl.offsetWidth;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2800);
  }

  function applyAudience(level, opts) {
    opts = opts || {};
    var audience = level === "individual" ? "individual" : "team";
    root.classList.toggle("individual", audience === "individual");
    root.classList.toggle("team", audience === "team");
    persist(audience);
    syncButtons();
    if (opts.toast && TOASTS[audience]) toast(TOASTS[audience]);
  }

  function setLevel(level) {
    if (level === "expert") {
      // The command line is an overlay. The Individual/Team choice stays
      // put so leaving the CLI restores it.
      if (window.CtrlClickExpert) window.CtrlClickExpert.enable();
      else { try { localStorage.setItem("ctrlclick:expert", "on"); } catch (e) {} location.reload(); }
      return;
    }
    if (level !== "individual" && level !== "team") return;
    var changed = currentAudience() !== level;
    applyAudience(level, { toast: changed });
  }

  /* If the head script didn't run, migrate storage and paint the class. */
  function ensureAudience() {
    var raw = null;
    try { raw = localStorage.getItem("ctrlclick:level"); } catch (e) { raw = null; }
    var next = raw;
    if (raw === "beginner") next = "individual";
    else if (raw === "intermediate") next = "team";
    else if (raw !== "individual" && raw !== "team") next = "team";
    if (next !== raw) persist(next);
    if (!root.classList.contains("individual") && !root.classList.contains("team")) {
      root.classList.add(next);
    }
  }

  /* #business lives only on the Team view. Switch before the jump so the
     section is actually there — including when the link leaves this page. */
  function hashOf(href) {
    var i = href.indexOf("#");
    return i === -1 ? "" : href.slice(i + 1);
  }
  function onDocClick(e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var href = a.getAttribute("href") || "";
    var hash = hashOf(href);
    if (hash !== "business") return;
    applyAudience("team");
    var samePage = href.charAt(0) === "#" || a.pathname === window.location.pathname;
    if (!samePage) return;
    var el = document.getElementById("business");
    if (!el) return;
    e.preventDefault();
    if (history.pushState) history.pushState(null, "", "#business");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function init() {
    ensureAudience();
    document.querySelectorAll(".level-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("is-locked")) { showUnlock(); return; }
        setLevel(btn.dataset.level);
      });
    });
    document.addEventListener("click", onDocClick);
    syncButtons();
    if (hashOf(window.location.hash) === "business" && currentAudience() !== "team") {
      applyAudience("team");
      var el = document.getElementById("business");
      if (el) el.scrollIntoView({ block: "start" });
    }
  }

  window.CtrlClickLevel = {
    set: function (level) { applyAudience(level); },
    sync: syncButtons
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
