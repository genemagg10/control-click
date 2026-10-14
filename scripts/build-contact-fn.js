#!/usr/bin/env node
/* Bundle the contact handler into one ES module for the Edge Function.
   supabase functions deploy contact serves supabase/functions/contact/,
   and Deno cannot require() the shared CommonJS files. */

"use strict";

var esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["supabase/functions/_shared/contact-handler.js"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: "supabase/functions/contact/contact-handler.js",
  banner: {
    js: 'import process from "node:process"; const global = globalThis;'
  }
});

console.log("Wrote supabase/functions/contact/contact-handler.js");
