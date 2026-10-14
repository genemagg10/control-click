"use strict";

/* Builds the two contact emails and sends them through Resend.
   Server-side only. Reads RESEND_API_KEY, CONTACT_FROM_EMAIL
   (default contact@maggio.xyz), and CONTACT_TO_EMAIL (default
   g@maggio.xyz). Each note is two emails. Resend's free tier is
   about 100 emails a day. */

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
      from: from,
      to: to,
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
      replyTo: to,
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
  toAddress: toAddress,
  fromAddress: fromAddress,
  formatFrom: formatFrom,
  buildEmails: buildEmails,
  toResendPayload: toResendPayload,
  sendWithResend: sendWithResend
};
module.exports.default = module.exports;
