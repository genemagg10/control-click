/* =====================================================================
   Ctrl+Click — native contact form
   Posts to a configurable endpoint (Formspree in production). On
   localhost, with no endpoint configured, it posts to the local mock
   mailer so the send can be exercised without a real inbox.
   ===================================================================== */
(function () {
  "use strict";

  var MOCK_ENDPOINT = "http://127.0.0.1:8787/contact";

  function config() {
    return window.CTRLCLICK_CONTACT || {};
  }

  function endpoint() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    if (params && params.get("contactEndpoint")) return params.get("contactEndpoint");
    var configured = config().endpoint;
    if (configured) return configured;
    var host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return MOCK_ENDPOINT;
    return "";
  }

  function currentView() {
    var root = document.documentElement;
    if (root.classList.contains("expert")) return "expert";
    if (root.classList.contains("individual")) return "individual";
    return "team";
  }

  function normalizeErrors(errors) {
    if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};
    var out = {};
    Object.keys(errors).forEach(function (key) {
      var value = errors[key];
      if (Array.isArray(value)) out[key] = value.join(" ");
      else if (value != null) out[key] = String(value);
    });
    return out;
  }

  function submit(fields) {
    var validate = window.CtrlClickContactValidate;
    var parsed = validate ? validate.validate(fields || {}) : { ok: true, errors: {}, value: fields || {}, honeypot: false };
    if (!parsed.honeypot && !parsed.ok) {
      return Promise.resolve({
        ok: false,
        error: "Please fix the highlighted fields.",
        errors: parsed.errors
      });
    }

    var url = endpoint();
    if (!url) {
      return Promise.resolve({
        ok: false,
        error: "This form isn’t connected yet. Call (510) 467-0217 and a person will pick up."
      });
    }

    var payload = parsed.honeypot ? {
      name: String((fields && fields.name) || ""),
      email: String((fields && fields.email) || ""),
      phone: String((fields && fields.phone) || ""),
      comment: String((fields && fields.comment) || ""),
      view: currentView(),
      _gotcha: fields && fields._gotcha ? fields._gotcha : "filled"
    } : {
      name: parsed.value.name,
      email: parsed.value.email,
      phone: parsed.value.phone,
      comment: parsed.value.comment,
      view: parsed.value.view || currentView(),
      _gotcha: "",
      _subject: "Ctrl+Click inquiry from " + parsed.value.name,
      _replyto: parsed.value.email
    };

    return fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok && data && data.ok !== false && !data.error) return { ok: true };
        var errors = normalizeErrors(data && data.errors);
        var message = (data && typeof data.error === "string" && data.error) ||
          (res.status === 429
            ? "Too many messages just now. Please wait a few minutes, or call (510) 467-0217."
            : "That didn’t go through. Please try again, or call (510) 467-0217.");
        return { ok: false, error: message, errors: errors };
      });
    }).catch(function () {
      return {
        ok: false,
        error: "We couldn’t reach the form just now. Check your connection, or call (510) 467-0217."
      };
    });
  }

  function fieldEls(form) {
    return {
      name: form.querySelector("#contact-name"),
      email: form.querySelector("#contact-email"),
      phone: form.querySelector("#contact-phone"),
      comment: form.querySelector("#contact-comment"),
      gotcha: form.querySelector("#contact-gotcha")
    };
  }

  function showFieldError(input, message) {
    if (!input) return;
    var error = document.getElementById(input.getAttribute("aria-describedby"));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  }

  function clearErrors(form) {
    ["name", "email", "phone", "comment"].forEach(function (key) {
      showFieldError(fieldEls(form)[key], "");
    });
  }

  function readFields(form) {
    var els = fieldEls(form);
    return {
      name: els.name ? els.name.value : "",
      email: els.email ? els.email.value : "",
      phone: els.phone ? els.phone.value : "",
      comment: els.comment ? els.comment.value : "",
      _gotcha: els.gotcha ? els.gotcha.value : "",
      view: currentView()
    };
  }

  function setStatus(form, message, isError) {
    var status = document.getElementById("contactStatus");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", !!isError);
    status.classList.toggle("is-sent", message === "Message sent.");
  }

  function setBusy(form, busy) {
    var button = form.querySelector("#contactSubmit");
    form.setAttribute("aria-busy", busy ? "true" : "false");
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name === "_gotcha") return;
      el.disabled = busy;
    });
    if (button) button.textContent = busy ? "Sending…" : "Send message";
  }

  function showSuccess(form, email) {
    var success = document.getElementById("contactSuccess");
    var text = document.getElementById("contactSuccessText");
    form.hidden = true;
    if (text) {
      text.textContent = "Thanks. We got your note" +
        (email ? ", and we’ll write back at " + email : "") +
        ". A real person reads these. We make teams stronger, not smaller — and if a short chat would help, the first half hour is free.";
    }
    if (success) {
      success.hidden = false;
      success.focus();
    }
    setStatus(form, "Message sent.");
  }

  function showForm(form) {
    var success = document.getElementById("contactSuccess");
    form.hidden = false;
    if (success) success.hidden = true;
    form.reset();
    clearErrors(form);
    setStatus(form, "");
    var name = document.getElementById("contact-name");
    if (name) name.focus();
  }

  function validateField(key, value) {
    var api = window.CtrlClickContactValidate;
    if (!api) return { ok: true, value: value };
    return api.checkField(key, value);
  }

  function bindForm(form) {
    var touched = {};

    function paint(key, force) {
      var els = fieldEls(form);
      var input = els[key];
      if (!input) return;
      if (!force && !touched[key]) return;
      var result = validateField(key, input.value);
      showFieldError(input, result.ok ? "" : result.error);
    }

    ["name", "email", "phone", "comment"].forEach(function (key) {
      var input = fieldEls(form)[key];
      if (!input) return;
      input.addEventListener("blur", function () {
        touched[key] = true;
        paint(key, true);
      });
      input.addEventListener("input", function () {
        if (touched[key]) paint(key, true);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ["name", "email", "phone", "comment"].forEach(function (key) { touched[key] = true; });
      var fields = readFields(form);
      var api = window.CtrlClickContactValidate;
      var parsed = api ? api.validate(fields) : { ok: true, errors: {}, honeypot: false, value: fields };
      if (!parsed.honeypot) {
        Object.keys(parsed.errors || {}).forEach(function (key) {
          showFieldError(fieldEls(form)[key], parsed.errors[key]);
        });
        ["name", "email", "phone", "comment"].forEach(function (key) {
          if (!parsed.errors[key]) showFieldError(fieldEls(form)[key], "");
        });
        if (!parsed.ok) {
          setStatus(form, "Please fix the highlighted fields.", true);
          var first = form.querySelector("[aria-invalid='true']");
          if (first) first.focus();
          return;
        }
      }

      setBusy(form, true);
      setStatus(form, "Sending…");
      submit(fields).then(function (result) {
        setBusy(form, false);
        if (result.ok) {
          showSuccess(form, parsed.value && parsed.value.email);
          return;
        }
        if (result.errors) {
          Object.keys(result.errors).forEach(function (key) {
            showFieldError(fieldEls(form)[key], result.errors[key]);
          });
        }
        setStatus(form, result.error || "That didn’t go through. Please try again.", true);
      });
    });

    var again = document.getElementById("contactAgain");
    if (again) again.addEventListener("click", function () { showForm(form); });
  }

  function focusForm() {
    var card = document.getElementById("contact");
    var name = document.getElementById("contact-name");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (card) card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (name) name.focus();
  }

  function applyIntent() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (!params || params.get("intent") !== "coffee") return;
    var comment = document.getElementById("contact-comment");
    if (comment && !comment.value) {
      comment.value = "I’d like to save a seat at AI + Coffee.";
    }
  }

  function bindJumps() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest("a.js-send-message");
      if (!link) return;
      if (document.documentElement.classList.contains("expert") &&
          window.CtrlClickExpert && window.CtrlClickExpert.message) {
        e.preventDefault();
        window.CtrlClickExpert.message();
        return;
      }
      if (document.getElementById("contactForm")) {
        e.preventDefault();
        focusForm();
      }
    });
  }

  function init() {
    bindJumps();
    var form = document.getElementById("contactForm");
    if (!form) return;
    applyIntent();
    var url = endpoint();
    if (url) form.setAttribute("action", url);
    bindForm(form);
  }

  window.CtrlClickContact = {
    submit: submit,
    endpoint: endpoint,
    focus: focusForm
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
