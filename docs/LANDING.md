# Landing page copy — bkmrks

Status: draft from `docs/OFFER.md`. Do not add claims absent from
`docs/OFFER.md` or `docs/BUSINESS.md`.

> **Three notes for whoever implements this.**
>
> 1. **The H1 is locked.** `OFFER.md` § The tagline names "No more endless &
>    forgotten bookmarks" as the final, canonical tagline and says it "is not
>    rewritten downstream." So this deck ships no alternate H1s. What it does
>    ship is two alternate **subheads** (A / B in the Hero section), which is
>    the variable `BUSINESS.md` §13 explicitly sanctions. If someone wants
>    headline variants for a test, that's a decision to reopen at the offer
>    level, not here.
> 2. **The governing rule, inherited by every line below:** *"forgotten"
>    names the graveyard this ends, never a feature that remembers for you.*
>    There is no reminder, digest, or resurfacing mechanic in the product.
>    Nothing on this page may imply one.
> 3. **Price is unset.** No number, no tier, no trial, no refund window
>    appears anywhere in this deck. "Paid, no free tier" is the only
>    commercial claim that is true today, and it is stated plainly rather
>    than buried.

---

## Global

**Product name**
`bkmrks` — always lowercase, never capitalized at the start of a sentence
either. (`PROJECT_BRIEF.md` calls it a working name; `BUSINESS.md` §14 notes
it is the name everywhere in the code — package, cookies, UI. Treat it as the
name unless the founder says otherwise.)

**Domain**
`bkmrks.xyz` — **flag: `BUSINESS.md` §14 lists whether this is registered or
live as unset.** Confirm before it is printed on anything.

**Browser title** (60 char max)
> bkmrks — every post you saved on X, findable
*(44 characters)*

**Meta description** (150–160 chars)
> Every post you've ever saved on X, in one library you can search by what it
> was about — not what it said. Tag it, filter it, and share any tag as a link.
*(153 characters)*

**OG title**
> No more endless & forgotten bookmarks.

**OG description**
> Your whole X bookmark history, pulled out of the scroll into a library you
> can search by meaning, filter by author, and tag in one keystroke.

**Primary CTA label (button)**
> Sign in with X

*(This string already exists in `src/app/page.tsx`. Do not invent a new one.
It is the real next step: sign-in is the door, and the subscription gate sits
immediately behind it — see the Hero trust line, which says so out loud
rather than letting someone discover it after authorizing.)*

**Secondary CTA label**
None. One page, one offer, one action. Do not add a newsletter capture, a
follow button, a demo request, or a second button of any kind.

**Nav links**
None. This is a single-page marketing site with one action; a nav bar only
gives people exits. Put the lowercase wordmark `bkmrks` top-left, unlinked or
linked to `#top`, and nothing else.

**Footer one-liner**
> bkmrks — a private, searchable library for everything you've bookmarked on X.

**Footer legal links** (placeholders — none of these exist in the repo yet)
- `[LINK — unset: Privacy]`
- `[LINK — unset: Terms]`
- `[LINK — unset: Contact]`

*Flag for the founder: `BUSINESS.md` §14 lists data residency, retention, and
any deletion/DSAR process as undecided. A privacy policy has to exist before
this page is public, and this deck cannot write it.*

---

## Hero

*Purpose: name the person, the graveyard, the after. One action.*

**Eyebrow** (optional)
> For people with 2,000 bookmarks

**H1**
> No more endless & forgotten bookmarks.

*Locked. See note 1 at the top of this file — the headline is not a variable.*

**Subhead** — canonical version, use this unless testing
> Every post you've saved on X, in one library you can search by what it was
> about — not what it said.

**Subhead alternate A**
> Search everything you've ever saved by what it was about — not what it
> said, who posted it, or where it landed in the scroll.

**Subhead alternate B**
> Your entire X bookmark history, pulled out of the scroll into a library you
> can search, tag, and share one link from.

*Never run the H1 without one of these three. The subhead carries the
mechanism, which is what forecloses the "it reminds me" misreading before
anyone can take it.*

**Primary CTA**
> Sign in with X

**Trust line under the button**
> Read-only — bkmrks can't post, like, follow, or DM from your account.
> Paid, no free tier.

*Both halves are true and both belong here. The first is architectural, not a
setting (`src/lib/x.ts` is read-only by design). The second is the product's
own existing posture — the subscribe page already tells people there's no
free tier rather than burying it, and the landing page should not be less
honest than the app.*

**Hero visual direction**
One shot of the after, not a feature tour: a vague, half-remembered
description typed into the search field, and the four-month-old thread it
pulls back — a plain, boxed library of saved posts, not a dashboard collage
and not a feed.

**What not to put in this section**
No screenshots of the settings page or the tag manager. No metrics, user
counts, logos, or "trusted by." No product tour. No second button. No mention
of tags, sharing, or public pages — those are earned further down the page,
and crowding the hero with them costs the one idea it has to land.

---

## Problem

*Purpose: make them nod. No product yet.*

**H2**
> You saved it. That's the last time you saw it.

**Body — three beats**

> **Saving costs nothing.** One tap, no decision. A pricing thread, a
> teardown worth stealing from, the exact argument you'll want later. Monday
> you save four. By Friday, twenty-five.

> **The pile grows faster than anyone reads it.** It's one column, newest
> first. No tags. No groups. No way to say "show me the ones about hiring."
> X doesn't even record *when* you bookmarked something — only the order it
> hands them back — so there's no sorting your way out.

> **Then you need one, and it's gone.** You remember what the post
> *argued* — not its wording, not who wrote it, not where it sits in a
> 3,000-item scroll. So you scroll for ninety seconds, give up, and
> reconstruct the point from memory, worse than the original. The post is
> still in there. You just can't reach it.

**Closing one-liner — names the enemy**
> Native bookmarks aren't a library. They're a list you never reopen.

**What not to put in this section**
No product name, no features, no screenshots, no CTA. This section exists to
be recognized, not to sell. Do not soften it into "bookmark management can be
challenging" — the specificity is the whole job.

---

## After / promise

*Purpose: the week after they use it.*

**H2**
> The pile stops being a pile.

**Subhead**
> Same Tuesday. Someone asks you the thing. You type what the post was about
> — "hiring a first salesperson too early" — and the thread is on screen.

**Outcome bullets**

> **Find the thread you saved four months ago from memory of its argument,
> in one query.** Not by scrolling to it. By describing it. You didn't
> remember the author. You didn't remember the phrasing. You didn't need to.

> **Get through this week's saves in one sitting, and be finished.** They're
> at the top by default, and the ones you haven't filed yet are one click
> away behind an "Untagged" filter — so triage has an end instead of being
> an infinite scroll.

> **Stop treating bookmarks like a trash drawer.** Saving starts paying off,
> so you start saving deliberately. And when a post you saved gets deleted
> off X, your copy of the text is still sitting in your library.

**One-sentence promise**
> Every post you have bookmarked on X, in one place you can search by meaning
> and actually get back out.

**What not to put in this section**
No feature names. Every bullet is a result — "Full-text search and tag
filters" is the failure mode. Nothing that implies the product brings saves
back to you unprompted: no *remind*, *resurface*, *digest*, *unread*,
*nudge*, or "never forget a bookmark again." The library is reachable on
demand; it does not come to you.

---

## How it works

*Purpose: mechanism, so the promise feels possible. Three steps, no more.*

**H2**
> Three steps, then it's just there.

**Step 1 — Sign in with X**
> No developer account, no API key, no X Premium. bkmrks reads your bookmarks
> through X's official API using your own authorization.

**Step 2 — Your whole history copies over**
> Every post you've ever bookmarked gets pulled out of X's list and into a
> library of its own — text, author, images. A big pile takes a few minutes,
> and search keeps sharpening over the first day as indexing catches up.

**Step 3 — Describe what you're looking for**
> Type what the post was about, not what it said. Narrow by who wrote it, or
> by a tag you typed on the card. They stack: everything from one person,
> tagged one way, about one idea, is a single view.

**Reassurance line**
> Read-only scopes, your own token, encrypted at rest. There is no code path
> in bkmrks that can post, like, follow, reply, or DM — that's architecture,
> not a setting you have to trust.

**What not to put in this section**
No architecture. The words *sync engine*, *backfill*, *watermark*,
*embeddings*, *vectors*, *pgvector*, *cosine similarity*, *semantic search*,
*source order*, and *server-rendered* are all banned from the page. The one
plain term the mechanism gets is **searches by meaning**, and it's enough.
Do not add a fourth step.

---

## What you get

*Purpose: the value exchange, in outcomes.*

**H2**
> What you walk away with.

**Item 1 — Everything you already saved, in one place**
> Not a window onto X's list. Your full bookmark history, copied over on
> first sign-in, sitting in a library that's yours to search.

**Item 2 — Any one post, from a vague memory, in seconds**
> You remember the argument, not the wording. That's now enough to find it.

**Item 3 — The bottom of the pile, for the first time**
> One toggle reads your library oldest-first, where the saves X buried
> hardest have been sitting untouched since the day you made them.

**Item 4 — A copy that outlives the post**
> Your saves are copied, then re-checked against X daily. When a post gets
> deleted, your copy of its text stays readable instead of turning into a
> dead link.

**Item 5 — A share link for any slice of it**
> Tag ten posts "pricing," flip that one tag public, copy the link. Anyone
> can open it with no account, and they see exactly those ten posts —
> nothing else you own becomes visible, ever.

**What not to put in this section**
No internal system names. No feature grid, no icon wall, no module list. Do
not add a sixth item to fill a layout — five is the ceiling, four is fine.

---

## Who it's for / not for

*Purpose: qualify hard. Fewer junk signups, more trust.*

**H2**
> Worth it for some people. Not for most.

**This is for you if**
> - You've been on X for years and save constantly — somewhere between 800
>   and 5,000 deep.
> - You've never once successfully searched that pile.
> - You've already tried to fix it: a Notion page of pasted links that died
>   in a week, a browser folder, a DM to yourself.
> - You want a running public list of what you're saving that isn't your
>   posting feed.

**This is not for you if**
> - You save things from all over the web. X bookmarks are the only input —
>   no extension, no share sheet, no URL saver.
> - You want a free tool. There is no free tier, and no trial.
> - You want to take notes on your saves. This stores what you saved; it
>   doesn't let you annotate it.
> - You need to search exact strings, URLs, or quoted phrases. Search here
>   works on meaning, not literal text.
> - You want your data on your own machine. This is a hosted app with a
>   hosted database.
> - You're a team. Everything is scoped to one person's account.

**What not to put in this section**
Do not soften the "not for you" column — it is doing more conversion work
than the "for you" column is. Do not turn either list into a comparison with
a named competitor. No CTA here.

---

## Objections (FAQ)

*Purpose: kill the reasons they leave.*

**H2**
> The obvious questions.

**Q: Isn't this just X bookmarks with extra steps?**
> X gives you one reverse-chronological list. No tags, no grouping, no
> meaning-based search, no sharing, no export — and no record of when you
> bookmarked anything, only the order it comes back in. There's no discipline
> or folder scheme that fixes that, because the limit is in the tool. The only
> move available inside X is to save less. bkmrks adds all of it on top of
> the same bookmarks.

**Q: Does my library leave my machine?**
> Yes, and that should be in front of you before you sign in. bkmrks is a
> hosted app: a copy of your bookmarked posts lives in its cloud database,
> not on your computer. There is no local mode and no offline mode. The text
> of your saves is also sent to an outside service that indexes it by
> meaning — that's what makes the search work. What that buys you is
> permanence and retrieval; what it costs you is trusting someone else's
> server. Your X tokens are stored encrypted rather than in plain text, and
> the sign-in cookie in your browser carries only *which* account you are, so
> it can't be stolen and replayed against X.

**Q: Do I need X Premium, an API key, or a developer account?**
> No. You sign in with your normal X account and that's the whole setup. The
> API access belongs to the product, not to you. Nothing here is gated on X
> Premium.

**Q: Can it post, like, or follow from my account?**
> No, and not as a matter of policy. The scopes requested are read scopes,
> and there is no code in bkmrks that posts, likes, follows, replies, or DMs
> — so there's no setting to misconfigure and nothing to take on faith. It
> reads your own bookmarks and nothing else.

**Q: Could using this put my X account at risk?**
> The posture is the conservative one: the official X API, your own
> authorization, reading only your own bookmarks, and posts displayed
> verbatim with attribution and a link back to the original — that last part
> is X's own display requirement, and it's followed. What can't be offered is
> a guarantee about X's future policy, and pretending otherwise would be
> worse than saying so.
>
> **⚠ FOUNDER GATE — do not publish this answer until X's current developer
> policy is re-read and this wording checked against it.** `BUSINESS.md` §14
> flags X ToS/API risk as an open item and §13 attaches the same note to this
> exact objection. If the review comes back unclear, cut the question rather
> than hedge it further.

**Q: Why does it cost money? It's a bookmark viewer.**
> X's API meters per request — reading your bookmarks costs real money on
> every sync, and so does indexing them so they can be searched by meaning.
> There's no free tier because there's no free read.

**Q: What if I want out?**
> Revoke the app's access in your X settings whenever you like. Your actual X
> bookmarks are untouched — nothing here ever modifies them, so walking away
> costs you nothing on X's side. Access to the library itself runs on an
> active membership. Worth knowing up front: there's no export yet, so what
> you build here doesn't currently come out with you.

**Q: Why won't I ignore this like I ignore my bookmarks?**
> You might, and bkmrks will not nag you about it. There's no digest, no
> reminder, no weekly email, nothing that pulls you back. What changes is the
> payoff when you *do* open it. Bookmarks get ignored because retrieval fails
> — you go looking, you don't find it, you learn not to look. Fix retrieval
> and the trip is worth making. That's the whole bet, and it's a bet on the
> moment you need something, not on a new daily habit.

**What not to put in this section**
Never the phrase "not decided yet" — this is a public page. Anything unset
(price, billing period, refunds, what happens to stored data on cancellation,
data residency) is either answered as what's true today or the question is
cut. Do not add an FAQ about a feature that doesn't exist in order to hint
that it's coming.

---

## Comparison

*Purpose: one contrast table. Outcome language only, three rows.*

**H2**
> Native X bookmarks vs. bkmrks

| | Native X bookmarks | bkmrks |
|---|---|---|
| **Finding one post again** | Scroll a single list, newest first, until you spot it | Describe what it was about and it's on screen |
| **Narrowing it down** | No tags, no groups, no author filter — one column, take it or leave it | Tag, author, and topic stack into a single view |
| **Handing someone your best links** | Re-collect them by hand in a DM, or spend a post on it | Flip one tag public, copy the link |

**What not to put in this section**
Only X. Do not name read-later apps, note-taking tools, or any other product
by name. No feature checkmark grid — three outcome rows, then stop.

---

## This is not a feed

*Purpose: positioning contrast. The plainness is the product, not a shortfall.*

**H2**
> Built to be closed.

**Body**
> No infinite scroll. No engagement counts. No algorithm deciding what you
> see next. A reading mode strips out avatars and collapses images so your
> saves read as text. It looks like a filing cabinet because that's what it
> is — you come in to get one thing, and you leave.

**What not to put in this section**
No dunking on X as a company. This is a statement about what the tool is, not
a culture-war position. Keep it to three or four lines; it's a note, not a
manifesto.

---

## Final CTA

*Purpose: restate the offer. No new information.*

**H2**
> No more endless & forgotten bookmarks.

**Supporting line**
> Sign in, let your history copy over, and search for the one you've never
> been able to find.

**Primary CTA**
> Sign in with X

**Risk reversal — one line**
> Read-only, so nothing here can touch your X account — and revoking access
> leaves your actual bookmarks exactly as they are.

**What not to put in this section**
No new features, no urgency device, no fake scarcity, no countdown. No money-
back guarantee or refund window — none exists, and `OFFER.md` § Risk reversal
is explicit that one can't be implied. Do not restate the price, because
there isn't one to state.

---

## Microcopy kit

Ready-to-paste strings.

**Primary button**
- Default: `Sign in with X`
- Hover: *(no label change — visual state only)*
- Loading: `Taking you to X…`
- Success / returning signed-in user: `Go to dashboard` *(this string already
  exists in `src/app/page.tsx` — reuse it, don't reinvent it)*
- Error: `That didn't go through. Try again.`

**Auth permission one-liner** (shown next to the button, or on the X consent
hand-off)
> X will ask you to allow read access to your bookmarks and profile. That's
> all bkmrks asks for, and all it can use.

**Post-sign-in, membership gate** *(reuse the app's existing voice)*
> bkmrks is a paid dashboard. An active membership is required — there's no
> free tier.

**First-run empty state** *(the app's real string — keep it)*
> No bookmarks synced yet — if you just signed in, the first sync runs in the
> background and may take a moment. Try Refresh.

**Copy-link confirmation**
> Copied!

*This is the one exclamation mark the brand allows. It already exists in the
product. Do not add a second one anywhere.*

**404**
> Nothing here. Unlike your bookmarks, this one really is gone.

**Cookie banner**
Not written here. `BUSINESS.md` §14 lists data residency and retention as
undecided; a banner shouldn't be drafted ahead of the policy it points at.
`[COPY — unset: pending privacy policy]`

**Waitlist email field**
Not applicable — there is no waitlist. The primary action is sign-in, and no
email is collected anywhere on this page. If a waitlist is ever added, it is
a second conversion goal and needs an offer-level decision first.

---

## Voice checklist for whoever implements this

**Words we use**
endless · forgotten · library · pile · buried · graveyard · find · reopen ·
get it back · what it was about · saved for later and never later · your
copy · one query · the bottom of the pile · hand someone the link · bookmarks
· saved · tag · public page · share link · search · filter · refresh · clean
· your own

**Words we kill**
- *Hype:* synergy · all-in-one · unlock · seamless · next-gen · robust ·
  solution · deliverables · platform · supercharge · effortlessly ·
  revolutionary · AI-powered · game-changing · 10x · second brain ·
  knowledge graph
- *Internal vocabulary the buyer doesn't share:* sync engine · backfill ·
  watermark · embeddings · vectors · pgvector · cosine similarity · semantic
  search · source order · soft delete · server-rendered
- *Killed for accuracy, not style:* remind · reminder · resurface · digest ·
  nudge · alert · unread · review queue · "bring it back to you" · "never
  forget a bookmark again" — the product has no mechanism for any of it
- *Killed as an overclaim:* "own your data" as an absolute (no export yet) ·
  "free" in any form

**Mechanical rules**
- `bkmrks` is always lowercase, including at the start of a sentence.
- Never write "we." The product is the subject: "bkmrks can't post," not "we
  don't post." Every string in the app today follows this.
- No exclamation marks. The single exception is `Copied!`, which already
  ships.
- Describe what a thing does, then stop. No sentence exists to add warmth.

**Claims we will not make**
- That it reminds you, resurfaces saves, emails a digest, or gives you an
  unread queue.
- That you'll "never forget a bookmark again," or any phrasing where the
  product does the remembering.
- That you can export your library, or that you're "not locked in."
- That anything is stored locally or works offline.
- That it saves anything from outside X.
- That you can search exact phrases, URLs, or quotes reliably.
- That there's a free plan, a trial, a refund, or any specific price.
- That you can annotate, highlight, star, or take notes on a save.
- That it works for teams.
- Anything about what happens to your data when you cancel, or which region
  it's stored in. Both are undecided, and a landing page is the wrong place
  to decide them.
- Any user count, testimonial, logo, rating, or "used by" claim. There are
  none, and inventing one is the fastest way to lose this audience.
