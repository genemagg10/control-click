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
      '<span class="term-path"><b>ctrl+click</b> — ' + esc(termDir()) + ' — zsh</span>' +
      '<span class="term-dims">' + termCols() + "×24</span>";
    header.insertBefore(bar, header.firstChild);
  }
  /* The working-directory shown in the title bar reflects the current page. */
  function termDir() {
    var p = (window.location.pathname || "/").replace(/index\.html?$/i, "").replace(/\/+$/, "");
    return p ? "~/ai-it-solutions" + p : "~/ai-it-solutions";
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
          ["glossary", "the plain-English tech glossary"],
          ["email", "email settings for every provider"],
          ["faq", "questions people actually ask"],
          ["coffee", "AI + Coffee — our free monthly meetup"],
          ["blog", "stories & notes from ⌃click"],
          ["contact", "how to get in touch"],
          ["schedule", "book a discussion"],
          ["message", "send a message"],
          ["about", "what ctrl+click does"],
          ["whoami", "the ⌃click persona"],
          ["clear", "clear this output"],
          ["exit", "leave the CLI (back to the normal site)"]
        ];
        rows.forEach(function (r) {
          print("  " + pad(r[0], 14) + r[1], "out");
        });
        print("", "out");
        print("every page here loads inside the terminal. try one:", "out");
        printChips([
          { cmd: "glossary", label: "glossary" },
          { cmd: "email", label: "email" },
          { cmd: "faq", label: "faq" },
          { cmd: "coffee", label: "coffee" },
          { cmd: "blog", label: "blog" }
        ]);
      }
    },
    ls: {
      desc: "list services",
      run: function (args) {
        var svc = readServices();
        if (!svc.length) {
          openOnHome("ls", "the service list");
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
        if (!svc.length) {
          // Service cards live on home. Hand off so `open <slug>` actually
          // runs there (same sessionStorage path as ls / business / personal),
          // instead of dumping the user on the home boot banner.
          openOnHome("open " + q, q);
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
    blog:     { desc: "stories from ⌃click", run: function () { navTo("blog", "the stories"); } },
    glossary: { desc: "plain-English glossary", run: function () { navTo("glossary", "the glossary"); } },
    email:    { desc: "email settings", run: function () { navTo("email", "email settings"); } },
    faq:      { desc: "questions & answers", run: function () { navTo("faq", "the FAQ"); } },
    coffee:   { desc: "AI + Coffee meetup", run: function () { navTo("coffee", "AI + Coffee"); } },
    home:     { desc: "go home", run: function () { navTo("home", "home"); } },
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
  COMMANDS.man = COMMANDS.open;
  COMMANDS["email-settings"] = COMMANDS.email;
  COMMANDS.mail = COMMANDS.email;
  COMMANDS.terms = COMMANDS.glossary;
  COMMANDS.events = COMMANDS.coffee;
  COMMANDS.stories = COMMANDS.blog;

  function pad(s, n) {
    s = String(s);
    while (s.length < n) s += " ";
    return s;
  }

  /* List one category's services in the terminal, with clickable open chips.
     Off the landing page (e.g. the glossary) the service cards aren't in the
     DOM, so go home and run the same command there — the list still lands in
     the terminal, never as the rich site. */
  function listCategory(selector, label, linkKey) {
    var svc = readServicesIn(selector);
    if (!svc.length) {
      openOnHome(linkKey, label);
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
