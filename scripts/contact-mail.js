"use strict";

/* Builds the two contact emails and sends them through Resend.
   The API key never lives in the page. Callers pass it in, or this
   reads RESEND_API_KEY. CONTACT_FROM is the From address on maggio.xyz
   (default hello@maggio.xyz). Nothing here runs unless a caller asks. */

var RESEND_BATCH_URL = "https://api.resend.com/emails/batch";

function notifyAddress() {
  return process.env.CONTACT_NOTIFY || "g@maggio.xyz";
}

function formatFrom(raw) {
  var value = String(raw == null || String(raw).trim() === "" ? "hello@maggio.xyz" : raw).trim();
  if (value.indexOf("<") !== -1 && value.indexOf(">") !== -1) return value;
  return "Ctrl+Click <" + value + ">";
}

function fromAddress() {
  return formatFrom(process.env.CONTACT_FROM || "hello@maggio.xyz");
}

function buildEmails(value) {
  var phone = value.phone || "(none)";
  var view = value.view || "(not set)";
  var notify = notifyAddress();
  var from = fromAddress();
  return [
    {
      from: from,
      to: notify,
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
      from: from,
      to: value.email,
      replyTo: notify,
      subject: "We got your note — Ctrl+Click",
      text: [
        "Hi " + value.name + ",",
        "",
        "Thanks for writing. A real person at Ctrl+Click has your note and will write back.",
        "We make teams stronger, not smaller. If a short conversation would help, the first half hour is free.",
        "",
        "— Gene, Ctrl+Click",
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
  var fetchImpl = (options && options.fetch) || global.fetch;
  if (!apiKey) return Promise.reject(new Error("missing RESEND_API_KEY"));
  if (typeof fetchImpl !== "function") return Promise.reject(new Error("fetch unavailable"));
  return fetchImpl(RESEND_BATCH_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(emails.map(toResendPayload))
  }).then(function (res) {
    if (!res || !res.ok) {
      var status = res && res.status ? res.status : 0;
      return Promise.reject(new Error("Resend rejected the send (" + status + ")"));
    }
    if (typeof res.json !== "function") return {};
    return res.json().catch(function () { return {}; });
  });
}

module.exports = {
  RESEND_BATCH_URL: RESEND_BATCH_URL,
  notifyAddress: notifyAddress,
  fromAddress: fromAddress,
  formatFrom: formatFrom,
  buildEmails: buildEmails,
  toResendPayload: toResendPayload,
  sendWithResend: sendWithResend
};
