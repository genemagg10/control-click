#!/usr/bin/env node
/* Local checks for contact validation and the mocked mailer.
   No network email is sent. Run: node scripts/contact-form.test.js */

"use strict";

var assert = require("assert");
var http = require("http");
var validate = require("../assets/contact-validate.js");
var mock = require("./mock-contact-server.js");

var failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (e) {
    failures += 1;
    console.error("FAIL " + name);
    console.error(e && e.stack ? e.stack : e);
  }
}

check("accepts the Google Form fields", function () {
  var result = validate.validate({
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "(510) 467-0217",
    comment: "Our team wants AI that makes us stronger, not smaller.",
    view: "team"
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.phone, "(510) 467-0217");
  assert.strictEqual(result.value.view, "team");
});

check("phone is optional", function () {
  var result = validate.validate({
    name: "Ada",
    email: "ada@example.com",
    phone: "   ",
    comment: "Hello"
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.phone, "");
});

check("requires name, email, and comment", function () {
  var result = validate.validate({ name: "", email: "", phone: "", comment: "" });
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.comment);
  assert.strictEqual(result.errors.phone, undefined);
});

check("rejects a bad email and a short phone", function () {
  var result = validate.validate({
    name: "Ada",
    email: "not-an-email",
    phone: "123",
    comment: "Hello"
  });
  assert.ok(result.errors.email);
  assert.ok(result.errors.phone);
});

check("honeypot is flagged, not a field error", function () {
  var result = validate.validate({
    name: "",
    email: "",
    comment: "",
    _gotcha: "http://spam.example"
  });
  assert.strictEqual(result.honeypot, true);
});

check("view only keeps the three audiences", function () {
  assert.strictEqual(validate.cleanView("individual"), "individual");
  assert.strictEqual(validate.cleanView("Expert"), "expert");
  assert.strictEqual(validate.cleanView("beginner"), "");
});

function request(port, payload) {
  return new Promise(function (resolve, reject) {
    var body = JSON.stringify(payload);
    var req = http.request({
      host: "127.0.0.1",
      port: port,
      path: "/contact",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, function (res) {
      var chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () {
        resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
      });
    });
    req.on("error", reject);
    req.end(body);
  });
}

function validPayload(n) {
  return {
    name: "Ada Lovelace",
    email: "ada" + n + "@example.com",
    phone: "",
    comment: "Please help our team get stronger, not smaller.",
    view: "individual",
    _gotcha: ""
  };
}

var port = 8799;
process.env.CONTACT_RATE_MAX = "2";
process.env.CONTACT_RATE_WINDOW_MS = "60000";
process.env.CONTACT_NOTIFY = "g@maggio.xyz";

var server = mock.start(port);
server.on("listening", function () {
  Promise.resolve()
    .then(function () { return request(port, validPayload(1)); })
    .then(function (res) {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.mocked, true);
      assert.strictEqual(res.body.emails.length, 2);
      assert.strictEqual(res.body.emails[0].to, "g@maggio.xyz");
      assert.strictEqual(res.body.emails[0].replyTo, "ada1@example.com");
      assert.ok(res.body.emails[0].text.indexOf("Ada Lovelace") !== -1);
      assert.ok(res.body.emails[0].text.indexOf("individual") !== -1);
      assert.strictEqual(res.body.emails[1].to, "ada1@example.com");
      assert.ok(/stronger, not smaller/i.test(res.body.emails[1].text));
      console.log("ok  mock records notify and confirmation emails");
    })
    .then(function () {
      return request(port, { name: "", email: "nope", phone: "", comment: "" });
    })
    .then(function (res) {
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.email);
      assert.ok(res.body.errors.name);
      console.log("ok  mock rejects invalid submissions");
    })
    .then(function () {
      return request(port, {
        name: "Bot",
        email: "bot@example.com",
        comment: "buy followers",
        _gotcha: "filled"
      });
    })
    .then(function (res) {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.dropped, true);
      assert.strictEqual(res.body.emails.length, 0);
      console.log("ok  honeypot is dropped without an email");
    })
    .then(function () { return request(port, validPayload(2)); })
    .then(function (res) {
      assert.strictEqual(res.status, 200);
      return request(port, validPayload(3));
    })
    .then(function (res) {
      assert.strictEqual(res.status, 429);
      assert.ok(/too many/i.test(res.body.error));
      console.log("ok  rate limit returns 429");
    })
    .then(function () {
      server.close();
      if (failures) {
        console.error(failures + " failed");
        process.exit(1);
      }
      console.log("all contact checks passed");
    })
    .catch(function (e) {
      console.error(e && e.stack ? e.stack : e);
      server.close();
      process.exit(1);
    });
});
