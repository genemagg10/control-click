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
  /* The landing page CAN turn expert mode into a full-screen terminal (the
     marketing content steps aside). The blog keeps a lighter reskin, so the
     `cli-home` marker — set in the page <head> — gates the takeover behaviour. */
  function isCliHome() { return root.classList.contains("cli-home"); }

  /* `cli-full` is the live "takeover is active" flag — the landing page becomes
     a full-screen terminal on every screen size (desktop and mobile alike).
     Entering expert mode stays a hidden easter egg. */
  function fullCliActive() { return root.classList.contains("cli-full"); }
  function updateCliFull() {
    root.classList.toggle("cli-full", isOn() && isCliHome());
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
        url: card.getAttribute("href") || ""
      });
    });
    return out;
  }

  /* =====================================================================
     Terminal chrome injection
     ===================================================================== */
  function injectTitlebar() {
    var header = document.querySelector("header.site-head");
    if (!header || header.querySelector(".term-titlebar")) return;
    var bar = document.createElement("div");
    bar.className = "term-titlebar";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML =
      '<span class="term-lights"><i></i><i></i><i></i></span>' +
      '<span class="term-path"><b>ctrl+click</b> — ~/ai-it-solutions — zsh</span>' +
      '<span class="term-dims">' + termCols() + "×24</span>";
    header.insertBefore(bar, header.firstChild);
  }
  function termCols() {
    return Math.max(48, Math.min(120, Math.floor(window.innerWidth / 9)));
  }

  var els = {}; // cached command-line elements

  function injectCommandLine() {
    if (document.querySelector(".term-chrome")) return;
    var chrome = document.createElement("div");
    chrome.className = "term-chrome";
    chrome.innerHTML =
      '<div class="term-output" id="termOutput" aria-live="polite"></div>' +
      '<form class="term-cmd" id="termForm" autocomplete="off">' +
        '<label class="term-prompt" for="termInput">⌃click <span class="term-caret2">❯</span></label>' +
        '<input class="term-input" id="termInput" type="text" spellcheck="false" ' +
               'autocapitalize="off" autocorrect="off" ' +
               'placeholder="type a command — try: help" ' +
               'aria-label="Ctrl+Click command line" />' +
        '<span class="term-hint"><kbd>help</kbd> for commands · <kbd>`</kbd> toggles</span>' +
      "</form>";
    document.body.appendChild(chrome);
    els.output = chrome.querySelector("#termOutput");
    els.form = chrome.querySelector("#termForm");
    els.input = chrome.querySelector("#termInput");

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = els.input.value;
      els.input.value = "";
      runCommand(value);
    });
    els.input.addEventListener("keydown", historyKeys);

    // Suggestion chips in the output run their command when tapped/clicked.
    els.output.addEventListener("click", function (e) {
      var chip = e.target.closest(".term-chip");
      if (!chip) return;
      runCommand(chip.dataset.cmd);
      if (!("ontouchstart" in window)) els.input.focus();
    });
  }

  /* ---- command output helpers ---- */
  function print(text, cls) {
    if (!els.output) return;
    var div = document.createElement("div");
    div.className = "line " + (cls || "out");
    if (cls === "raw-html") { div.className = "line out"; div.innerHTML = text; }
    else { div.textContent = text; }
    els.output.appendChild(div);
    openOutput();
    els.output.scrollTop = els.output.scrollHeight;
  }
  function printHTML(html) { print(html, "raw-html"); }
  /* Clickable suggestions — real tap targets so mobile users don't have to
     type. Each chip just runs its command through the same interpreter. */
  function printChips(chips) {
    if (!els.output) return;
    var wrap = document.createElement("div");
    wrap.className = "line term-chips";
    chips.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "term-chip";
      b.dataset.cmd = c.cmd;
      b.textContent = c.label || c.cmd;
      wrap.appendChild(b);
    });
    els.output.appendChild(wrap);
    openOutput();
  }
  function echoCommand(cmd) {
    var div = document.createElement("div");
    div.className = "line cmd";
    div.innerHTML = '<span class="p">⌃click ❯</span> ';
    div.appendChild(document.createTextNode(cmd));
    els.output.appendChild(div);
    openOutput();
  }
  function openOutput() { if (els.output) els.output.classList.add("is-open"); }
  function clearOutput() { if (els.output) { els.output.innerHTML = ""; els.output.classList.remove("is-open"); } }

  /* =====================================================================
     Command history (per session)
     ===================================================================== */
  var history = [];
  var histIdx = -1;
  function historyKeys(e) {
    if (e.key === "ArrowUp") {
      if (!history.length) return;
      e.preventDefault();
      histIdx = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      els.input.value = history[histIdx];
      moveCaretToEnd();
    } else if (e.key === "ArrowDown") {
      if (histIdx < 0) return;
      e.preventDefault();
      histIdx = histIdx + 1;
      if (histIdx >= history.length) { histIdx = -1; els.input.value = ""; }
      else { els.input.value = history[histIdx]; }
      moveCaretToEnd();
    } else if (e.key === "Escape") {
      els.input.blur();
    }
  }
  function moveCaretToEnd() {
    var v = els.input.value; els.input.value = ""; els.input.value = v;
  }

  /* =====================================================================
     Navigation helpers (scroll on the same page, else follow the link)
     ===================================================================== */
  function goSection(hashId, linkKey) {
    var el = document.getElementById(hashId);
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
      print("→ jumped to #" + hashId, "ok");
    } else {
      print("→ opening " + LINKS[linkKey], "ok");
      window.location.href = LINKS[linkKey];
    }
  }
  function openExternal(url, label) {
    print("→ opening " + label + " in a new tab", "ok");
    window.open(url, "_blank", "noopener");
  }

  /* =====================================================================
     The command interpreter
     ===================================================================== */
  var COMMANDS = {
    help: {
      desc: "list everything you can do here",
      run: function () {
        print("available commands", "head");
        var rows = [
          ["help", "show this list"],
          ["ls", "list all services"],
          ["business", "list business services"],
          ["personal", "list personal services"],
          ["open <name>", "open a service (e.g. open networking)"],
          ["blog", "read the hidden blog"],
          ["contact", "how to get in touch"],
          ["schedule", "book a discussion"],
          ["message", "send a message"],
          ["about", "what ctrl+click does"],
          ["whoami", "the ⌃click persona"],
          ["clear", "clear this output"],
          ["exit", "leave expert mode (back to the normal site)"]
        ];
        rows.forEach(function (r) {
          print("  " + pad(r[0], 14) + r[1], "out");
        });
      }
    },
    ls: {
      desc: "list services",
      run: function (args) {
        var svc = readServices();
        if (!svc.length) {
          print("services live on the home page.", "out");
          goSection("__none__", "business");
          return;
        }
        print("total " + svc.length, "out");
        svc.forEach(function (s) {
          print("  " + pad(s.slug, 26) + s.title, "ok");
        });
        print("", "out");
        print("open one with:  open <name>", "out");
        printChips(svc.map(function (s) {
          return { cmd: "open " + s.slug, label: s.slug };
        }));
      }
    },
    open: {
      desc: "open a service",
      run: function (args) {
        var q = (args.join(" ") || "").toLowerCase().trim();
        if (!q) { print("usage: open <service>   (try: ls)", "err"); return; }
        var svc = readServices();
        if (!svc.length) { // not on the landing page — go there with a hint
          print("services live on the home page — heading there…", "out");
          window.location.href = LINKS.business;
          return;
        }
        var hit = svc.filter(function (s) {
          return s.slug === q || s.slug.indexOf(q) > -1 || s.title.toLowerCase().indexOf(q) > -1;
        })[0];
        if (!hit) { print("no service matches \"" + q + "\". try: ls", "err"); return; }
        // Each service now has its own page; open it directly.
        var url = hit.url || ("/services/" + hit.slug + "/");
        print("→ opening " + hit.slug + " …", "ok");
        window.location.href = url;
      }
    },
    business: { desc: "list business services", run: function () { if (fullCliActive()) listCategory("#businessServicesGrid .card[data-slug]", "business services", "business"); else goSection("business", "business"); } },
    personal: { desc: "list personal services", run: function () { if (fullCliActive()) listCategory("#personalServicesGrid .card[data-slug]", "personal services", "personal"); else goSection("personal", "personal"); } },
    contact: {
      desc: "how to get in touch",
      run: function () {
        // Only the full-screen CLI hides the contact section; there we bring the
        // details into the terminal. Otherwise scroll to the section as before.
        if (!fullCliActive()) { goSection("contact", "contact"); return; }
        print("get in touch", "head");
        print("send a message or book a call — we respond quickly.", "out");
        print("", "out");
        print("  " + pad("schedule", 12) + "book a discussion", "ok");
        print("  " + pad("message", 12) + "send us a message", "ok");
        print("", "out");
        printChips([
          { cmd: "schedule", label: "schedule" },
          { cmd: "message", label: "message" }
        ]);
      }
    },
    blog:     { desc: "open the blog", run: function () { print("→ opening the hidden blog", "ok"); window.location.href = LINKS.blog; } },
    home:     { desc: "go home", run: function () { window.location.href = LINKS.home; } },
    schedule: { desc: "book a discussion", run: function () { openExternal(LINKS.schedule, "scheduling"); } },
    message:  { desc: "send a message", run: function () { openExternal(LINKS.message, "the message form"); } },
    about: {
      desc: "what we do",
      run: function () {
        print("ctrl+click — AI & IT Solutions  (formerly Maggio Consulting)", "head");
        print("On a Mac, control-click opens the menu most people never see:", "out");
        print("more options, more power, one click away. That's what we do for", "out");
        print("people and businesses — AI adoption, secure networking, reliable", "out");
        print("infrastructure, collaboration tools, and everyday tech that just works.", "out");
      }
    },
    whoami: {
      desc: "the persona",
      run: function () {
        print("⌃click · admin", "ok");
        print("the user who posts and maintains everything here. more options, more power.", "out");
      }
    },
    clear: { desc: "clear output", run: function () { clearOutput(); } },
    hidden: {
      desc: "easter egg hint",
      run: function () {
        print("psst — the mouse has secrets too.", "head");
        print("control-click (right-click) the ⌃click persona or the site title", "out");
        print("to open the hidden menu. that's the whole idea.", "out");
      }
    },
    sudo: { desc: "", run: function () { print("nice try. you already have admin here — you're ⌃click. 😉", "err"); } },
    exit: { desc: "leave expert mode", run: function () { print("leaving expert mode…", "ok"); setTimeout(function () { setMode(false); }, 150); } }
  };
  // aliases
  COMMANDS.normal = COMMANDS.exit;
  COMMANDS.gui = COMMANDS.exit;
  COMMANDS.quit = COMMANDS.exit;
  COMMANDS["?"] = COMMANDS.help;
  COMMANDS.dir = COMMANDS.ls;
  COMMANDS.cat = COMMANDS.open;

  function pad(s, n) {
    s = String(s);
    while (s.length < n) s += " ";
    return s;
  }

  /* List one category's services in the terminal, with clickable open chips.
     Off the landing page (e.g. the blog) the cards aren't here, so fall back
     to navigating to that section on the home page. */
  function listCategory(selector, label, linkKey) {
    var svc = readServicesIn(selector);
    if (!svc.length) {
      print("→ opening " + label + " on the home page…", "out");
      window.location.href = LINKS[linkKey];
      return;
    }
    print(label + " — " + svc.length + " available", "head");
    svc.forEach(function (s) {
      print("  " + pad(s.slug, 26) + s.title, "ok");
    });
    print("", "out");
    print("open one:  open <name>   (e.g. open " + svc[0].slug + ")", "out");
    printChips(svc.map(function (s) {
      return { cmd: "open " + s.slug, label: s.slug };
    }));
  }

  /* Render a service's detail copy as terminal text (a "man page"), reading the
     catalogue the landing page exposes on window.CTRLCLICK_SERVICES. Returns
     false if the data isn't available, so the caller can fall back to the sheet. */
  function renderServiceDetail(slug) {
    var list = window.CTRLCLICK_SERVICES;
    if (!list || !list.length) return false;
    var svc = list.filter(function (s) { return s.slug === slug; })[0];
    if (!svc || !svc.detail) return false;

    print("man " + (svc.title || slug), "head");
    if (svc.chip) print("category: " + svc.chip, "out");
    if (svc.blurb) print(svc.blurb, "out");

    var tmp = document.createElement("div");
    tmp.innerHTML = svc.detail;
    htmlToTerminal(tmp, svc.title);

    print("", "out");
    print("book it:  schedule   ·   back to the list:  ls / business / personal", "out");
    printChips([
      { cmd: "schedule", label: "schedule" },
      { cmd: "message", label: "message" },
      { cmd: "ls", label: "ls" }
    ]);
    return true;
  }

  /* Walk the detail HTML and print terminal-friendly lines: headings become
     "## " rows, list items become "- " rows, paragraphs print as-is. The
     leading <h2> just repeats the title, so it's skipped. */
  function htmlToTerminal(node, title) {
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var child = kids[i];
      if (child.nodeType === 3) {                 // text node
        var t = child.textContent.replace(/\s+/g, " ").trim();
        if (t) print(t, "out");
        continue;
      }
      if (child.nodeType !== 1) continue;          // skip comments etc.
      var tag = child.tagName.toLowerCase();
      var text = child.textContent.replace(/\s+/g, " ").trim();
      if (tag === "h2") {
        if (title && text === title.trim()) continue; // avoid repeating the title
        print("", "out");
        print("## " + text, "ok");
      } else if (tag === "h3" || tag === "h4") {
        print("", "out");
        print("## " + text, "ok");
      } else if (tag === "p") {
        if (text) print(text, "out");
      } else if (tag === "ul" || tag === "ol") {
        child.querySelectorAll("li").forEach(function (li) {
          print("  - " + li.textContent.replace(/\s+/g, " ").trim(), "out");
        });
      } else if (tag === "li") {
        print("  - " + text, "out");
      } else {
        htmlToTerminal(child, title);              // recurse through wrappers
      }
    }
  }

  function runCommand(raw) {
    var line = (raw || "").trim();
    if (!line) return;
    echoCommand(line);
    if (history[history.length - 1] !== line) history.push(line);
    histIdx = -1;

    var parts = line.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1);

    // Bare service name works like `open <name>`
    var svc = readServices();
    var direct = svc.filter(function (s) { return s.slug === name; })[0];

    if (COMMANDS[name]) {
      COMMANDS[name].run(args);
    } else if (direct) {
      COMMANDS.open.run([name]);
    } else {
      print("command not found: " + name, "err");
      print("type 'help' to see what's available.", "out");
    }
    els.output.scrollTop = els.output.scrollHeight;
  }

  /* =====================================================================
     Boot banner (shown once when expert mode turns on)
     ===================================================================== */
  var CARET_ART = [
    "         /\\",
    "        /  \\",
    "       /    \\",
    "      /  /\\  \\      ctrl+click",
    "     /  /  \\  \\     AI & IT Solutions",
    "    /__/    \\__\\"
  ];
  function boot() {
    if (!els.output) return;
    clearOutput();
    var pre = document.createElement("div");
    pre.className = "line banner";
    pre.textContent = CARET_ART.join("\n");
    els.output.appendChild(pre);
    openOutput();
    print("", "out");
    print("Enterprise-Level IT, Without the Enterprise-Level Price Tag", "head");
    print("", "out");
    print("ctrl+click — a shell for everything we do.", "ok");
    print("// formerly Maggio Consulting", "out");
    print("", "out");
    print("On a Mac, a control-click opens the menu most people never see:", "out");
    print("more options, more power, one click away. So does this prompt.", "out");
    print("", "out");
    print("suggestions", "head");
    printChips([
      { cmd: "help", label: "help" },
      { cmd: "business", label: "business" },
      { cmd: "personal", label: "personal" },
      { cmd: "contact", label: "contact" },
      { cmd: "schedule", label: "schedule" }
    ]);
    print("", "out");
    print("type a command below · 'exit' returns to the normal site · ↑ for history", "out");
    els.output.scrollTop = 0;
  }

  /* =====================================================================
     Mode switching
     ===================================================================== */
  function setMode(on, opts) {
    opts = opts || {};
    root.classList.toggle("expert", on);
    updateCliFull();
    persist(on);
    syncToggle();
    if (on) {
      injectTitlebar();
      if (!opts.silent) {
        boot();
        // focus the command line so it feels alive (but not on tiny touch keyboards)
        if (!("ontouchstart" in window)) setTimeout(function () { els.input && els.input.focus(); }, 60);
      }
    } else {
      clearOutput();
    }
  }

  function syncToggle() {
    document.querySelectorAll(".expert-toggle").forEach(function (btn) {
      var on = isOn();
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.title = on ? "Return to the normal site" : "Switch to the CLI (terminal) view";
    });
  }

  /* =====================================================================
     Wire up
     ===================================================================== */
  function init() {
    injectCommandLine();

    document.querySelectorAll(".expert-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () { setMode(!isOn()); });
    });

    // Global shortcut: backtick toggles expert mode (unless typing in a field).
    document.addEventListener("keydown", function (e) {
      if (e.key !== "`" || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      e.preventDefault();
      setMode(!isOn());
    });

    window.addEventListener("resize", function () {
      var dims = document.querySelector(".term-titlebar .term-dims");
      if (dims) dims.textContent = termCols() + "×24";
    });

    // The head script may already have added .expert (persisted). Reflect it.
    if (isOn()) {
      injectTitlebar();
      updateCliFull();
      syncToggle();
      // The terminal IS the page here, so a returning visitor needs the
      // banner/suggestions drawn on load, not just on toggle.
      if (fullCliActive()) {
        boot();
        if (!("ontouchstart" in window)) setTimeout(function () { els.input && els.input.focus(); }, 60);
      }
    } else {
      syncToggle();
    }
  }

  /* Public API so the hidden context menu (or anything else) can drive the
     mode without needing a visible header toggle. */
  window.CtrlClickExpert = {
    toggle: function () { setMode(!isOn()); },
    enable: function () { setMode(true); },
    disable: function () { setMode(false); },
    isOn: isOn
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
