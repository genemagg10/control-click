"use strict";

/* Contact route for the hosting project.
   Reads RESEND_API_KEY and CONTACT_FROM (an address on maggio.xyz,
   default hello@maggio.xyz) and sends both emails through Resend.
   GitHub Pages cannot run this file. The project that serves
   /api/contact is the one that holds the env vars. */

var contact = require("../scripts/contact-handler.js");

var state = contact.createState();
var MAX_BODY = 20 * 1024;

function header(req, name) {
  var headers = req.headers || {};
  var lower = name.toLowerCase();
  var value = headers[lower] != null ? headers[lower] : headers[name];
  if (Array.isArray(value)) return value[0] == null ? "" : String(value[0]);
  return value == null ? "" : String(value);
}

function clientIp(req) {
  var fwd = header(req, "x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return "unknown";
}

function tooLarge(body) {
  if (body == null || body === "") return false;
  if (typeof body === "string") return Buffer.byteLength(body) > MAX_BODY;
  if (Buffer.isBuffer(body)) return body.length > MAX_BODY;
  try {
    return Buffer.byteLength(JSON.stringify(body)) > MAX_BODY;
  } catch (e) {
    return true;
  }
}

function parseBody(body) {
  if (body == null || body === "") return {};
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") return JSON.parse(body);
  if (typeof body === "object") return body;
  return {};
}

function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function reply(res, status, body) {
  if (typeof res.status === "function") {
    res.status(status).json(body);
    return;
  }
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

function handler(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    reply(res, 404, { error: "Not found." });
    return;
  }
  if (tooLarge(req.body)) {
    reply(res, 413, { error: "That note is too large." });
    return;
  }
  var body;
  try {
    body = parseBody(req.body);
  } catch (e) {
    reply(res, 400, { error: "We couldn’t read that submission." });
    return;
  }
  return contact.handleContact(body, clientIp(req), { state: state, fetch: global.fetch }).then(function (result) {
    reply(res, result.status, result.body);
  }).catch(function () {
    reply(res, 502, { error: "That didn’t go through. Please try again, or call (510) 467-0217." });
  });
}

module.exports = handler;
