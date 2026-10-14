/* =====================================================================
   Ctrl+Click — contact form validation
   Shared by the browser form, the expert-mode prompt, and the local
   mock server. Field set matches the "Inquiries & Scheduling" Google
   Form: Name, Email, Phone (optional), Comment.
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
    comment: { required: true, max: 5000, label: "Comment" }
  };

  function checkField(key, raw) {
    var spec = FIELDS[key];
    if (!spec) return { ok: false, error: "Unknown field.", value: "" };
    var value = String(raw == null ? "" : raw).replace(/\r\n/g, "\n").trim();
    if (!value) {
      if (spec.required) return { ok: false, error: spec.label + " is required.", value: "" };
      return { ok: true, value: "" };
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
    checkField: checkField,
    cleanView: cleanView,
    honeypotFilled: honeypotFilled,
    validate: validate
  };
});
