"use strict";

/* Honeypot, length caps, hashed-IP rate limit, then Resend or a mock
   record. The stored key is a SHA-256 of the address, not the address.
   Defaults: 5 accepted notes per hour, and at least 20 seconds between
   them. Resend is called only from sendWithResend. */

var validateApi = require("../../../assets/contact-validate.js");
var mail = require("./contact-mail.js");

var GAP_ERROR = "Please wait a few seconds before sending another note, or call (510) 467-0217.";
var HOUR_ERROR = "Too many messages just now. Please wait a little while, or call (510) 467-0217.";

function createState() {
  return { hits: new Map(), sent: [] };
}

function hashIp(ip, salt) {
  var pepper = salt != null ? String(salt) : String(process.env.CONTACT_RATE_SALT || "ctrlclick-contact");
  var material = new TextEncoder().encode(pepper + "\n" + String(ip || "unknown"));
  var subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) return Promise.reject(new Error("crypto unavailable"));
  return subtle.digest("SHA-256", material).then(function (buf) {
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
  var windowMs = Number(process.env.CONTACT_RATE_WINDOW_MS || 60 * 60 * 1000);
  var max = Number(process.env.CONTACT_RATE_MAX || 5);
  var gapMs = Number(process.env.CONTACT_RATE_GAP_MS || 20 * 1000);
  var recent = (state.hits.get(hash) || []).filter(function (t) { return now - t < windowMs; });
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
    return Promise.resolve({ status: 400, body: { error: "We couldn’t read that submission." } });
  }
  if (validateApi.honeypotFilled(body)) {
    return Promise.resolve({ status: 200, body: { ok: true, dropped: true, emails: [] } });
  }

  var parsed;
  try {
    parsed = validateApi.validate(body);
  } catch (e) {
    return Promise.resolve({ status: 400, body: { error: "We couldn’t read that submission." } });
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

  return hashIp(ip || "unknown", deps.salt).then(function (hash) {
    var decision = rateDecision(state, hash, deps.now);
    if (decision) {
      return {
        status: 429,
        body: { error: decision === "gap" ? GAP_ERROR : HOUR_ERROR }
      };
    }

    var emails = mail.buildEmails(parsed.value);
    if (deps.mock) {
      emails.forEach(function (email) { state.sent.push(email); });
      return { status: 200, body: { ok: true, mocked: true, emails: emails } };
    }

    var apiKey = apiKeyFrom(deps);
    if (!apiKey) {
      return {
        status: 503,
        body: {
          error: "This form isn’t connected yet. Call (510) 467-0217 and a person will pick up."
        }
      };
    }

    return mail.sendWithResend(emails, { apiKey: apiKey, fetch: deps.fetch }).then(function () {
      return { status: 200, body: { ok: true } };
    }, function () {
      return {
        status: 502,
        body: {
          error: "That didn’t go through. Please try again, or call (510) 467-0217."
        }
      };
    });
  });
}

module.exports = {
  createState: createState,
  hashIp: hashIp,
  handleContact: handleContact,
  buildEmails: mail.buildEmails,
  GAP_ERROR: GAP_ERROR,
  HOUR_ERROR: HOUR_ERROR
};
module.exports.default = module.exports;
