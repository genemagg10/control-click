#!/usr/bin/env node
/* =====================================================================
   Local stand-in for the contact form's mail step.

   GitHub Pages cannot run a function or read an API key, so production
   posts to Formspree. This server is only for local proof: it validates,
   honeypots, and rate-limits, then records the two emails it would send
   (Gene, and a short confirmation to the visitor). Nothing is delivered.

     node scripts/mock-contact-server.js

   Optional env:
     PORT                     default 8787
     CONTACT_NOTIFY           default g@maggio.xyz
     CONTACT_RATE_MAX         default 5
     CONTACT_RATE_WINDOW_MS   default 600000 (10 minutes)
   ===================================================================== */

"use strict";

var http = require("http");
var validateApi = require("../assets/contact-validate.js");

var PORT = Number(process.env.PORT || 8787);
var MAX_BODY = 20 * 1024;

var hits = new Map();
var sent = [];

function notifyAddress() {
  return process.env.CONTACT_NOTIFY || "g@maggio.xyz";
}

function buildEmails(value) {
  var phone = value.phone || "(none)";
  var view = value.view || "(not set)";
  var notify = notifyAddress();
  return [
    {
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

function rateLimited(ip) {
  var now = Date.now();
  var windowMs = Number(process.env.CONTACT_RATE_WINDOW_MS || 10 * 60 * 1000);
  var max = Number(process.env.CONTACT_RATE_MAX || 5);
  var recent = (hits.get(ip) || []).filter(function (t) { return now - t < windowMs; });
  if (recent.length >= max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function sendJson(res, status, body) {
  var json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
  });
  res.end(json);
}

function parseBody(raw, type) {
  if (!raw) return {};
  if (type.indexOf("application/json") !== -1) return JSON.parse(raw);
  var params = new URLSearchParams(raw);
  var out = {};
  params.forEach(function (value, key) { out[key] = value; });
  return out;
}

function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Max-Age": "600"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/sent") {
    sendJson(res, 200, { ok: true, sent: sent });
    return;
  }

  if (req.method !== "POST" || (req.url || "").split("?")[0] !== "/contact") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  var chunks = [];
  var size = 0;
  var tooBig = false;
  req.on("data", function (chunk) {
    size += chunk.length;
    if (size > MAX_BODY) {
      tooBig = true;
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", function () {
    if (tooBig) {
      sendJson(res, 413, { error: "That note is too large." });
      return;
    }
    var raw = Buffer.concat(chunks).toString("utf8");
    var body;
    try {
      body = parseBody(raw, String(req.headers["content-type"] || ""));
    } catch (e) {
      sendJson(res, 400, { error: "We couldn’t read that submission." });
      return;
    }

    if (validateApi.honeypotFilled(body)) {
      sendJson(res, 200, { ok: true, mocked: true, dropped: true, emails: [] });
      return;
    }

    var parsed = validateApi.validate(body);
    if (!parsed.ok) {
      sendJson(res, 400, {
        error: "Please fix the highlighted fields.",
        errors: parsed.errors
      });
      return;
    }

    var ip = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "unknown";
    if (rateLimited(ip)) {
      sendJson(res, 429, {
        error: "Too many messages just now. Please wait a few minutes, or call (510) 467-0217."
      });
      return;
    }

    var emails = buildEmails(parsed.value);
    emails.forEach(function (email) { sent.push(email); });
    console.log("[mock mail] to " + emails[0].to + " | confirmation to " + emails[1].to);
    sendJson(res, 200, { ok: true, mocked: true, emails: emails });
  });
}

function start(port) {
  var server = http.createServer(handle);
  server.listen(port || PORT, "127.0.0.1");
  return server;
}

if (require.main === module) {
  start().on("listening", function () {
    console.log("Mock contact server on http://127.0.0.1:" + PORT + "/contact");
    console.log("Emails are recorded, not sent. Notify address: " + notifyAddress());
  });
}

module.exports = { start: start, buildEmails: buildEmails };
