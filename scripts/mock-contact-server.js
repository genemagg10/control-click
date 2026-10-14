#!/usr/bin/env node
/* =====================================================================
   Local stand-in for the contact function.

   Production sends with Resend from api/contact.js (RESEND_API_KEY,
   CONTACT_FROM). This server never calls Resend, even if a key is
   present. It validates, honeypots, and rate-limits, then records the
   two emails the function would send.

     node scripts/mock-contact-server.js

   Optional env:
     PORT                     default 8787
     CONTACT_NOTIFY           default g@maggio.xyz
     CONTACT_FROM             default hello@maggio.xyz (recorded, not used to send)
     CONTACT_RATE_MAX         default 5
     CONTACT_RATE_WINDOW_MS   default 600000 (10 minutes)
   ===================================================================== */

"use strict";

var http = require("http");
var contact = require("./contact-handler.js");

var PORT = Number(process.env.PORT || 8787);
var MAX_BODY = 20 * 1024;
var state = contact.createState();

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
    sendJson(res, 200, { ok: true, sent: state.sent });
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

    var ip = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "unknown";
    contact.handleContact(body, ip, { state: state, mock: true }).then(function (result) {
      if (result.body && result.body.mocked) {
        var emails = result.body.emails || [];
        if (emails.length === 2) {
          console.log("[mock mail] to " + emails[0].to + " | confirmation to " + emails[1].to);
        }
      }
      sendJson(res, result.status, result.body);
    }).catch(function () {
      sendJson(res, 502, { error: "That didn’t go through. Please try again, or call (510) 467-0217." });
    });
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
    console.log("Emails are recorded, not sent. Notify address: " + (process.env.CONTACT_NOTIFY || "g@maggio.xyz"));
  });
}

module.exports = { start: start, buildEmails: contact.buildEmails };
