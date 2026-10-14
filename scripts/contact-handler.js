"use strict";

/* Shared contact submission: honeypot, validation, rate limit, then
   either a mocked record or a Resend send. The page never sees the key. */

var validateApi = require("../assets/contact-validate.js");
var mail = require("./contact-mail.js");

function createState() {
  return { hits: new Map(), sent: [] };
}

function rateLimited(state, ip) {
  var now = Date.now();
  var windowMs = Number(process.env.CONTACT_RATE_WINDOW_MS || 10 * 60 * 1000);
  var max = Number(process.env.CONTACT_RATE_MAX || 5);
  var recent = (state.hits.get(ip) || []).filter(function (t) { return now - t < windowMs; });
  if (recent.length >= max) {
    state.hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  state.hits.set(ip, recent);
  return false;
}

function apiKeyFrom(deps) {
  if (deps && deps.apiKey != null) return String(deps.apiKey).trim();
  return String(process.env.RESEND_API_KEY || "").trim();
}

function handleContact(body, ip, deps) {
  deps = deps || {};
  var state = deps.state || createState();
  if (validateApi.honeypotFilled(body)) {
    return Promise.resolve({ status: 200, body: { ok: true, dropped: true, emails: [] } });
  }

  var parsed;
  try {
    parsed = validateApi.validate(body || {});
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

  var who = ip || "unknown";
  if (rateLimited(state, who)) {
    return Promise.resolve({
      status: 429,
      body: {
        error: "Too many messages just now. Please wait a few minutes, or call (510) 467-0217."
      }
    });
  }

  var emails = mail.buildEmails(parsed.value);
  if (deps.mock) {
    emails.forEach(function (email) { state.sent.push(email); });
    return Promise.resolve({ status: 200, body: { ok: true, mocked: true, emails: emails } });
  }

  var apiKey = apiKeyFrom(deps);
  if (!apiKey) {
    return Promise.resolve({
      status: 503,
      body: {
        error: "This form isn’t connected yet. Call (510) 467-0217 and a person will pick up."
      }
    });
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
}

module.exports = {
  createState: createState,
  handleContact: handleContact,
  buildEmails: mail.buildEmails
};
