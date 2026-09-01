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
| `og-image.png` | Default social sharing image (the **Intermediate** card): the wordmark, the business headline ("AI That Makes Your Team Better. Not Smaller."), and the No jargon · No judgment · No mystery boxes trust line, on the warm off-white ground of human mode. Regenerate from `Logo-Assets/og-image.html` at 1200×630. |
| `og-image-beginner.png` | **Beginner** social card — the individual/family message ("AI That Works for You. Not Instead of You.") on the same light ground. From `Logo-Assets/og-image-beginner.html`. |
| `og-image-expert.png` | **Expert** social card — the CLI easter egg as a phosphor-on-black terminal ("Your Technical Peer. Not a Vendor."), matching `assets/expert-mode.css`. From `Logo-Assets/og-image-expert.html`. |

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

A small **reading-level control** (Beginner / Intermediate / Expert) sits, understated, at the top of the homepage, and it now sets *who the page speaks to*, not just how deep it goes:

- **Beginner** (default) is for individuals, families, and small businesses; the hero — "AI that works for you, not instead of you" — names the replacement fear and reframes AI as something you direct.
- **Intermediate** is for businesses weighing internal IT, an outside managed-services provider, or no solution yet — and absorbs the higher-end service band (product management & leadership, large-scale M&A migrations, family offices). It reveals a `how` line and tool-stack chips on each service card and swaps the hero headline/subhead to the team message.
- **Expert** is the CLI easter egg only — the fun terminal takeover, not an audience tier.

Both hero variants live in the DOM (crawlers see both) and one shows at a time via `html.intermediate`. The level is remembered per browser in `ctrlclick:level`, kept independent of `ctrlclick:expert` (the CLI).

On every **resource/reference page** (services, glossary, FAQ, email settings, stories) the control is pinned to Beginner and the Intermediate/Expert levels are shown *locked* (dimmed, padlocked). Tapping a locked level isn't a switch — it's a conversation hook that reveals a "schedule your free consultation to unlock" note. The locked behavior lives in `_includes/reading-level.html` and the `is-locked` branch of `assets/level.js`.

Content: six business services (Networking, Identity Management, AI Services & Automation, Team Collaboration, Email Hosting & Migration, Web Hosting & Domain Routing) and six personal services (Email Management, Device Maintenance, Basic Troubleshooting, Technology Education, Introduction to AI, Smart Phone Setup & Training). **Each service is one file in `_services/` — the single source of truth** — rendered both as a homepage card (with its `plain` one-liner, `how` line, and `stack` chips) and as its own indexable page at **`/services/<slug>/`** (full obstacles → capabilities → outcomes detail; no slide-over). Plus the "Our promise" manifesto, named fixed-scope packages, an FAQ, scheduling/messaging links, and evergreen pages:

- **`/glossary/`** — the plain-English tech glossary (jargon translated the way we'd explain it over coffee; every term anchor-linkable).
- **`/email-settings/`** — the classic email setup reference (IMAP/POP/SMTP servers and ports for the major providers), an homage to one of the first pages Gene ever built for the web.
- **`/faq/`** — honest answers to the questions buyers actually have.
- **`/ai-coffee/`** — the free monthly meetup.

To add or edit a service, edit its file in `_services/`; the card and the page both update. `_layouts/service.html` renders each page.

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
