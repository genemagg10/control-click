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

  /* =====================================================================
     In-terminal page rendering
     Every content page (glossary, faq, email settings, services, blog, …)
     is rendered as terminal text instead of as its rich HTML. The copy is
     read straight from the page's own DOM — no fetch — so it works offline
     and stays in sync with the site. Chrome that makes no sense as text
     (nav, forms, SVG icons, the reading-level control, CTAs we re-offer as
     commands) is skipped.
     ===================================================================== */

  /* Structural wrappers whose whole subtree we drop when flattening a page. */
  var SKIP_SEL = ".level-switch, .term-chrome, .term-titlebar, .back-link, " +
    ".crumbs, .toc, .rss-link, .svc-cta, .svc-more, .post-footer, .hero-actions, " +
    ".svc-head .svc-icon, form, nav, footer";

  function skipNode(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "svg" || tag === "button" ||
        tag === "form" || tag === "footer" || tag === "nav" || tag === "noscript") return true;
    if (el.matches && el.matches(SKIP_SEL)) return true;
    if (el.getAttribute && el.getAttribute("aria-hidden") === "true" &&
        !el.querySelector("h1,h2,h3,h4,p,li,dt,dd,td")) return true;
    return false;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function resolveHref(href) {
    try { return new URL(href, window.location.href).href; } catch (e) { return href; }
  }

  /* Serialise inline content, keeping cross-page links clickable (they load
     the target, which then renders itself in the terminal) and dropping the
     rest to plain text. Bare in-page "#anchor" links become plain text since
     there's nothing to scroll to in terminal output. */
  function inlineHTML(node) {
    var out = "";
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c.nodeType === 3) { out += esc(c.textContent); continue; }
      if (c.nodeType !== 1) continue;
      var tag = c.tagName.toLowerCase();
      if (tag === "svg" || tag === "script" || tag === "style") continue;
      if (tag === "br") { out += " "; continue; }
      if (tag === "a") {
        var href = c.getAttribute("href") || "";
        var rawLabel = clean(c.textContent);
        var label = esc(rawLabel);
        // Drop bare in-page anchor "#" links (e.g. the glossary's per-term
        // permalinks): there's nothing to jump to in terminal output, and the
        // lone "#" is just noise.
        var isAnchorLink = /(^|\s)anchor(\s|$)/.test(c.className || "") || /^[#¶§]?$/.test(rawLabel);
        if (!href || href.charAt(0) === "#") { if (!isAnchorLink) out += label; continue; }
        var external = /^(https?:|mailto:|tel:)/i.test(href);
        out += '<a href="' + esc(resolveHref(href)) + '"' +
          (external ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";
      } else {
        out += inlineHTML(c); // b, em, strong, code, span, etc. → their text
      }
    }
    return out;
  }

  /* Print a line that may contain inline HTML (links), with an optional
     literal text prefix (indentation / bullet). */
  function printRich(prefix, html, cls) {
    if (!els.output) return;
    var div = document.createElement("div");
    div.className = "line " + (cls || "out");
    div.innerHTML = esc(prefix || "") + html;
    els.output.appendChild(div);
    openOutput();
    els.output.scrollTop = els.output.scrollHeight;
  }

  /* Print a pre-formatted block (tables, code) that scrolls sideways rather
     than wrapping, so columns stay aligned on narrow screens. */
  function printPre(text, cls) {
    if (!els.output) return;
    var div = document.createElement("div");
    div.className = "line pre " + (cls || "out");
    div.textContent = text;
    els.output.appendChild(div);
    openOutput();
    els.output.scrollTop = els.output.scrollHeight;
  }

  /* Walk arbitrary page HTML and print terminal-friendly lines. */
  function htmlToTerminal(node, title) {
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var child = kids[i];
      if (child.nodeType === 3) {
        var t = clean(child.textContent);
        if (t) print(t, "out");
        continue;
      }
      if (child.nodeType !== 1) continue;
      if (skipNode(child)) continue;
      var tag = child.tagName.toLowerCase();
      var text = clean(child.textContent);
      switch (tag) {
        case "h1":
          if (title && text === clean(title)) break; // title already shown
          print("", "out"); print("# " + text, "head"); break;
        case "h2":
          print("", "out"); print("## " + text, "ok"); break;
        case "h3": case "h4": case "h5": case "h6":
          print("", "out"); print("### " + text, "ok"); break;
        case "p":
          if (text) printRich("", inlineHTML(child), "out"); break;
        case "ul": case "ol":
          eachLi(child); break;
        case "li":
          printRich("  - ", inlineHTML(child), "out"); break;
        case "dl":
          walkDl(child); break;
        case "details":
          walkDetails(child); break;
        case "table":
          walkTable(child); break;
        case "blockquote":
          walkQuote(child); break;
        case "pre":
          print("", "out");
          child.textContent.replace(/\s+$/, "").split("\n").forEach(function (l) {
            printPre("    " + l, "out");
          });
          break;
        default:
          htmlToTerminal(child, title); // recurse through wrappers (divs, sections…)
      }
    }
  }

  /* List items that are direct children of this list only (avoid double-printing
     items from a nested list, which the recursive walk would reach anyway). */
  function eachLi(list) {
    for (var i = 0; i < list.children.length; i++) {
      var li = list.children[i];
      if (li.tagName && li.tagName.toLowerCase() === "li") {
        printRich("  - ", inlineHTML(li), "out");
      }
    }
  }

  /* Definition lists (the glossary): term then its definition. querySelectorAll
     returns dt/dd in document order even when wrapped in `.term` divs. */
  function walkDl(dl) {
    dl.querySelectorAll("dt, dd").forEach(function (n) {
      var isTerm = n.tagName.toLowerCase() === "dt";
      if (!clean(n.textContent)) return;
      if (isTerm) { print("", "out"); printRich("▸ ", inlineHTML(n), "ok"); }
      else printRich("   ", inlineHTML(n), "out");
    });
  }

  /* <details>/<summary> accordions (the FAQ): question then answer. */
  function walkDetails(det) {
    var sum = det.querySelector("summary");
    print("", "out");
    if (sum && clean(sum.textContent)) printRich("Q: ", inlineHTML(sum), "ok");
    var body = det.querySelector(".faq-a") || det;
    body.querySelectorAll("p").forEach(function (p) {
      if (clean(p.textContent)) printRich("   ", inlineHTML(p), "out");
    });
  }

  function walkQuote(bq) {
    var ps = bq.querySelectorAll("p");
    if (ps.length) {
      ps.forEach(function (p) { if (clean(p.textContent)) printRich("  | ", inlineHTML(p), "out"); });
    } else if (clean(bq.textContent)) {
      printRich("  | ", inlineHTML(bq), "out");
    }
  }

  /* Tables (email settings) → aligned monospace columns in a scrolling block. */
  function walkTable(tbl) {
    var data = [];
    tbl.querySelectorAll("tr").forEach(function (tr) {
      var row = [];
      tr.querySelectorAll("th, td").forEach(function (c) { row.push(clean(c.textContent)); });
      if (row.length) data.push(row);
    });
    if (!data.length) return;
    var cols = 0;
    data.forEach(function (r) { cols = Math.max(cols, r.length); });
    var widths = [];
    for (var c = 0; c < cols; c++) {
      widths[c] = 0;
      data.forEach(function (r) { if (r[c] && r[c].length > widths[c]) widths[c] = r[c].length; });
    }
    print("", "out");
    data.forEach(function (r, ri) {
      var line = "  ";
      for (var c = 0; c < cols; c++) line += pad(r[c] || "", widths[c] + 2);
      printPre(line.replace(/\s+$/, ""), ri === 0 ? "ok" : "out");
    });
  }

  /* Identify the current page's content and render it into the terminal.
     The home page is the shell's "home" — it shows the boot banner instead. */
  function renderCurrentPage() {
    if (isCliHome()) { boot(); return; }
    var main = document.querySelector("main.container") || document.querySelector("main");
    if (!main) { boot(); return; }
    if (main.querySelector(".post-card")) { renderBlogIndex(main); return; }
    var article = main.querySelector("article");
    var host = article || main;
    var h1 = host.querySelector("h1");
    var title = h1 ? clean(h1.textContent) : clean((document.title || "").split(/[·|—]/)[0]);
    renderDoc(host, title);
  }

  function renderDoc(host, title) {
    clearOutput();
    echoCommand("cat ." + pagePath());
    if (title) print(title, "head");
    htmlToTerminal(host, title);
    print("", "out");
    print("more options, more power. navigate with a command below.", "out");
    printChips(navChips());
    if (els.output) els.output.scrollTop = 0;
  }

  function renderBlogIndex(main) {
    clearOutput();
    echoCommand("ls ./blog");
    print("stories from ⌃click", "head");
    print("", "out");
    main.querySelectorAll(".post-card").forEach(function (card) {
      var a = card.querySelector("h2 a");
      var date = card.querySelector(".post-date");
      var p = card.querySelector("p");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      printRich("▸ ", '<a href="' + esc(resolveHref(href)) + '">' + esc(clean(a.textContent)) + "</a>", "ok");
      if (date && clean(date.textContent)) print("   " + clean(date.textContent), "out");
      if (p && clean(p.textContent)) print("   " + clean(p.textContent), "out");
      print("", "out");
    });
    print("open a story by clicking its title. or navigate:", "out");
    printChips(navChips());
    if (els.output) els.output.scrollTop = 0;
  }

  /* The path label used in the prompt echo, e.g. "/glossary". */
  function pagePath() {
    var p = (window.location.pathname || "/").replace(/index\.html?$/i, "").replace(/\/+$/, "");
    return p || "/";
  }

  /* Standard navigation chips offered at the foot of a rendered page. */
  function navChips() {
    return [
      { cmd: "home", label: "home" },
      { cmd: "business", label: "business" },
      { cmd: "personal", label: "personal" },
      { cmd: "glossary", label: "glossary" },
      { cmd: "faq", label: "faq" },
      { cmd: "schedule", label: "schedule" }
    ];
  }

  /* Go to the home terminal and run a command there once it boots (e.g. `ls`,
     `business`). The command is stashed in sessionStorage (not the URL, so no
     stray hash lingers) and executed by runPendingCommand() on arrival, so
     service browsing works from any page while always landing in the terminal. */
  var PENDING_KEY = "ctrlclick:pendingCmd";
  function openOnHome(cmd, label) {
    print("→ opening " + (label || cmd) + " on the home terminal…", "ok");
    try { sessionStorage.setItem(PENDING_KEY, cmd); } catch (e) {}
    window.location.href = LINKS.home;
  }
  function runPendingCommand() {
    var cmd = null;
    try { cmd = sessionStorage.getItem(PENDING_KEY); sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
    if (cmd) runCommand(cmd);
  }

  /* Navigate to a named content page. If we're already on it, just re-render;
     otherwise load it — expert mode persists, so it renders itself on arrival. */
  function navTo(key, label) {
    var url = LINKS[key];
    if (!url) { print("no such page: " + key, "err"); return; }
    var target, here;
    try { target = new URL(url, window.location.href).pathname.replace(/\/+$/, ""); } catch (e) { target = url; }
    here = (window.location.pathname || "").replace(/\/+$/, "");
    if (target === here) { renderCurrentPage(); return; }
    print("→ opening " + (label || key) + " …", "ok");
    window.location.href = url;
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
    print("AI That Makes Your Team Better. Not Smaller.", "head");
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

  /* What the terminal shows when it opens: the home page shows the boot banner;
     any other page renders its own content as terminal text. */
  function bootScreen() {
    if (!els.output) return;
    if (isCliHome()) boot();
    else renderCurrentPage();
    runPendingCommand();
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
        bootScreen();
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
      // banner (home) or the page's content (everywhere else) drawn on load,
      // not just on toggle.
      if (fullCliActive()) {
        bootScreen();
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
