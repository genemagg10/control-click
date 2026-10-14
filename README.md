# Ctrl+Click

**Ctrl+Click: AI & IT Solutions** (formerly [Maggio Consulting](https://it.maggio.xyz)) provides technology consulting and support for people, businesses, and their teams.

## The brand

- **Primary name:** `Ctrl+Click: AI & IT Solutions`, used everywhere by default. The `: AI & IT Solutions` suffix is a muted sub-label next to the wordmark, hidden on narrow screens.
- **Technical/hackery variant:** `⌃Click`, the Mac Control symbol in front of "Click". Used sparingly for code-flavored accents.
- **⌃click** is also the site's admin persona, the "user" who posts and maintains the content on the site.
- **The idea:** on a Mac, control‑click (right‑click) opens the hidden menu: more options, more power, one click away. The chevron `⌃` is both the Control key and the crest worn as a mark of leadership.
- Try control‑clicking anywhere on the site: it opens a custom "hidden menu" easter egg.
- Control-click / right-click **the site title in the header** and the hidden menu opens in its "what we do" mode instead: the control-click explainer that used to sit in the hero, plus links to the service sections. The two modes share one `#ctxMenu` element and are switched by its `data-mode` attribute (`persona` for `.secret-spot`, `about` for `.about-spot`).
- The blog ("Stories") is linked from the visible nav and footer, and is still reachable the fun way: right‑click / control‑click (or tap‑and‑hold on mobile) **on the ⌃click persona itself** (the byline in the hero card or the "maintained by ⌃click" footer line) and the hidden menu reveals the **📓 Stories** entry. Invoked anywhere else, the menu doesn't mention the blog at all.

## Brand assets

The full production brand kit lives in `Logo-Assets/` (marks, favicons, lockups, avatars, wordmarks, the `og-image.html` social-image template, and the one-page `Ctrl+Click-Brand-Sheet.pdf`). The site pulls the pieces it needs into `assets/brand/`. The mark is the layered keycap: a control key with a hidden layer peeking out behind it, and the caret set in the reveal color so it reads as a window down to what's underneath — the promise made literal, that there's more here, and more capability in your own people, than you first see. The wordmark carries the name in Archivo, with `Click` and the caret in teal.

**Tone:** warm, plain-spoken, human-first. We talk about people getting more capable, not IT getting cheaper — no enterprise chest-thumping, no price-led headlines, no jargon. Anything that carries a message (the social image, avatars, lockups on grounds) leads with daylight: the light human-mode palette, not the dark terminal, which is reserved for the expert-mode easter egg.

| File | Purpose |
|---|---|
| `controlclick-mark.svg` | The keycap mark on a transparent ground. Used as the small avatar next to the ⌃click persona. |
| `assets/brand/favicon.svg` | The keycap mark on a navy tile, for the browser tab. |
| `assets/brand/favicon-32.png`, `favicon-16.png` | Raster favicons for the browser tab. |
| `assets/brand/apple-touch-icon.png` | 180px navy app-icon tile for iOS home screens. |
| `assets/brand/wordmark-horizontal-dark.png` | Horizontal wordmark for dark grounds. |
| `og-image.png` | Default social sharing image (the **Team** card): the wordmark, the headline ("AI That Makes Your Team Stronger. Not Smaller."), and the No jargon · No judgment · No mystery boxes trust line, on the warm off-white ground of human mode. Regenerate from `Logo-Assets/og-image.html` at 1200×630. |
| `og-image-beginner.png` | **Individual** social card — "AI That Works for You. Not Instead of You." on the same light ground. From `Logo-Assets/og-image-beginner.html`. The filename is kept so older links still resolve. |
| `og-image-expert.png` | **Expert** social card — the CLI Easter egg as a phosphor-on-black terminal, matching `assets/expert-mode.css`. From `Logo-Assets/og-image-expert.html`. The command line is just for fun, not a separate service. |

### Colors

The palette leads with **daylight**: an off-white ground and navy ink, with teal and coral as accents. Human mode is the default face of the brand, so teal is darkened to `#146E63` when it carries text on light (for AA contrast) while the brighter `#1E9C8C` stays the mark/accent teal. Coral warms the primary button and the meetup; navy is reserved for ink, app-icon tiles, and the CLI easter egg.

| Token | Value | Role |
|---|---|---|
| Navy | `#0E1626` | Ink, app-icon tile, the dark CLI (expert mode) |
| Off-white | `#F2F5F7` | Default ground of human mode; text on dark |
| Teal | `#1E9C8C` | The mark, the caret, `Click`, large accents |
| Teal (text) | `#146E63` | Teal as text/links on light — AA-contrast |
| Coral | `#E8674C` | Warm accent — the reveal, the meetup |
| Coral (button) | `#C7492F` | Coral as a button ground — AA with white text |

### Type

- **Archivo** (800) for the wordmark.
- **JetBrains Mono** (500) for the service line and mono accents.

Both are free on Google Fonts and loaded in the page `<head>`.

## The site

`index.html` (with empty front matter so Jekyll renders its service cards from the `_services` collection with Liquid). The default look is **human mode**: a warm, light take on the brand palette (off-white ground, navy ink, teal + coral accents), written in plain language for visitors who aren't technical. The full dark aesthetic lives on inside **expert mode** — approachable on the surface, power one control-click down, which is the brand pitch made literal.

A small **audience control** (Individual / Team / Expert) sits at the top of the homepage. It asks who the visitor is, not how skilled they are:

- **Team** (default) is for businesses, nonprofits, and households. Families are welcome. The hero is "AI that makes your team stronger. Not smaller." Team services (networks, identity, collaboration, email migration, hosting, AI) show here, plus household tech help and Ctrl+Care. Service cards also show the how and the tools.
- **Individual** is for one person: solo professionals, personal devices, and learning AI at their own pace. The hero stays "AI that works for you. Not instead of you."
- **Expert** is the command-line Easter egg only — just for fun, not a service we sell.

Both hero variants live in the DOM (crawlers see both) and one shows at a time via `html.team` or `html.individual`. The choice is remembered per browser in `ctrlclick:level` (`team` or `individual`), kept independent of `ctrlclick:expert` (the CLI). Saved values from the old skill ladder migrate: `beginner` → `individual`, `intermediate` → `team`.

The same switch appears on reference pages (services, glossary, FAQ, email settings, stories). Those guides stay readable either way; the choice is remembered for the home page, and Expert still opens the command line.

Content: six business services (Networking, Identity Management, AI Services & Automation, Team Collaboration, Email Hosting & Migration, Web Hosting & Domain Routing) and six personal services (Email Management, Device Maintenance, Basic Troubleshooting, Technology Education, Introduction to AI, Smart Phone Setup & Training). **Each service is one file in `_services/` — the single source of truth** — rendered both as a homepage card (with its `plain` one-liner, `how` line, and `stack` chips) and as its own indexable page at **`/services/<slug>/`** (full obstacles → capabilities → outcomes detail; no slide-over). Plus the "Our promise" manifesto, named fixed-scope packages, an FAQ, scheduling/messaging links, and evergreen pages:

- **`/glossary/`** — the plain-English tech glossary (jargon translated the way we'd explain it over coffee; every term anchor-linkable).
- **`/email-settings/`** — the classic email setup reference (IMAP/POP/SMTP servers and ports for the major providers), an homage to one of the first pages Gene ever built for the web.
- **`/faq/`** — honest answers to the questions buyers actually have.
- **`/ai-coffee/`** — the free monthly meetup.

To add or edit a service, edit its file in `_services/`; the card and the page both update. `_layouts/service.html` renders each page.

## Contact form

The homepage form posts to the Supabase Edge Function named in `contact_form.endpoint` inside `_config.yml`. GitHub Pages only serves the static page. The function itself is `supabase/functions/contact`.

`index.ts` is a `Deno.serve` handler. It imports one ES module, `supabase/functions/contact/contact-handler.js`, which is an esbuild bundle of:

- `supabase/functions/_shared/contact-handler.js`
- `supabase/functions/_shared/contact-mail.js`
- `assets/contact-validate.js`

That bundle is committed so `supabase functions deploy contact` can run as-is. After changing any of those three sources, rebuild it first:

```bash
npm install
npm run build:fn
supabase functions deploy contact
```

`npm run build:fn` rewrites `supabase/functions/contact/contact-handler.js`. The function reads `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, and `CONTACT_TO_EMAIL` from the Supabase project. Local checks do not call Resend:

```bash
node scripts/contact-form.test.js
node scripts/mock-contact-server.js
```

## The blog

GitHub Pages builds the repo with Jekyll natively: no servers, no Actions workflow, no cost.

- **`/blog/`**: index of all posts ("The hidden menu"), styled to match the site.
- **`/feed.xml`**: Atom/RSS feed, generated by `jekyll-feed`.
- Every post is automatically bylined **posted by ⌃click · admin**.

### Publishing a post

Add one markdown file to `_posts/` named `YYYY-MM-DD-slug.md` with a title line at the top, and commit:

```markdown
---
title: "Your post title"
description: "One-sentence summary used for SEO meta tags and the blog index."
---

Post body in markdown...
```

That's it. Layout, byline, date, permalink (`/blog/slug/`), feed entry, and SEO tags (`jekyll-seo-tag`) are all automatic. The `description` line is optional but good for search results.

Images: commit them to `assets/blog/` and reference them through the `relative_url` filter so they work wherever the site is served (project path today, custom domain later):

```markdown
![alt text]({{ '/assets/blog/my-image.png' | relative_url }})
```

### Structure

| Path | Purpose |
|---|---|
| `_config.yml` | Jekyll config: plugins, permalinks, post defaults |
| `_layouts/default.html` | Shared shell: header, nav, footer, brand styles |
| `_layouts/post.html` | Article layout with the ⌃click · admin byline |
| `_posts/` | One markdown file per post |
| `blog/index.html` | The `/blog/` index page |
| `Gemfile` | Local preview only: `bundle install && bundle exec jekyll serve` |
