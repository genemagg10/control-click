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

check("accepts a short individual note", function () {
  var result = validate.validate({
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "",
    organization: "Should be dropped",
    message: "Please take the busywork off my plate.",
    about: "individual",
    view: "individual"
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.organization, "");
  assert.strictEqual(result.value.about, "individual");
  assert.strictEqual(result.value.phone, "");
});

check("keeps an organization for a business or a nonprofit", function () {
  var business = validate.validate({
    name: "Ada",
    email: "ada@example.com",
    message: "Help the team we have.",
    about: "a business",
    organization: "Northwind"
  });
  assert.strictEqual(business.ok, true);
  assert.strictEqual(business.value.about, "business");
  assert.strictEqual(business.value.organization, "Northwind");
  var nonprofit = validate.validate({
    name: "Ada",
    email: "ada@example.com",
    message: "Our volunteers need a better inbox.",
    about: "non-profit",
    organization: "Friends of the Park"
  });
  assert.strictEqual(nonprofit.value.about, "nonprofit");
  assert.strictEqual(nonprofit.value.organization, "Friends of the Park");
});

check("a family does not keep an organization", function () {
  var result = validate.validate({
    name: "Ada",
    email: "ada@example.com",
    message: "The home printer is a mystery.",
    about: "household",
    organization: "The Lovelace house"
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.about, "family");
  assert.strictEqual(result.value.organization, "");
});

check("team notes need to say who they are for", function () {
  var result = validate.validate({
    name: "Ada",
    email: "ada@example.com",
    message: "Hello"
  });
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.about);
});

check("phone is optional", function () {
  var result = validate.validate({
    name: "Ada",
    email: "ada@example.com",
    phone: "   ",
    message: "Hello",
    about: "individual"
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.phone, "");
});

check("requires name, email, and a message", function () {
  var result = validate.validate({ name: "", email: "", phone: "", message: "", about: "family" });
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.message);
  assert.strictEqual(result.errors.phone, undefined);
  assert.strictEqual(result.errors.organization, undefined);
});

check("rejects a bad email and a short phone", function () {
  var result = validate.validate({
    name: "Ada",
    email: "not-an-email",
    phone: "123",
    message: "Hello",
    about: "individual"
  });
  assert.ok(result.errors.email);
  assert.ok(result.errors.phone);
});

check("prompts follow who the note is for", function () {
  assert.strictEqual(validate.commentPrompt("individual"), "What can we take off your plate?");
  assert.strictEqual(validate.commentPrompt("business"), "What should your team be able to do?");
  assert.strictEqual(validate.commentPrompt("family"), "What should we sort out at home?");
  assert.ok(/more capable/.test(validate.commentPrompt("nonprofit")));
  assert.strictEqual(validate.parseTeamAbout("just me"), "");
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
    message: "Please help our team get stronger, not smaller.",
    about: "individual",
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
      return request(port, { name: "", email: "nope", phone: "", message: "", about: "individual" });
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
        message: "buy followers",
        about: "individual",
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
