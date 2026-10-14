import { withSupabase } from "npm:@supabase/server@1";
import contactMod from "../_shared/contact-handler.js";

const contact = contactMod.handleContact ? contactMod : contactMod.default;

/* Public contact route for the static Ctrl+Click site.
   GitHub Pages cannot run code or read RESEND_API_KEY, so this Edge
   Function is the server. It reads only this function's env:
   RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL.
   verify_jwt is off in config.toml because visitors are not signed in.
   The honeypot, length caps, and hashed-IP limit live in the handler. */

const state = contact.createState();
const MAX_BODY = 20 * 1024;

function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

function json(status: number, body: unknown, statusNoContent = false): Response {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (statusNoContent) return new Response(null, { status, headers });
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req: Request) => {
    if (req.method === "OPTIONS") {
      return json(204, null, true);
    }
    if (req.method !== "POST") return json(404, { error: "Not found." });

    const declared = Number(req.headers.get("content-length") || "0");
    if (declared > MAX_BODY) return json(413, { error: "That note is too large." });

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { error: "That note is too large." });

    let body: unknown = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch (_e) {
        return json(400, { error: "We couldn’t read that submission." });
      }
    }

    const result = await contact.handleContact(body, clientIp(req), { state });
    return json(result.status, result.body);
  }),
};
