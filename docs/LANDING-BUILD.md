# Landing page — build notes

The landing page is the app's `/` route, server-rendered by Next.js.

| | |
|---|---|
| Markup | `src/app/page.tsx` |
| Styles | `src/app/landing.css` |
| Copy source | `docs/LANDING-FULL.md` (verbatim) |
| Claims lock | `docs/OFFER.md`, `docs/BUSINESS.md` |
| Refs | `docs/ref-01-frames.png`, `docs/ref-02-paintings.png`, `docs/ref-03-color-boards.png` |

## How to open it

```bash
npm install
npm run dev        # http://localhost:3000
```

The page renders without a database. `SESSION_SECRET` must be set for the
session cookie to decrypt; with no cookie present the page renders the
signed-out state and the CTA points at `/login`.

```bash
SESSION_SECRET=$(openssl rand -hex 32) npm run dev
```

For a production check: `npm run build && npm start`.

## Fonts

Both are self-hosted at build time via `next/font/google` — no runtime request
to Google, no FOUT beyond `display: swap`.

| Role | Face | Weights |
|---|---|---|
| Headlines, body, pull quotes, step numerals | **Newsreader** (transitional serif, real italics) | 300 / 400 / 500, upright + italic |
| Micro labels, frame running type, buttons, table headers, trust lines | **IBM Plex Mono** | 400 / 500 |

No Inter, no `system-ui` as the brand face. The emotional word in a headline is
italic, once per headline (`<em>`).

## Colour tokens

Declared on `.landing` in `src/app/landing.css`.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0b0b0b` | Page field |
| `--paper` | `#f4efe6` | Type on ink; cream band field |
| `--paper-dim` | `#a8a196` | Secondary body on ink (7.7:1) |
| `--orange` | `#e85c2a` | Colour hit; primary CTA field |
| `--blue` | `#1f4fd8` | Printer-blue band field |
| `--blue-bright` | `#5c8bff` | Blue micro type on ink (6.2:1) |
| `--teal` | `#2a9b8f` | Duotone texture, eyebrows, constraint labels |
| `--rule` | `rgba(244,239,230,0.18)` | Hairlines on ink |
| `--rule-ink` | `rgba(11,11,11,0.22)` | Hairlines on paper/orange |

### Contrast

Every text/field pair on the page clears **WCAG AA for normal text (4.5:1)**, so
no combination depends on the large-text exemption.

| Pair | Ratio |
|---|---|
| paper on ink | 17.2 |
| paper-dim on ink | 7.7 |
| ink on orange (CTA, body, headlines) | 5.6 |
| orange on ink (pull quote, numerals) | 5.6 |
| teal on ink | 5.8 |
| blue-bright on ink | 6.2 |
| paper on blue | 5.8 |
| ink on paper | 17.2 |

The brief's `--blue: #2f6bff` was **darkened to `#1f4fd8`** for the band field:
at `#2f6bff`, paper-on-blue is 3.9:1 and ink-on-blue 4.4:1 — neither passes for
normal text. The original printer blue survives as `--blue-bright`, used only
for type on ink (the hero frame's running micro-type), where it measures 6.2:1.

## Section IDs

Order and IDs follow `LANDING-FULL.md` §22 exactly.

| # | ID | Band | Layout |
|---|---|---|---|
| — | `top` | ink | Sticky nav: wordmark, three in-page anchors, CTA |
| 1 | `hero` | ink | Inset framed poster; 60/40 type vs texture split |
| 2 | `problem` | ink | One unbroken column, hairline-ruled beats |
| 3 | `stakes` | ink | 40/60 asymmetric split, then a large orange pull quote |
| — | *(interstitial 1)* | ink | Single centred line between hairlines |
| 4 | `after` | **orange** | 50/50 split, then the promise set large |
| 5 | `outcomes` | ink | 3×2 hairline board, numbered `01`–`06`, no icons |
| — | *(interstitial 2)* | ink | Single centred line between hairlines |
| 6 | `how` | **blue** | Three steps in one horizontal strip, hairline dividers |
| 7 | `walkthrough` | ink | One framed product-UI object + three caption panels |
| 8 | `usecases` | ink | Three columns of type under 2px paper rules |
| 9 | `compare` | **paper** | Typographic table, ink on paper |
| 10 | `fit` | ink | Two equal columns, vertical rule between |
| 11 | `trust` | ink | Four constraints + counterweight, equal cells |
| 12 | `faq` | **paper** | `<details>` accordion, serif questions, first open |
| 13 | `final` | **orange** | Last colour hit; CTA inverts to an ink rectangle |
| — | footer | ink | Two columns + base line |
| — | sticky | orange | Mobile only, appears once `#hero` leaves the viewport |

Nav anchors are `#how`, `#outcomes`, `#faq`. All sections carry
`scroll-margin-top` so the sticky nav never covers a heading on jump.

## Which ref drove which band

**Ref 1 — dark framed posters → page chrome.**
The hero is the ref's inset poster, one-to-one: near-black field, heavy outer
margin, a hairline-ruled inner panel, and the locked H1 running as tracked-out
micro-type around all four edges of the card in printer blue. The vertical runs
use `writing-mode: vertical-rl` (the left run rotated 180°, as in the ref) and
are inset top and bottom so they never collide with the horizontal runs at the
corners. The ref's small footer URL slot becomes the wordmark line — the domain
is unset in `BUSINESS.md` §14, so no URL is printed. The running frame appears
on the hero only, plus one horizontal run across the top of `final`; it is
deliberately not repeated on every section.

**Ref 2 — classical paintings → texture only.**
No painting, no portrait, no halo type. The ref contributes its *grade*: the
narrow vertical panel at the right of the hero frame is a CSS-only teal duotone
film — a `feTurbulence` grain layer, horizontal paper fibre, and cracked-varnish
hairlines on a teal-to-ink gradient, dropped low enough that it never competes
with the H1 or the CTA. The same grain sits at 7–10% over every colour band.
Nothing was sourced from stock.

**Ref 3 — colour boards → type, colour, grid.**
The three colour hits are the ref's panels: orange with black type (`after`,
`final`), printer blue with paper type (`how`), cream with black type
(`compare`, `faq`). Stacked serif headlines fill their panels, with one italic
turn each. The `05 / VISUAL LANGUAGE` device becomes the numbered micro-label
and hairline that opens every section. The ref's black logo chip on the orange
panel becomes the inverted ink CTA rectangle in `final`. The equal-panel row
recurs as the outcome board, the step strip, the use-case columns and the
constraint grid.

## Browser furniture and button states

`LANDING-FULL.md` §1 browser furniture:

| Item | Where |
|---|---|
| Favicon | `src/app/icon.svg` — a flat mono bookmark mark, paper on ink. The deck allows the 🔖 glyph or a flat mark; the app's share text does not actually use the emoji, and the deck forbids a wordmark at 16px, so the mark it is. |
| Apple touch icon | `src/app/apple-icon.png` (180×180, rendered from the same mark). Next's file convention takes PNG here, not SVG. |
| Install name | `applicationName` / `appleWebApp.title` in `src/app/layout.tsx` |
| Theme colour | `viewport.themeColor` in `src/app/page.tsx` (`#0b0b0b`) |

§16 button states, all four that this page can reach:

| State | Copy | How |
|---|---|---|
| Default | `Sign in with X` | — |
| Hover | *(visual only)* | Inverts to paper field |
| Loading | `Taking you to X…` | A click sets `aria-busy`, freezes the width and swaps the label. The string lives on the element as `data-loading`, never in the script. The field colour is kept so contrast never drops, and `pointer-events` is dropped so it can't fire twice. |
| Returning, signed in | `Go to dashboard` | Session cookie present; CTA points at `/app` |
| Generic failure | `That didn't go through. Try again.` | Rendered on the hero CTA when `login_error` is present — the button next to the banner is the one that carries the retry. The nav, final and sticky CTAs keep the standing ask. |

The failed/denied OAuth banner (§16) uses the deck's copy verbatim and is
triggered by the `login_error` param that `src/app/api/auth/callback/route.ts`
and `src/app/login/route.ts` already redirect with. The raw error string is not
printed — the designed copy replaces it.

Two §16 states are deliberately **not** on this page: *Disconnected or expired X
access* is an `/app` state (no param for it ever arrives at `/`, and inventing
one would be fiction), and the §17 404 copy belongs to a `not-found` route that
does not exist yet.

## Motion

Almost none. The hero's horizontal frame runs creep at 150s per cycle
(tickertape speed), reversed on the bottom edge. The sticky mobile bar
translates in over 160ms. Both are disabled under
`prefers-reduced-motion: reduce`. No parallax, no scroll reveals, no bounce.

## Copy decisions — what is deliberately not on the page

Everything on the page is verbatim from `LANDING-FULL.md`. Four things it
specifies are intentionally withheld:

1. **FAQ: "Could using this put my X account at risk?"** — `LANDING-FULL.md`
   §13 puts a founder gate on this answer: it may not publish until X's current
   developer policy is re-read and the wording checked against it
   (`BUSINESS.md` §14, §13). Publish it only after that review; if the review is
   unclear, the deck says cut the question rather than hedge it.
2. **Footer column 2 (Legal).** `LANDING-FULL.md` prints Privacy, Terms and
   Contact as `[LINK — unset]`. None of them exist in this repo, and
   `BUSINESS.md` §14 lists data residency, retention and deletion/DSAR as
   undecided. A page that takes an OAuth grant and a subscription while linking
   to a dead `/privacy` is worse than one short a column, and the literal
   placeholder text must never ship. **This is a launch blocker, not a nit** —
   write the policy, then add the column.
3. **Copyright line.** `[COPYRIGHT — unset: © <year> <entity name>]`. The legal
   entity is unset.
4. **Canonical URL and OG image.** `BUSINESS.md` §14 lists whether `bkmrks.xyz`
   is registered or live as unset, so no canonical tag and no absolute
   `metadataBase` are emitted. The OG/Twitter titles and descriptions from §1
   *are* set. Add the canonical and the OG image once the domain is confirmed.

Also honoured: no price, tier, trial or refund; no testimonials, logos, user
counts or fake avatars; no waitlist or email field; no cookie banner; no
countdown or scarcity. "No export yet" is on the page in both the comparison
table and the trust strip, as `LANDING-FULL.md` §20 requires.

### The one product-UI object

`walkthrough` renders the app's search surface once, framed on black. Every
string inside it is one the app actually renders — `Your bookmarks`,
`Recently saved`, `Search your bookmarks…` (shown filled), `Filter by @handle…`,
`Untagged`, `Show oldest first`, `Manage tags` — all verified against `src/`.
The typed query is the one `LANDING-FULL.md` §5 itself uses. **No bookmark
result is drawn**, because any post shown there would be fabricated content, and
§8's rule is explicit: a screenshot with invented labels is a false claim with
extra steps. The three moments are carried as captions, which is what §8 asks
for. Replace the frame with real screenshots whenever they exist.

## Short variants

`LANDING-FULL.md`'s mobile short variants are honoured in CSS, not JS. Under
700px the page swaps to the mobile headings for `problem` and `how`, and drops
the hero's secondary anchor link, the permission one-liner, the frame mark, and
the second problem beat — the three the deck names as cuttable. The reassurance
line under the steps and the counterweight in the trust strip are never cut, at
any width.
