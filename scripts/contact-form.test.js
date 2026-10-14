#!/usr/bin/env node
/* Local checks for contact validation and the mocked mailer.
   No network email is sent. Run: node scripts/contact-form.test.js */

"use strict";

var assert = require("assert");
var http = require("http");
var fs = require("fs");
var path = require("path");
var validate = require("../assets/contact-validate.js");
var mock = require("./mock-contact-server.js");
var mail = require("./contact-mail.js");
var handler = require("./contact-handler.js");

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

check("mail uses this site's from and to env names", function () {
  var previousFrom = process.env.CONTACT_FROM_EMAIL;
  var previousTo = process.env.CONTACT_TO_EMAIL;
  var previousLegacyFrom = process.env.CONTACT_FROM;
  var previousLegacyTo = process.env.CONTACT_NOTIFY;
  delete process.env.CONTACT_FROM_EMAIL;
  delete process.env.CONTACT_TO_EMAIL;
  process.env.CONTACT_FROM = "someone@example.com";
  process.env.CONTACT_NOTIFY = "other@example.com";
  var note = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello",
    about: "individual",
    view: "team",
    phone: "",
    organization: ""
  };
  var emails = mail.buildEmails(note);
  assert.strictEqual(emails[0].from, "Ctrl+Click <contact@maggio.xyz>");
  assert.strictEqual(emails[0].to, "g@maggio.xyz");
  assert.strictEqual(emails[1].from, "Ctrl+Click <contact@maggio.xyz>");
  process.env.CONTACT_FROM_EMAIL = "hello@maggio.xyz";
  process.env.CONTACT_TO_EMAIL = "g@maggio.xyz";
  assert.strictEqual(mail.buildEmails(note)[0].from, "Ctrl+Click <hello@maggio.xyz>");
  process.env.CONTACT_FROM_EMAIL = "Gene <contact@maggio.xyz>";
  assert.strictEqual(mail.buildEmails(note)[0].from, "Gene <contact@maggio.xyz>");
  if (previousFrom == null) delete process.env.CONTACT_FROM_EMAIL;
  else process.env.CONTACT_FROM_EMAIL = previousFrom;
  if (previousTo == null) delete process.env.CONTACT_TO_EMAIL;
  else process.env.CONTACT_TO_EMAIL = previousTo;
  if (previousLegacyFrom == null) delete process.env.CONTACT_FROM;
  else process.env.CONTACT_FROM = previousLegacyFrom;
  if (previousLegacyTo == null) delete process.env.CONTACT_NOTIFY;
  else process.env.CONTACT_NOTIFY = previousLegacyTo;
});

check("field length caps reject oversized notes", function () {
  var result = validate.validate({
    name: new Array(122).join("n"),
    email: "ada@example.com",
    message: new Array(5002).join("m"),
    about: "individual",
    phone: "1".repeat(41)
  });
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.message);
  assert.ok(result.errors.phone);
});

check("the edge function stays server-side and public", function () {
  var source = fs.readFileSync(path.join(__dirname, "../supabase/functions/contact/index.ts"), "utf8");
  var config = fs.readFileSync(path.join(__dirname, "../supabase/config.toml"), "utf8");
  var bundle = fs.readFileSync(path.join(__dirname, "../supabase/functions/contact/contact-handler.js"), "utf8");
  assert.strictEqual(source.indexOf("re_"), -1);
  assert.ok(!/re_[0-9A-Za-z]{10,}/.test(bundle));
  assert.ok(bundle.indexOf("Bearer re_") === -1);
  assert.ok(source.indexOf("Deno.serve") !== -1);
  assert.ok(source.indexOf("handleContact") !== -1);
  assert.ok(source.indexOf("./contact-handler.js") !== -1);
  assert.ok(source.indexOf("withSupabase") === -1);
  assert.ok(bundle.indexOf('import process from "node:process"') === 0);
  assert.ok(config.indexOf("verify_jwt = false") !== -1);
  assert.ok(source.indexOf("notes@") === -1);
  var page = fs.readFileSync(path.join(__dirname, "../assets/contact-form.js"), "utf8");
  assert.ok(page.indexOf("RESEND_API_KEY") === -1);
  assert.ok(page.indexOf("api.resend.com") === -1);
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

function invokeHandler(payload, ip, extra) {
  var options = extra || {};
  options.state = options.state || invokeHandler.state;
  return handler.handleContact(payload, ip || "203.0.113.10", options);
}
invokeHandler.state = handler.createState();

function resendChecks() {
  var previousKey = process.env.RESEND_API_KEY;
  var previousFrom = process.env.CONTACT_FROM_EMAIL;
  var previousFetch = global.fetch;
  var calls = [];
  invokeHandler.state = handler.createState();
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.CONTACT_FROM_EMAIL = "contact@maggio.xyz";
  global.fetch = function (url, opts) {
    calls.push({ url: String(url), opts: opts });
    return Promise.resolve({
      ok: true,
      status: 200,
      json: function () { return Promise.resolve({ data: [{ id: "notify" }, { id: "confirm" }] }); },
      text: function () { return Promise.resolve(""); }
    });
  };
  return invokeHandler({
    name: "Ada",
    email: "ada@example.com",
    message: "Help the team we have.",
    about: "business",
    organization: "Northwind",
    view: "team",
    phone: ""
  }, "203.0.113.10").then(function (res) {
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.mocked, undefined);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].url, mail.RESEND_BATCH_URL);
    assert.strictEqual(calls[0].opts.headers.Authorization, "Bearer re_test_key");
    var payload = JSON.parse(calls[0].opts.body);
    assert.strictEqual(payload.length, 2);
    assert.strictEqual(payload[0].from, "Ctrl+Click <contact@maggio.xyz>");
    assert.deepStrictEqual(payload[0].to, ["g@maggio.xyz"]);
    assert.strictEqual(payload[0].reply_to, "ada@example.com");
    assert.ok(payload[0].text.indexOf("Northwind") !== -1);
    assert.strictEqual(payload[1].from, "Ctrl+Click <contact@maggio.xyz>");
    assert.deepStrictEqual(payload[1].to, ["ada@example.com"]);
    assert.strictEqual(payload[1].reply_to, "g@maggio.xyz");
    assert.ok(/stronger, not smaller/i.test(payload[1].text));
    console.log("ok  Resend payload uses the key and maggio.xyz from-address");
  }).then(function () {
    delete process.env.RESEND_API_KEY;
    global.fetch = function () { throw new Error("Resend was called without a key"); };
    return invokeHandler({
      name: "Ada",
      email: "ada@example.com",
      message: "Hello",
      about: "individual"
    }, "203.0.113.11");
  }).then(function (res) {
    assert.strictEqual(res.status, 503);
    assert.ok(/connected/i.test(res.body.error));
    console.log("ok  missing RESEND_API_KEY does not call Resend");
  }).then(function () {
    process.env.RESEND_API_KEY = "re_test_key";
    var called = false;
    global.fetch = function () {
      called = true;
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); } });
    };
    return invokeHandler({
      name: "Bot",
      email: "bot@example.com",
      message: "buy followers",
      about: "individual",
      _gotcha: "filled"
    }, "203.0.113.12").then(function (res) {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.dropped, true);
      assert.strictEqual(called, false);
      console.log("ok  honeypot does not call Resend");
    });
  }).then(function () {
    process.env.RESEND_API_KEY = "re_test_key";
    global.fetch = function () {
      return Promise.resolve({
        ok: false,
        status: 403,
        text: function () { return Promise.resolve("domain not verified"); },
        json: function () { return Promise.resolve({ message: "domain not verified" }); }
      });
    };
    return invokeHandler({
      name: "Ada",
      email: "ada-fail@example.com",
      message: "Hello",
      about: "family"
    }, "203.0.113.13");
  }).then(function (res) {
    assert.strictEqual(res.status, 502);
    assert.ok(!/re_test_key/.test(JSON.stringify(res.body)));
    assert.ok(!/not verified/.test(JSON.stringify(res.body)));
    console.log("ok  a rejected Resend send stays a visitor-facing error");
  }).then(function () {
    global.fetch = previousFetch;
    if (previousKey == null) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom == null) delete process.env.CONTACT_FROM_EMAIL;
    else process.env.CONTACT_FROM_EMAIL = previousFrom;
  }, function (err) {
    global.fetch = previousFetch;
    if (previousKey == null) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom == null) delete process.env.CONTACT_FROM_EMAIL;
    else process.env.CONTACT_FROM_EMAIL = previousFrom;
    throw err;
  });
}

function limitChecks() {
  var previousMax = process.env.CONTACT_RATE_MAX;
  var previousWindow = process.env.CONTACT_RATE_WINDOW_MS;
  var previousGap = process.env.CONTACT_RATE_GAP_MS;
  process.env.CONTACT_RATE_MAX = "5";
  process.env.CONTACT_RATE_WINDOW_MS = "3600000";
  process.env.CONTACT_RATE_GAP_MS = "20000";
  var state = handler.createState();
  var start = 1_700_000_000_000;
  function note(n) {
    return {
      name: "Ada",
      email: "ada" + n + "@example.com",
      message: "Hello from the limit check.",
      about: "individual"
    };
  }
  return handler.handleContact(note(1), "198.51.100.20", { state: state, mock: true, now: start }).then(function (res) {
    assert.strictEqual(res.status, 200);
    var keys = Array.from(state.hits.keys());
    assert.strictEqual(keys.length, 1);
    assert.notStrictEqual(keys[0], "198.51.100.20");
    assert.ok(/^[0-9a-f]{64}$/.test(keys[0]));
    return handler.handleContact(note(2), "198.51.100.20", { state: state, mock: true, now: start + 5000 });
  }).then(function (res) {
    assert.strictEqual(res.status, 429);
    assert.ok(/few seconds/i.test(res.body.error));
    var chain = Promise.resolve();
    for (var i = 2; i <= 5; i++) {
      (function (n) {
        chain = chain.then(function () {
          return handler.handleContact(note(n), "198.51.100.20", {
            state: state,
            mock: true,
            now: start + n * 20000
          });
        }).then(function (res) {
          assert.strictEqual(res.status, 200);
        });
      })(i);
    }
    return chain;
  }).then(function () {
    return handler.handleContact(note(6), "198.51.100.20", {
      state: state,
      mock: true,
      now: start + 6 * 20000
    });
  }).then(function (res) {
    assert.strictEqual(res.status, 429);
    assert.ok(/too many/i.test(res.body.error));
    return handler.handleContact(note(7), "198.51.100.21", {
      state: state,
      mock: true,
      now: start + 6 * 20000
    });
  }).then(function (res) {
    assert.strictEqual(res.status, 200);
    console.log("ok  hashed IP allows 5 per hour and 20 seconds apart");
    if (previousMax == null) delete process.env.CONTACT_RATE_MAX;
    else process.env.CONTACT_RATE_MAX = previousMax;
    if (previousWindow == null) delete process.env.CONTACT_RATE_WINDOW_MS;
    else process.env.CONTACT_RATE_WINDOW_MS = previousWindow;
    if (previousGap == null) delete process.env.CONTACT_RATE_GAP_MS;
    else process.env.CONTACT_RATE_GAP_MS = previousGap;
  }, function (err) {
    if (previousMax == null) delete process.env.CONTACT_RATE_MAX;
    else process.env.CONTACT_RATE_MAX = previousMax;
    if (previousWindow == null) delete process.env.CONTACT_RATE_WINDOW_MS;
    else process.env.CONTACT_RATE_WINDOW_MS = previousWindow;
    if (previousGap == null) delete process.env.CONTACT_RATE_GAP_MS;
    else process.env.CONTACT_RATE_GAP_MS = previousGap;
    throw err;
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
process.env.CONTACT_RATE_GAP_MS = "0";
process.env.CONTACT_TO_EMAIL = "g@maggio.xyz";

var server = mock.start(port);
server.on("listening", function () {
  Promise.resolve()
    .then(function () {
      return import("../supabase/functions/contact/contact-handler.js");
    })
    .then(function (mod) {
      var api = mod.default && mod.default.handleContact ? mod.default : mod;
      assert.strictEqual(typeof api.handleContact, "function");
      assert.strictEqual(typeof api.createState, "function");
      console.log("ok  bundled handler loads");
    })
    .then(function () { return limitChecks(); })
    .then(function () { return resendChecks(); })
    .then(function () {
      process.env.RESEND_API_KEY = "re_should_not_leave_the_mock";
      global.fetch = function () { throw new Error("Resend was called from the mock"); };
      return request(port, validPayload(1));
    })
    .then(function (res) {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.mocked, true);
      assert.strictEqual(res.body.emails.length, 2);
      assert.strictEqual(res.body.emails[0].to, "g@maggio.xyz");
      assert.strictEqual(res.body.emails[0].from, "Ctrl+Click <contact@maggio.xyz>");
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
