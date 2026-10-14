import process from "node:process"; const global = globalThis;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// assets/contact-validate.js
var require_contact_validate = __commonJS({
  "assets/contact-validate.js"(exports, module) {
    (function(root, factory) {
      var api = factory();
      if (typeof module === "object" && module.exports) module.exports = api;
      if (root) root.CtrlClickContactValidate = api;
    })(typeof globalThis !== "undefined" ? globalThis : exports, function() {
      var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var PHONE_CHARS = /^[0-9+().\-\s]+$/;
      var FIELDS = {
        name: { required: true, max: 120, label: "Name" },
        email: { required: true, max: 254, label: "Email", type: "email" },
        phone: { required: false, max: 40, label: "Phone", type: "phone" },
        organization: { required: false, max: 160, label: "Organization" },
        message: { required: true, max: 5e3, label: "Message" }
      };
      var COMMENT_PROMPTS = {
        individual: "What can we take off your plate?",
        business: "What should your team be able to do?",
        family: "What should we sort out at home?",
        nonprofit: "What would make the team you have more capable?"
      };
      var ABOUT_LABELS = {
        individual: "Individual",
        business: "A business",
        family: "A family",
        nonprofit: "A nonprofit"
      };
      function checkField(key, raw) {
        var spec = FIELDS[key];
        if (!spec) return { ok: false, error: "Unknown field.", value: "" };
        var value = String(raw == null ? "" : raw).replace(/\r\n/g, "\n").trim();
        if (!value) {
          if (!spec.required) return { ok: true, value: "" };
          if (key === "message") return { ok: false, error: "Tell us a little about what you need.", value: "" };
          return { ok: false, error: spec.label + " is required.", value: "" };
        }
        if (value.length > spec.max) {
          return { ok: false, error: spec.label + " is too long.", value };
        }
        if (spec.type === "email") {
          if (!EMAIL.test(value) || value.length > 254) {
            return { ok: false, error: "Enter an email address we can write back to.", value };
          }
        }
        if (spec.type === "phone") {
          var digits = value.replace(/\D/g, "");
          if (!PHONE_CHARS.test(value) || digits.length < 7 || digits.length > 15) {
            return { ok: false, error: "Use a phone number with digits, like (510) 467-0217.", value };
          }
        }
        return { ok: true, value };
      }
      function commentPrompt(about) {
        return COMMENT_PROMPTS[about] || "How can we help?";
      }
      function aboutLabel(about) {
        return ABOUT_LABELS[about] || "";
      }
      function wantsOrganization(about) {
        return about === "business" || about === "nonprofit";
      }
      function parseAbout(raw) {
        var value = String(raw == null ? "" : raw).trim().toLowerCase().replace(/\s+/g, " ");
        if (value === "business" || value === "a business" || value === "company" || value === "work" || value === "team") return "business";
        if (value === "family" || value === "a family" || value === "household" || value === "our family" || value === "home") return "family";
        if (value === "nonprofit" || value === "a nonprofit" || value === "non-profit" || value === "charity") return "nonprofit";
        if (value === "individual" || value === "me" || value === "just me") return "individual";
        return "";
      }
      function parseTeamAbout(raw) {
        var about = parseAbout(raw);
        if (about === "business" || about === "family" || about === "nonprofit") return about;
        return "";
      }
      function cleanView(raw) {
        var value = String(raw == null ? "" : raw).trim().toLowerCase();
        if (value === "individual" || value === "team" || value === "expert") return value;
        return "";
      }
      function honeypotFilled(input) {
        if (!input) return false;
        var trap = input._gotcha != null ? input._gotcha : input.gotcha;
        return String(trap == null ? "" : trap).trim().length > 0;
      }
      function validate(input) {
        input = input || {};
        var errors = {};
        var value = {};
        Object.keys(FIELDS).forEach(function(key) {
          var result = checkField(key, input[key]);
          value[key] = result.value;
          if (!result.ok) errors[key] = result.error;
        });
        value.view = cleanView(input.view);
        value.about = parseAbout(input.about);
        if (!value.about) errors.about = "Choose a business, a family, or a nonprofit.";
        if (!wantsOrganization(value.about)) {
          value.organization = "";
          delete errors.organization;
        }
        var keys = Object.keys(errors);
        return {
          ok: keys.length === 0,
          errors,
          value,
          honeypot: honeypotFilled(input)
        };
      }
      return {
        FIELDS,
        COMMENT_PROMPTS,
        checkField,
        cleanView,
        commentPrompt,
        aboutLabel,
        wantsOrganization,
        parseAbout,
        parseTeamAbout,
        honeypotFilled,
        validate
      };
    });
  }
});

// supabase/functions/_shared/contact-mail.js
var require_contact_mail = __commonJS({
  "supabase/functions/_shared/contact-mail.js"(exports, module) {
    "use strict";
    var RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
    function toAddress() {
      return String(process.env.CONTACT_TO_EMAIL || "g@maggio.xyz").trim();
    }
    function formatFrom(raw) {
      var value = String(raw == null || String(raw).trim() === "" ? "contact@maggio.xyz" : raw).trim();
      if (value.indexOf("<") !== -1 && value.indexOf(">") !== -1) return value;
      return "Ctrl+Click <" + value + ">";
    }
    function fromAddress() {
      return formatFrom(process.env.CONTACT_FROM_EMAIL || "contact@maggio.xyz");
    }
    function buildEmails(value) {
      var phone = value.phone || "(none)";
      var view = value.view || "(not set)";
      var to = toAddress();
      var from = fromAddress();
      return [
        {
          from,
          to,
          replyTo: value.email,
          subject: "Ctrl+Click inquiry from " + value.name,
          text: [
            "New note from the Ctrl+Click site.",
            "",
            "Name: " + value.name,
            "Email: " + value.email,
            "About: " + (value.about || "(not set)"),
            "Organization: " + (value.organization || "(none)"),
            "Phone: " + phone,
            "View: " + view,
            "",
            "Message:",
            value.message
          ].join("\n")
        },
        {
          from,
          to: value.email,
          replyTo: to,
          subject: "We got your note \u2014 Ctrl+Click",
          text: [
            "Hi " + value.name + ",",
            "",
            "Thanks for writing. A real person at Ctrl+Click has your note and will write back.",
            "We make teams stronger, not smaller. If a short conversation would help, the first half hour is free.",
            "",
            "\u2014 Gene, Ctrl+Click",
            "(510) 467-0217"
          ].join("\n")
        }
      ];
    }
    function toResendPayload(email) {
      return {
        from: email.from,
        to: [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text
      };
    }
    function sendWithResend(emails, options) {
      var apiKey = options && options.apiKey ? String(options.apiKey).trim() : "";
      var fetchImpl = options && options.fetch || global.fetch;
      if (!apiKey) return Promise.reject(new Error("missing RESEND_API_KEY"));
      if (typeof fetchImpl !== "function") return Promise.reject(new Error("fetch unavailable"));
      return fetchImpl(RESEND_BATCH_URL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emails.map(toResendPayload))
      }).then(function(res) {
        if (!res || !res.ok) {
          var status = res && res.status ? res.status : 0;
          return Promise.reject(new Error("Resend rejected the send (" + status + ")"));
        }
        if (typeof res.json !== "function") return {};
        return res.json().catch(function() {
          return {};
        });
      });
    }
    module.exports = {
      RESEND_BATCH_URL,
      toAddress,
      fromAddress,
      formatFrom,
      buildEmails,
      toResendPayload,
      sendWithResend
    };
    module.exports.default = module.exports;
  }
});

// supabase/functions/_shared/contact-handler.js
var require_contact_handler = __commonJS({
  "supabase/functions/_shared/contact-handler.js"(exports, module) {
    var validateApi = require_contact_validate();
    var mail = require_contact_mail();
    var GAP_ERROR = "Please wait a few seconds before sending another note, or call (510) 467-0217.";
    var HOUR_ERROR = "Too many messages just now. Please wait a little while, or call (510) 467-0217.";
    function createState() {
      return { hits: /* @__PURE__ */ new Map(), sent: [] };
    }
    function hashIp(ip, salt) {
      var pepper = salt != null ? String(salt) : String(process.env.CONTACT_RATE_SALT || "ctrlclick-contact");
      var material = new TextEncoder().encode(pepper + "\n" + String(ip || "unknown"));
      var subtle = globalThis.crypto && globalThis.crypto.subtle;
      if (!subtle) return Promise.reject(new Error("crypto unavailable"));
      return subtle.digest("SHA-256", material).then(function(buf) {
        var bytes = new Uint8Array(buf);
        var hex = "";
        for (var i = 0; i < bytes.length; i++) {
          var piece = bytes[i].toString(16);
          hex += piece.length === 1 ? "0" + piece : piece;
        }
        return hex;
      });
    }
    function rateDecision(state, hash, nowMs) {
      var now = nowMs == null ? Date.now() : nowMs;
      var windowMs = Number(process.env.CONTACT_RATE_WINDOW_MS || 60 * 60 * 1e3);
      var max = Number(process.env.CONTACT_RATE_MAX || 5);
      var gapMs = Number(process.env.CONTACT_RATE_GAP_MS || 20 * 1e3);
      var recent = (state.hits.get(hash) || []).filter(function(t) {
        return now - t < windowMs;
      });
      var last = recent.length ? recent[recent.length - 1] : 0;
      if (last && gapMs > 0 && now - last < gapMs) {
        state.hits.set(hash, recent);
        return "gap";
      }
      if (recent.length >= max) {
        state.hits.set(hash, recent);
        return "hour";
      }
      recent.push(now);
      state.hits.set(hash, recent);
      return "";
    }
    function apiKeyFrom(deps) {
      if (deps && deps.apiKey != null) return String(deps.apiKey).trim();
      return String(process.env.RESEND_API_KEY || "").trim();
    }
    function handleContact(body, ip, deps) {
      deps = deps || {};
      var state = deps.state || createState();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return Promise.resolve({ status: 400, body: { error: "We couldn\u2019t read that submission." } });
      }
      if (validateApi.honeypotFilled(body)) {
        return Promise.resolve({ status: 200, body: { ok: true, dropped: true, emails: [] } });
      }
      var parsed;
      try {
        parsed = validateApi.validate(body);
      } catch (e) {
        return Promise.resolve({ status: 400, body: { error: "We couldn\u2019t read that submission." } });
      }
      if (!parsed.ok) {
        return Promise.resolve({
          status: 400,
          body: {
            error: "Please fix the highlighted fields.",
            errors: parsed.errors
          }
        });
      }
      return hashIp(ip || "unknown", deps.salt).then(function(hash) {
        var decision = rateDecision(state, hash, deps.now);
        if (decision) {
          return {
            status: 429,
            body: { error: decision === "gap" ? GAP_ERROR : HOUR_ERROR }
          };
        }
        var emails = mail.buildEmails(parsed.value);
        if (deps.mock) {
          emails.forEach(function(email) {
            state.sent.push(email);
          });
          return { status: 200, body: { ok: true, mocked: true, emails } };
        }
        var apiKey = apiKeyFrom(deps);
        if (!apiKey) {
          return {
            status: 503,
            body: {
              error: "This form isn\u2019t connected yet. Call (510) 467-0217 and a person will pick up."
            }
          };
        }
        return mail.sendWithResend(emails, { apiKey, fetch: deps.fetch }).then(function() {
          return { status: 200, body: { ok: true } };
        }, function() {
          return {
            status: 502,
            body: {
              error: "That didn\u2019t go through. Please try again, or call (510) 467-0217."
            }
          };
        });
      });
    }
    module.exports = {
      createState,
      hashIp,
      handleContact,
      buildEmails: mail.buildEmails,
      GAP_ERROR,
      HOUR_ERROR
    };
    module.exports.default = module.exports;
  }
});
export default require_contact_handler();
