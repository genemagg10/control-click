# Human Mode — website & positioning strategy

A plan for making Ctrl+Click the IT partner that non-technical people trust first, without losing the expert brand underneath.

## The diagnosis

The stated positioning — AI-first with a human-first angle, helping teams work better together rather than replacing people — is genuinely differentiated. But the site currently signals the opposite audience: a dark terminal aesthetic, a price-led headline, navigation hidden behind a right-click, and no visible human. The brand is excellent; the audience aim is off by one ring.

**The core reframe:** the brand metaphor already IS the human-first pitch — a control-click reveals power that was there all along. Apply it to people, not just computers: *"Your team already has more capability than you're using. We unlock it."*

Three moves:

1. **Say the human thing** — reposition copy around people getting better, not IT getting cheaper.
2. **Default to daylight** — a warm, light, larger-type design becomes the default; the dark CLI becomes the easter egg. The site then demonstrates the pitch.
3. **Show your receipts** — a real face and name, testimonials, case studies (already written, in the hidden blog), a visible process, package pricing.

## Keep these (they're assets)

- The Ctrl+Click brand concept and hidden-menu easter eggs (as delight, not as the only navigation).
- The Obstacles → Capabilities → Outcomes service copy skeleton.
- **"No mystery boxes"** — currently buried in the Web Hosting detail; it's the whole ethos in three words. Promote to site-level messaging.
- AI + Coffee — the strongest trust engine available; elevate from a footer card to a pillar.
- The blog posts — three ready-made case studies (email migration, ten-year-old MacBook, TrailTracker), currently hidden behind a right-click.
- The patient, judgment-free tone of the personal services ("No question is too basic") — spread it site-wide.
- Expert mode — don't delete it; invert it (light default, full dark aesthetic becomes expert mode).

## Friction audit (as a less-savvy visitor)

| Current | Problem | Fix |
|---|---|---|
| Dark navy, mono fonts, terminal vibes | Reads "for programmers" — bounce before reading | Light default theme in the existing palette |
| "Enterprise-Level IT, Without the Enterprise-Level Price Tag" | Price-led, category-generic | Human-first outcome headline |
| "Psst: ctrl+click opens more…" | The invitation requires tech knowledge | Easter eggs stay; visible nav to everything too |
| ⌃click admin persona, Meshtastic/Jamf jargon in hero | Insider content where trust should be | Real name, face, 2-sentence story |
| Cards with no affordance; slide-over details | Nothing says "click me"; disorienting; not indexable | "Learn more →" links; dedicated service pages (SEO win) |
| No process, prices, or proof | The three questions every nervous buyer asks go unanswered | How-it-works, named packages, testimonials + stories |
| "Schedule a Discussion" | Formal, high-stakes | "Book a free 15-minute chat" + visible phone number |
| 13–14px muted gray text | Hard on older eyes | 18px base, 1.6 line-height, WCAG AA, 16px floor |

## Positioning

**Recommended hero (now level-aware):** the headline and subhead swap with the reading level. *Beginner* speaks to individuals, families, and small businesses — *"AI that works for you. Not instead of you."*, leading with "you have so much more to offer than any tool" (AI takes the busywork; you keep the work you love). *Intermediate* speaks to businesses weighing internal IT, an outside managed-services provider, or no solution yet — *"AI that makes your **team** better. Not smaller."* Both variants stay in the DOM (crawlers see both) and keep the No jargon · No judgment · No mystery boxes trust line.

Alternates to test: "Unlock what your team can already do." / "Technology that works for the people using it." / "Your team, upgraded. Everyone still on it."

**Elevator pitch:** "Ctrl+Click helps Bay Area businesses and families get more out of technology. We find the AI tools, systems, and platforms that fit how your people actually work, set them up right, and teach you to run them yourselves. We measure success by what your team can do without us."

**The Matching Method** (name the process; it converts): 1. Listen (free 15-min chat) → 2. Match (plain-English plan, fixed price) → 3. Empower (setup + hands-on training) → 4. Stay (you own everything; never locked in).

**The promise (manifesto):**
- We build teams up. We will never pitch AI as a way to cut your people.
- Plain English, always. If we can't explain it simply, we don't understand it well enough.
- No mystery boxes. You own every account, every password, every document.
- No question is too small, and nobody gets made to feel dumb. Ever.
- Adoption is the metric. If a tool isn't getting used, we swap it or remove it.

## The skill-level system (Beginner / Intermediate / Expert)

A three-level depth toggle that turns the site into a teacher and makes the brand literal — a control-click reveals more. It maps existing surfaces to a spectrum of *how much technical substance the visitor wants*, which is exactly the "we meet any skill level" thesis made visible before a word is read.

Who each level is *for* (the audience map that drives the copy):

- **Beginner (default — the current light site).** Individuals — individual professionals and personal life — families, and small businesses. Outcomes in plain English; jargon hidden one click deep. "Wi-Fi that works in every room." For "just tell me what I get." The hero here — *"AI that works for you. Not instead of you."* — names the replacement fear head-on and reframes AI as something the person directs: it takes the busywork so they keep the work they love.
- **Intermediate.** Small-to-medium businesses balancing internal IT, an outside managed-services provider, or no solution yet but needing support in some form. The *same* friendly, light site, but the substance is surfaced instead of hidden: a one-line *how* under each outcome ("…by segmenting traffic into separate VLANs so guests can't reach your business systems"), the **tool stack** shown as chips (UniFi, Meraki, SPF/DKIM/DMARC, Zapier/Make/n8n, Jamf), inline glossary tooltips on technical terms, and a notch more of the *why* and the trade-offs. Still no terminal. **This level also absorbs the former "expert client" band** — IT professionals looking for team support: product management and team leadership, large-scale migrations from mergers and acquisitions, and family offices. (That work is a higher tier of *service*, not a separate reading level, so it lives inside Intermediate rather than under the Expert CLI.)
- **Expert (the CLI easter egg).** Reserved for the fun terminal takeover: man-page service docs, keyboard-driven, reached through the control-click easter egg. It's a delight, not an audience tier — the expert *client* is served under Intermediate.

**Resource pages are pinned to Beginner.** Reference/resource pages (services, glossary, FAQ, email settings, stories) stay at Beginner so anyone can follow them. On those pages the Intermediate and Expert levels are shown *locked* (dimmed, with a padlock): clicking one isn't a switch, it's a conversation hook — it reveals a note inviting a free consultation to "unlock Intermediate — or even Expert — levels for you and your team." Only the homepage switches depth for real.

**Why it's more than a gimmick:** the toggle *is* the pitch, and it lets a visitor level up as they learn — the site reveals the next layer when they're ready. Beginner stays the default so no one is confronted with depth they didn't ask for; the control-click easter egg remains as a delight that jumps power users straight to Expert. Remembered per visitor (localStorage).

**Placement: Phase 2.5.** It's the flagship expression of the education / any-skill-level thesis, so it earns its own focused pass — but it's architecturally significant (a real refactor of today's two-state expert mode into three states, plus a new content-surfacing layer for Intermediate), so it should follow the Phase 2 trust content and start from an approved design direction. A concept mockup showing one service (Networking) rendered at all three depths is in the companion canvas.

## Design for comfort

- Light default using the existing brand kit: off-white `#F2F5F7` ground, navy `#0E1626` ink, teal accents (darkened to ~`#146E63` when used as text on light, for AA contrast), coral reserved for the primary button and the meetup.
- Archivo stays (400–500 for body, 800 for display); JetBrains Mono demoted to labels. Base 18px, line-height 1.6, 65–70ch measure, 16px minimum.
- AA contrast, visible focus states, `prefers-reduced-motion`, tap targets ≥ 44px. Buttons look like buttons.
- Page order: hero → two doors (business / you & family) → how it works → proof → services (with plain-words line + "Learn more →" per card) → promise + about → AI + Coffee → FAQ + contact.
- Visible nav: Business · Personal · How it works · Stories · About · Contact. "Stories" is the un-hidden blog.
- Plain-words layer on every service (keep technical copy one level deeper). Run visible copy through Hemingway; aim grade 6–8. Glossary tooltips for unavoidable terms.

Sample rewrites: "Wi-Fi that works in every room, and a network that doesn't fall over." · "One login for everything — and ex-employees actually locked out." · "Move your email without losing a single message." · "Hand the boring, repetitive work to AI — so your people can do the parts that need people."

## Content plan (ranked by impact per hour)

1. **Case studies** from existing posts: "41,000 messages moved. Zero lost." (business) · "We gave a 10-year-old laptop a second life." (personal) · TrailTracker (AI credibility). Template: The situation → What we did → What changed, plus one number and one quote.
2. **Testimonials** — this week: ask five happiest clients "What were you worried about before we started?" and "What's different now?" Plus a Google Business Profile with reviews (also the key local-SEO asset).
3. **Named fixed-price packages** — Business: AI Jumpstart, Inbox Rescue, Team Toolkit, Ctrl+Care (retainer). Individuals: **By the Hour** — pay-as-you-go time in 1, 3, or 5-hour blocks (bigger block, better rate), carrying the "don't let AI replace you" message. Personal/family: New Computer Concierge, Phone Fresh Start, AI 101 One-on-One, Photo Rescue. Show "from $X" or durations.
4. **90-second welcome video** (face to camera, one take); later, short "watch AI do this" screen demos.
5. **FAQ** answering the scary questions, including "Will AI replace my staff?" — answer no, in writing, prominently.
6. **Elevate AI + Coffee** — own page, next date, photos, RSVP; monthly recap email to attendees; meetup questions become posts/FAQ entries.
7. **Evergreen reference pages** *(shipped in Phase 1)* — free, helpful pages that serve anyone who lands on them, build goodwill, and quietly compound as SEO:
   - **`/glossary/`** — the plain-English tech glossary. Deciphers the jargon used across the site (with anchor links so any term can be shared), and captures "what does X mean" searches.
   - **`/email-settings/`** — the classic email configuration page (IMAP/POP/SMTP servers and ports for every major provider). An homage to one of the first pages Gene ever built for the web — which drew hundreds of thousands of visitors by simply helping people at the moment they were stuck. That's the content strategy in miniature: be findable at the moment of need, help first, and let some of those helped become clients. Less relevant than it once was, and worth keeping forever.
8. **Interactive lead magnet** (phase 3) — a 5-question "What could AI do for your business?" quiz ending in a mini-plan and a booking invitation, or an hours-saved calculator.

**Reference shelf:** Building a StoryBrand (Miller) · They Ask, You Answer (Sheridan) · NN/g research on older adults · plainlanguage.gov + Hemingway · WebAIM / WCAG 2.2 AA · Senja or a Google Form for testimonials · Loom for video · pattern sources: Apple support pages, good local-trades sites, coaching transformation stories.

## Roadmap

**Phase 1 — shipped.** New hero + CTA copy, tap-to-call phone number sitewide, light default theme (dark preserved as expert mode), About card (photo-ready, no fabricated photo), promise manifesto, blog surfaced as "Stories" (now also relit to light mode), plain-words lines + "Learn more →" on all twelve cards, the glossary and email-settings reference pages. *Still on you:* add a photo, testimonial outreach, Google Business Profile.

**Phase 2 — shipped.** How-it-works (the four-step Matching Method), a FAQ page + homepage teaser (incl. "Will AI replace my staff?" — answered no, in writing), three honest case-study cards from the existing posts (no fabricated numbers), named fixed-scope packages, references note in place of fabricated testimonials. *Still open from the original Phase 2 list:* real testimonials live once collected, dedicated per-service pages, an AI + Coffee page + monthly email, a 90-second welcome video.

**Per-service pages & no more slide-overs — shipped.** Each service is now a single file in a `_services` collection (one source of truth), rendered both as a homepage card and as its own indexable page at `/services/<slug>/` — 12 SEO pages. Clicking a card navigates to the page; the sliding side panel is gone. The reading-level control was also made deliberately understated. (Per the owner's direction, testimonial/reference and photo placeholders were removed, since those aren't being pursued.)

**Phase 2.5 — the skill-level toggle. Shipped.** The Beginner / Intermediate / Expert system is live: a visible depth control at the top of the homepage, the new Intermediate layer (a *how* line + tool-stack chips + inline glossary links surfaced on all twelve service cards), and a clean three-state model — `ctrlclick:level` (beginner/intermediate) kept independent of `ctrlclick:expert` (the CLI), so exiting the terminal returns you to your chosen light-site level. The control-click easter egg still jumps straight to Expert. (Also this pass: the five blog-post titles were rewritten to be compelling and content-revealing, with URLs unchanged.)

**Phase 2.6 — audience-tiered messaging. Shipped.** The reading level now drives who the site speaks to, not just how deep it goes:
- **Level-aware hero.** The homepage headline + subhead swap between Beginner (individuals, families, small businesses — "AI that works *for you*, not instead of you") and Intermediate (businesses with internal IT, an MSP, or no solution yet — "AI that makes your *team* better, not smaller"). Both variants stay in the DOM for SEO.
- **Expert client folded into Intermediate.** The higher-end service band (product management & team leadership, large-scale M&A migrations, family offices) is named in the Intermediate hero. "Expert" is reserved for the CLI easter egg only.
- **Resource pages pinned to Beginner + a conversion hook.** Every non-home page renders the level control with Intermediate and Expert *locked* (dimmed, padlocked). Tapping a locked level reveals a "book a free consultation to unlock" note instead of switching. Wired in `assets/level.js` (the `is-locked` branch) and `_includes/reading-level.html`.
- **New Individuals package.** "By the Hour" — 1, 3, or 5-hour blocks (bigger block, better rate), leading with "don't let AI replace you."
- **Rename.** The process is now the **Matching Method**; step 2 is **Match** (was the Pairing Method / Pair).

**Phase 3 (month 3+):** quiz/calculator lead magnet, demo clips, monthly content cadence, local SEO buildout (LocalBusiness schema, Bay Area + service terms).

**Measure** (GoatCounter is already installed — add events): booked chats/week (the metric), CTA click-through, AI + Coffee RSVPs, review count. 90-day bar: 2× booked calls, 10+ Google reviews, meetup list past 50. If bookings don't move by week 6, test the alternate headlines first.

---

*Companion mockups (desktop homepage, plain-language service page, mobile) were delivered as a design canvas alongside this report.*
