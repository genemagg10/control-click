CTRL+CLICK — AI & IT SOLUTIONS
Logo production files · v1 · The Layered Keycap (subtle peek, locked)
────────────────────────────────────────────────────────────────────

WHAT THIS IS
A control key with a hidden layer peeking out behind it, and the caret
set in the reveal colour so it reads as a window down to what's underneath.
The mark performs the promise: there's more here than you first see.

Geometry is LOCKED (subtle peek, soft corners). Both colourways are
included as finals — pick the one you want to lead with:
  • TEAL  reveal — cool, technical, core palette
  • CORAL reveal — warm, human "the warmth is what's underneath"
In both, the wordmark's "Click" stays teal so the family holds together.


FOLDERS
01-mark-svg/        The mark alone, transparent background. Vector — scales
                    to any size. "on-dark" has a light key (for dark
                    backgrounds); "on-light" has a navy key (for light
                    backgrounds). Teal + coral.

02-icons-favicons/  App-icon tiles (rounded square) + favicons.
   teal/ · coral/
     icon-navy-*.png    Navy tile (primary app icon) — 512 / 180 / 32 / 16
     icon-light-*.png   Light tile — 512 / 180 / 32 / 16
     favicon-*.png      Tight-crop for the browser tab — 48 / 32 / 16
     *.svg              Vector sources
   → 512 = web / general.  180 = Apple touch icon.  32 / 16 = favicon.

03-lockups/         Full wordmark lockups, high-res PNG (font baked in).
                    horizontal + stacked × dark + light × teal + coral.
                    Horizontal for site headers & directory listings;
                    stacked for avatars & square spaces.

04-avatars/         1024px square tiles for social profiles (LinkedIn,
                    Yelp, chamber thumbnail). Navy tile + light tile,
                    teal + coral.

Ctrl+Click-Brand-Sheet.pdf   One-page spec: palette + hex, clear space,
                             minimum sizes, do & don't.


USING THE FAVICON (website)
Use favicon-32.png and favicon-16.png (the tight-crop versions read best
at tab size). In your <head>:
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="icon-navy-180.png">


TONE — HUMAN FIRST, IN DAYLIGHT
The brand leads with warmth and plain language: it's about people getting
more capable, not IT getting cheaper. No enterprise chest-thumping, no
price-led headlines, no jargon. Anything that carries a message — the
social image, avatars, lockups — leads with the LIGHT (human-mode) palette:
off-white ground, navy ink, teal + coral accents. The dark navy ground is
reserved for the app-icon tile and the terminal "expert mode" easter egg,
not for the everyday face of the brand.

PALETTE
  Navy        #0E1626   ink, app-icon tile, key face on light, the CLI
  Off-white   #F2F5F7   default (human-mode) ground, key face on dark
  Teal        #1E9C8C   the mark, the caret, "Click", large accents
  Teal (text) #146E63   teal as text/links on light — AA-contrast
  Coral       #E8674C   warm accent — alternate reveal, the meetup
  Coral (btn) #C7492F   coral as a button ground — AA with white text

TYPE
  Archivo (800) — wordmark        JetBrains Mono (500) — service line
  Both are free on Google Fonts.


SOCIAL IMAGE (og-image)
og-image.html   1200×630 template for the link-preview / social card. It
                mirrors the live homepage hero in human mode: the wordmark,
                the human-first headline ("AI That Makes Your Team Better.
                Not Smaller."), and the No jargon · No judgment · No mystery
                boxes trust line, on the warm off-white ground. Edit the
                copy here, then render with headless Chromium at 1200×630
                to produce the repo's /og-image.png. Keep it light and
                human — never revert to the old dark, price-led card.

Need any other size, a real .ico bundle, an animated version, or the
mark tweaked — just ask.


────────────────────────────────────────────────────────────────────
05-wordmark-only/   The wordmark WITHOUT the keycap mark — for the
                    website header and primary branding, where the
                    favicon/app icon carries the keycap on its own.
                    horizontal + stacked × dark + light. Teal.
