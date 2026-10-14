/* =====================================================================
   Ctrl+Click — contact form validation
   Shared by the browser form, the expert-mode prompt, and the local
   mock server.

   Required: name, email, message, and (unless they are one person)
   who the note is for. Phone is optional. Organization is optional
   and only kept for a business or a nonprofit.
   ===================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CtrlClickContactValidate = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_CHARS = /^[0-9+().\-\s]+$/;

  var FIELDS = {
    name: { required: true, max: 120, label: "Name" },
    email: { required: true, max: 254, label: "Email", type: "email" },
    phone: { required: false, max: 40, label: "Phone", type: "phone" },
    organization: { required: false, max: 160, label: "Organization" },
    message: { required: true, max: 5000, label: "Message" }
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
      return { ok: false, error: spec.label + " is too long.", value: value };
    }
    if (spec.type === "email") {
      if (!EMAIL.test(value) || value.length > 254) {
        return { ok: false, error: "Enter an email address we can write back to.", value: value };
      }
    }
    if (spec.type === "phone") {
      var digits = value.replace(/\D/g, "");
      if (!PHONE_CHARS.test(value) || digits.length < 7 || digits.length > 15) {
        return { ok: false, error: "Use a phone number with digits, like (510) 467-0217.", value: value };
      }
    }
    return { ok: true, value: value };
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

  /* One word, or the phrase on the button. Used by the command-line prompt. */
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

  /* Honeypot: Formspree's `_gotcha`, plus a plain alias. A filled trap is
     not an error — callers pretend the note was accepted and drop it. */
  function honeypotFilled(input) {
    if (!input) return false;
    var trap = input._gotcha != null ? input._gotcha : input.gotcha;
    return String(trap == null ? "" : trap).trim().length > 0;
  }

  function validate(input) {
    input = input || {};
    var errors = {};
    var value = {};
    Object.keys(FIELDS).forEach(function (key) {
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
      errors: errors,
      value: value,
      honeypot: honeypotFilled(input)
    };
  }

  return {
    FIELDS: FIELDS,
    COMMENT_PROMPTS: COMMENT_PROMPTS,
    checkField: checkField,
    cleanView: cleanView,
    commentPrompt: commentPrompt,
    aboutLabel: aboutLabel,
    wantsOrganization: wantsOrganization,
    parseAbout: parseAbout,
    parseTeamAbout: parseTeamAbout,
    honeypotFilled: honeypotFilled,
    validate: validate
  };
});
