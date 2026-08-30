/* =====================================================================
   Ctrl+Click — Reading-level control (Beginner / Intermediate / Expert)
   Runs on every page. Beginner and Intermediate stay on the light site;
   Intermediate reveals the "how" + tool chips on the homepage's service
   cards (via html.intermediate). Expert hands off to expert-mode.js.
   A brief toast confirms the switch, since on many pages the change is
   below the fold (or, on reference pages, deliberately subtle).
   ===================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;

  function currentLevel() {
    if (root.classList.contains("expert")) return "expert";
    return root.classList.contains("intermediate") ? "intermediate" : "beginner";
  }
  function persist(level) {
    try { localStorage.setItem("ctrlclick:level", level); } catch (e) {}
  }
  function syncButtons() {
    var lvl = currentLevel();
    document.querySelectorAll(".level-btn").forEach(function (btn) {
      var on = btn.dataset.level === lvl;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  var TOASTS = {
    beginner: "Beginner · plain and simple.",
    intermediate: "Intermediate · now showing the how, the tools, and the jargon (all defined)."
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
    void toastEl.offsetWidth; // restart the transition
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2800);
  }

  function setLevel(level) {
    if (level === "expert") {
      // Hand off to the CLI; expert-mode.js keeps its own state, and the
      // underlying beginner/intermediate level is preserved for the return trip.
      if (window.CtrlClickExpert) window.CtrlClickExpert.enable();
      else { try { localStorage.setItem("ctrlclick:expert", "on"); } catch (e) {} location.reload(); }
      return;
    }
    var changed = currentLevel() !== level;
    root.classList.toggle("intermediate", level === "intermediate");
    persist(level);
    syncButtons();
    if (changed && TOASTS[level]) toast(TOASTS[level]);
  }

  function init() {
    document.querySelectorAll(".level-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { setLevel(btn.dataset.level); });
    });
    syncButtons();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
