# Full landing copy — bkmrks

**Page type: C — Sign in and use now.**
**Primary CTA: `Sign in with X`**
**Source:** `docs/LANDING.md` (seed) + `docs/OFFER.md` (promise, objections, risk
reversal) + `docs/BUSINESS.md` (hard limits on what is true).

---

### Why type C, and not A / B / D

The page does not exist yet. The product does. `/login` runs live OAuth 2.0 +
PKCE, the callback routes straight to `/app` or `/subscribe` depending on
membership, and Phase 0 was verified against a real account. There is no
waitlist table, no "notify me" route, and no extension anywhere in the repo —
`OFFER.md`'s only mention of a waitlist is as a future *email asset*, not a
product state. So the visitor can act today, and the page asks them to.

That decision kills four things by itself: no waitlist form, no launch email
#1, no "coming soon" framing, no install/download step. They are in the Cut
List with reasons.

### Three inherited locks (do not renegotiate these in layout)

1. **The H1 is locked.** `OFFER.md` § The tagline: final, canonical, "not
   rewritten downstream." The brief invites beating it on specificity — it is
   not available to beat. Two rejected hero options are documented in §2 so
   the reasoning is on record.
2. **The governing rule.** *"Forgotten" names the graveyard this ends, never a
   feature that remembers for you.* No reminder, digest, or resurfacing
   mechanic exists. Nothing on this page may imply one.
3. **Price is unset.** No number, tier, trial, or refund anywhere. "Paid, no
   free tier" is the only true commercial claim and it appears above the fold.

### Build note for the implementer

The CTA must point at the live app's `/login` route on whatever host the app
is deployed to. `bkmrks.xyz` appears in `DEPLOY.md` as the intended custom
domain but `BUSINESS.md` §14 lists **whether it is registered or live as
unset** — confirm before printing it anywhere or hard-coding it in a link.

The app's current one-line landing copy — *"See every tweet you've bookmarked
on X, in one clean dashboard."* — is **retired by this deck**. It is accurate
but it sells a dashboard, and the dashboard is not the thing anyone wants.

---

## 0. Page story

*For the implementer. Not on-page.*

- **Hook** — You have somewhere between 800 and 5,000 X bookmarks and you
  have never once successfully searched them.
- **Wound** — You go looking for the one you need, you fail, and you rebuild
  the point from memory, worse than the original. The post is still in there.
- **After** — You type what the post was *about* and it's on screen. You
  didn't remember the author or the wording. You didn't need to.
- **Mechanism** — Your bookmarks get copied out of X's list into a library of
  their own, and every post is indexed by meaning, so a search matches an
  idea against an idea instead of a word against a word.
- **Ask** — Sign in with X. Read-only. Paid, no free tier, said out loud
  before anyone authorizes anything.

**The single thing this page must make the visitor believe:**

> **"I will actually be able to find the thing."**

That is the entire bet. `OFFER.md` states it plainly: bookmarks get ignored
because retrieval fails — you go looking, you don't find it, you learn not to
look. If the visitor believes retrieval works, the OAuth grant and the
subscription both become costs worth paying. If they don't, no amount of
tagging, sharing, permanence, or reading-mode copy will save the page.

**Corollary for anyone tempted to reorder sections:** every section either
builds that belief or gets out of its way. Publishing and public pages are
real and valuable, but they are the *unexpected* second act — they arrive
after retrieval is believed, never before.

---

## 1. Global chrome

### SEO

**Title tag** (60 max)
> bkmrks — every post you saved on X, findable
*(44 characters)*

**Meta description** (150–160)
> Every post you've ever saved on X, in one library you can search by what it
> was about — not what it said. Tag it, filter it, and share any tag as a link.
*(153 characters)*

**Canonical**
> `[CANONICAL — unset: https://<confirmed-domain>/]`

### Social cards

**OG title**
> No more endless & forgotten bookmarks.

**OG description**
> Your whole X bookmark history, pulled out of the scroll into a library you
> can search by meaning, filter by author, and tag in one keystroke.

**X / Twitter card description** (shorter — the card truncates hard)
> Every post you've saved on X, in one library you can search by what it was
> about. Not what it said.

**OG image — direction, not copy**
The search box with a vague phrase typed into it and one result below it. No
logo lockup, no gradient, no stock photography. If the image has words, they
are the H1 and nothing else.

### Browser furniture

- **Favicon:** the bookmark glyph already used in the app's share text (🔖) or
  a flat mono mark. No wordmark at 16px.
- **Apple touch / install name:** `bkmrks`
- **Theme color:** follow the app — neutral on white, full dark mode that
  follows the OS.

### Nav

Wordmark `bkmrks` top-left, lowercase, linked to `#top`. Then:

- `How it works` → `#how`
- `What you get` → `#outcomes`
- `FAQ` → `#faq`
- **`Sign in with X`** (button, right-aligned, always visible)

*Four items and the button. In-page anchors only — no external links, no
dropdowns, no blog, no pricing link (there is no price to link to). If the
design wants a barer nav, cut the three anchors before you cut the button.*

### Footer

**Column 1 — Product**
- How it works
- What you get
- Who it's for
- FAQ

**Column 2 — Legal** *(placeholders — none of these exist in the repo yet)*
- `[LINK — unset: Privacy]`
- `[LINK — unset: Terms]`
- `[LINK — unset: Contact]`

**Column 3 — One-line positioning**
> bkmrks — a private, searchable library for everything you've bookmarked on X.
> Read-only. Paid, no free tier.

**Footer legal line**
> `[COPYRIGHT — unset: © <year> <entity name>]`

> ⚠ **Founder gate.** `BUSINESS.md` §14 lists data residency, retention, and
> any deletion/DSAR process as undecided. A privacy policy has to exist before
> this page is public — a page that takes an OAuth grant and a subscription
> and links to a dead `/privacy` is a worse problem than a missing section.

### Sticky bar

**Mobile** (bottom, persistent after the hero scrolls out)
> **Sign in with X**
> Read-only · Paid, no free tier

**Desktop**
No sticky bar. The nav button is always visible and already does this job;
a second persistent CTA on desktop is noise.

### Cookie / consent

**None.** Default to no banner. Nothing in the repo sets an analytics or
advertising cookie — the only cookies are the encrypted session and the
reading-mode preference, both strictly functional. If a tracker is added
later, the banner gets written then, against the real policy.

---

## 2. Hero

**Section ID:** `hero`
**Purpose:** Name the person, the graveyard, and the after — then ask, once.

**Eyebrow**
> For people with 2,000 bookmarks

**H1** *(locked)*
> No more endless & forgotten bookmarks.

**Subhead — ship this**
> Every post you've saved on X, in one library you can search by what it was
> about — not what it said.

**Subhead — alternate A** *(for a wider hero)*
> Search everything you've ever saved by what it was about — not what it said,
> who posted it, or where it landed in the scroll.

**Subhead — alternate B** *(leads with scope over mechanism)*
> Your entire X bookmark history, pulled out of the scroll into a library you
> can search, tag, and share one link from.

*Never run the H1 without one of these three. The subhead carries the
mechanism, and the mechanism is what forecloses the "so it reminds me?"
misreading before anyone can take it.*

**Primary CTA**
> `Sign in with X`

**Secondary text link** *(optional, low emphasis, in-page anchor only)*
> See how it works ↓  → `#how`

*This is navigation, not a second conversion goal. It must not open a modal,
request a demo, or leave the page. If the designer is unsure, cut it — the
page reads fine without it.*

**Trust line, directly under the button**
> Read-only — bkmrks can't post, like, follow, or DM from your account.
> Paid, no free tier.

*Both halves belong above the fold. The first defuses the real fear of
authorizing an app on an X account. The second is the price objection arriving
on the page's terms instead of ambushing someone at `/subscribe` after they've
already granted access. The app itself already leads with "there's no free
tier" rather than burying it; the landing page should not be less honest than
the product.*

**Visual caption — what the hero image must communicate**
A vague, half-remembered description typed into a search box, and the
four-month-old thread it pulls back. One query, one result, plainly rendered.
Not a dashboard collage, not a feature montage, not a device mockup carousel.

**Short variant** (mobile / tight layout): eyebrow → H1 → subhead → CTA →
trust line. Drop the secondary link.

**Optional extra sentence** (long layout only, below the trust line):
> No developer account, no API key, no X Premium.

### Two rejected hero options, and why they lost

**Rejected A — "Your X bookmarks are a graveyard."**
Strong wound, and it's the real hook in `BUSINESS.md`'s launch tweet. It loses
here because it is *all* wound and no after: a hero that only names the pain
sends the reader away agreeing with you and doing nothing. It also abandons
the canonical tagline, which is not this deck's call to make. Keep it as the
launch-thread opener, where the after can arrive in the next post.

**Rejected B — "Search your X bookmarks by what they were about."**
Clear, specific, passes the "now you can" test cleanly. It loses because it is
a feature statement doing the subhead's job while occupying the headline's
slot — and because it trades the emotional before/after for a capability. The
tagline names an ending; this names a function. Endings convert better here,
and again: the H1 is locked.

---

## 3. Problem

**Section ID:** `problem`
**Purpose:** Make them nod. No product yet.

**Desktop heading**
> You saved it. That's the last time you saw it.

**Mobile heading** *(if the desktop one wraps badly)*
> You saved it. Then it was gone.

**Subhead**
> Not because you're disorganized. Because there is no way back in.

**Body — three beats**

> **Saving costs nothing.**
> One tap, no decision. A pricing thread. A teardown worth stealing from. The
> exact argument you'll want in a meeting later. Monday you save four. By
> Friday, twenty-five.

> **The pile grows faster than anyone reads it.**
> It's one column, newest first. No tags. No groups. No way to say "show me
> the ones about hiring." X doesn't even record *when* you bookmarked
> something — only the order it hands things back — so there's no sorting your
> way out of it either.

> **Then you need one, and it's gone.**
> You remember what the post *argued* — not its wording, not who wrote it, not
> where it sits in a 3,000-item scroll. So you scroll for ninety seconds, give
> up, and reconstruct the point from memory, worse than the original. The post
> is still in there. You just can't reach it.

**Closing line — names the enemy**
> Native bookmarks aren't a library. They're a list you never reopen.

**Visual caption**
One unbroken column of saved posts, scrolling past faster than anyone could
read it, with no controls anywhere on screen. The absence of a search box is
the entire point of the image.

**CTA:** none. This section sells nothing.

**Short variant:** heading + beats 1 and 3 + closing line. Beat 2 is the one
that can go; the mechanics of X's list matter less than the failure.

**Optional extra sentence** (after beat 3):
> You've tried to fix this before. A Notion page of pasted links that died in
> a week. A browser folder. A DM to yourself.

---

## 4. Stakes

**Section ID:** `stakes`
**Purpose:** Name what it costs to keep doing nothing. This is the only place
on the page where the reader should feel the price of the status quo.

**Desktop heading**
> The cost isn't the ten minutes.

**Subhead**
> It's what the ten minutes teaches you.

**Body**

> You went looking. You didn't find it. So next time you don't bother looking.
>
> That's the real damage: you've stopped trusting your own library, which means
> you've stopped consulting it, which means every save you make from here gets
> filed into a drawer you already know you won't open.
>
> You're still doing the work of collecting. You've just stopped getting any of
> the benefit of having collected.

**Pull quote — for a large-type treatment**
> Every save from here is filed into a drawer you already know you won't open.

**Visual caption**
No image, or type only. This section is a paragraph that should be read, not
decorated. If the layout demands a visual, set the pull quote large and leave
the rest of the space empty.

**CTA:** none. Asking for the sale here converts the honesty into a pitch.

**Short variant:** heading + the three-sentence body, pull quote cut.

**Optional extra sentence:**
> The posts didn't stop being worth keeping. The keeping stopped being worth
> anything.

---

### Interstitial 1

*Single line, between Stakes and After. Sets up the turn.*

> None of that is a discipline problem. It's a retrieval problem — and
> retrieval is fixable.

---

## 5. After / promise

**Section ID:** `after`
**Purpose:** The week after they start. Show the moment, don't describe the
software.

**Desktop heading**
> The pile stops being a pile.

**Subhead**
> Same Tuesday. Someone asks you the thing. You type what the post was about —
> "hiring a first salesperson too early" — and the thread is on screen.

**Body**
> You didn't remember the author. You didn't remember the phrasing. You didn't
> need to.

**One-sentence promise** *(set this apart — it's the page's spine)*
> Every post you have bookmarked on X, in one place you can search by meaning
> and actually get back out.

**Visual caption**
The same search box from the hero, now mid-result: a specific old thread
surfacing from a description that shares almost no words with it. The gap
between what was typed and what came back is the story.

**CTA:** none. The outcome grid immediately below is still earning it.

**Short variant:** heading + subhead + promise. Cut the three-sentence body.

**Optional extra sentence:**
> It was four months old. You'd have never scrolled to it.

---

## 6. Outcome grid

**Section ID:** `outcomes`
**Purpose:** The value exchange, in results. Five items, no feature names.

**Desktop heading**
> What you walk away with.

**Subhead**
> Outcomes, not modules.

**1 — Everything you already saved, in one place**
> Not a window onto X's list. Your full bookmark history, copied over on first
> sign-in, sitting in a library that's yours to search.

**2 — Any one post, from a vague memory, in seconds**
> You remember the argument, not the wording. That's now enough to find it.

**3 — This week's saves, handled in one sitting**
> They're at the top by default, and the ones you haven't filed yet are one
> click away behind an "Untagged" filter. Triage gets an ending.

**4 — The bottom of the pile, for the first time**
> One toggle reads your library oldest-first, where the saves X buried hardest
> have been sitting untouched since the day you made them.

**5 — A copy that outlives the post**
> Your saves are copied, then re-checked against X daily. When a post gets
> deleted, your copy of its text stays readable instead of turning into a dead
> link.

**6 — A share link for any slice of it** *(include only in a 6-up layout)*
> Tag ten posts "pricing," flip that one tag public, copy the link. Anyone can
> open it with no account, and they see exactly those ten posts — nothing else
> you own becomes visible, ever.

**Visual caption**
If each card needs an icon, use one flat mono glyph per card and no color.
This grid must not become a feature wall with screenshots in it.

**CTA:** none.

**Short variant:** items 1, 2, 4, 5. Item 3 is the most cuttable; item 6 is
the one to add back first if the layout has room.

---

### Interstitial 2

*Between the outcome grid and How it works. Earns the mechanism.*

> Which is a large claim for a bookmark list. Here's what's actually
> underneath it.

---

## 7. How it works

**Section ID:** `how`
**Purpose:** Make the promise feel possible. Three steps, no architecture.

**Desktop heading**
> Three steps, then it's just there.

**Mobile heading**
> Three steps.

**Step 1 — Sign in with X**
> No developer account, no API key, no X Premium. bkmrks reads your bookmarks
> through X's official API using your own authorization.

**Step 2 — Your whole history copies over**
> Every post you've ever bookmarked gets pulled out of X's list into a library
> of its own — text, author, images. A big pile takes a few minutes, and search
> keeps sharpening over the first day as indexing catches up.

**Step 3 — Describe what you're looking for**
> Type what the post was about, not what it said. Narrow by who wrote it, or by
> a tag you typed on the card. They stack: everything from one person, tagged
> one way, about one idea, is a single view.

**Reassurance line, under the steps**
> Read-only scopes, your own token, encrypted at rest. There is no code path in
> bkmrks that can post, like, follow, reply, or DM — that's architecture, not a
> setting you have to trust.

**Visual caption**
Three plain frames, one per step. Frame 3 is the only one that shows results.
Frames 1 and 2 should be almost boring — the point is how little the user does.

**CTA:** none. The page has one more argument to make first.

**Short variant:** the three steps, headings and one sentence each, plus the
reassurance line. The reassurance line never gets cut.

**Optional extra sentence** (after step 2):
> Nothing is asked of you while it runs. It finishes whether you watch it or not.

**Words that are banned from this section:** sync engine, backfill, watermark,
embeddings, vectors, pgvector, cosine similarity, semantic search, source
order, soft delete, server-rendered. The one plain term allowed is **searches
by meaning**, and it is enough.

---

## 8. See it — walkthrough captions

**Section ID:** `walkthrough`
**Purpose:** Three real moments from the actual app. Captions only.

> ⚠ **Rule for whoever builds this:** every string shown inside these visuals
> must be a string the app actually renders. The real ones available are:
> `Search your bookmarks…` · `Filter by @handle…` · `Your bookmarks` ·
> `Recently saved` / `Recently posted` · `Show oldest first` · `Manage tags` ·
> `Add to public page` · `Copy share link` · `Reading mode: on/off` ·
> `Untagged` · `+ tag` · numbered positions (`#1`, `#2`). **Do not invent UI
> copy for a mockup.** A screenshot with fabricated labels in it is a false
> claim with extra steps.

**Desktop heading**
> Three moments.

**Moment 1 — The search**
> *Caption:* A description typed into the search box — not a quote, not a
> handle, not a keyword — and the thread it returns. What must read clearly:
> the words typed and the words in the result barely overlap.

**Moment 2 — The tag**
> *Caption:* One word typed onto a card, which immediately becomes a filter
> chip at the top of the library. What must read clearly: that was the entire
> filing system. There is no folder tree, no setup, no second screen.

**Moment 3 — The public page**
> *Caption:* A tag flipped public, its link copied, and the resulting page open
> in a browser with nobody signed in. What must read clearly: this page shows
> exactly one tag's posts, and nothing else about the account is visible or
> reachable from it.

**Visual caption (section-level)**
Real screenshots or nothing. Dark mode is fine — the app ships it. No browser
chrome mockups with fake tab titles, no floating UI fragments arranged
artfully, no annotated callout arrows inventing features.

**CTA:** none.

**Short variant:** moments 1 and 3. Moment 2 is the most expendable because
the outcome grid already carries tagging.

---

## 9. Use cases

**Section ID:** `usecases`
**Purpose:** Let three different readers each find themselves. Situations, not
job titles.

**Desktop heading**
> Three ways this gets used.

*All three come from `OFFER.md` and `BUSINESS.md` §3. No fourth persona, no
industries, no company sizes — none of that is in the source and none of it is
knowable.*

**1 — The pile you've stopped opening**
> You saved a thread on pricing eight months ago and you know it's in there.
> **You need** it now, and you remember the argument, not the wording.
> **Now you** describe it and it comes back — with everything else you ever
> saved on the subject sitting next to it.

**2 — The list you want to hand someone**
> You've bookmarked thirty genuinely good posts on one subject over two years.
> **You need** to give someone the good ones without re-collecting them in a DM
> or spending a post on it.
> **Now you** tag them, flip that one tag public, and send a link. Nothing else
> of yours becomes visible.

**3 — The body of work by one person**
> You've been saving one person's posts for years without ever grouping them.
> **You need** to read the whole run at once.
> **Now you** filter to their handle and the set is in front of you — and you
> can flip it oldest-first and read forward.

**Visual caption**
No images. Three columns of type, or three stacked blocks on mobile. Do not
put photographs of people here — there are no customers to photograph, and
stock portraits read as invented testimonials.

**CTA:** none.

**Short variant:** cases 1 and 2. Case 3 is real but the narrowest.

---

## 10. Comparison

**Section ID:** `compare`
**Purpose:** One honest table. Outcome language, including where bkmrks loses.

**Desktop heading**
> Against what you're doing now.

*Rows are the four jobs. Columns are the three real alternatives named in
`OFFER.md` § Positioning. The "notes app dump" column is included because
`OFFER.md` names it specifically as a thing this reader has already tried and
watched die.*

| | **Native X bookmarks** | **A notes-app dump of links** | **bkmrks** |
|---|---|---|---|
| **Find an old save** | Scroll one list, newest first, until you spot it | Search only the words you happened to paste; the post's text was never captured | Describe what it was about and it's on screen |
| **Review this week** | No idea which are new to you and which you've already seen | Whatever you remembered to paste, if you kept it up — you didn't | Newest at the top, unfiled ones behind one filter, so triage ends |
| **Leave with your data** | No export. Your saves live and die inside X's list | It's your file, so this one you genuinely win | **No export yet.** Your copy survives a deleted post, but it doesn't leave with you |
| **Setup** | None — it's already there, which is the whole trap | Manual forever. Every save is a copy-paste you have to remember to do | Sign in once; your whole history copies over on its own |

**The line that goes directly under the table** *(do not cut this)*
> The third row isn't a win. Export doesn't exist yet, and a table that hid
> that wouldn't be worth reading.

**Visual caption**
A plain table. No checkmark-and-X grid, no green/red columns, no competitor
logos. The row that bkmrks loses must be styled identically to the rows it
wins — the moment it's visually de-emphasized, the honesty stops working.

**CTA:** none.

**Short variant:** drop the notes-app column, keep all four rows.

---

## 11. Who it's for / not for

**Section ID:** `fit`
**Purpose:** Qualify hard. The right-hand column is doing more conversion work
than the left-hand one.

**Desktop heading**
> Worth it for some people. Not for most.

**This is for you if**
> - You've been on X for years and save constantly — somewhere between 800 and
>   5,000 deep.
> - You've never once successfully searched that pile.
> - You've already tried to fix it: a Notion page of pasted links that died in
>   a week, a browser folder, a DM to yourself.
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
> - You want your data on your own machine. This is a hosted app with a hosted
>   database.
> - You're a team. Everything is scoped to one person's account.

**Visual caption**
Two columns, equal weight, equal type size. The "not for you" side does not get
smaller text or a muted color — that would be hiding it, which defeats the
purpose of printing it.

**CTA:** none.

**Short variant:** four items per column. Cut "take notes on your saves" and
"You're a team" first.

---

## 12. Privacy & trust strip

**Section ID:** `trust`
**Purpose:** Credibility without proof. The device is the *constraint*, not a
testimonial.

**Desktop heading**
> What it can and can't do to your account.

**Four constraints**

> **It cannot act as you.**
> No posting, liking, following, replying, or DMing is possible from this app.
> There is no code that does it, so it isn't a setting you have to trust.

> **Private until you say otherwise.**
> Nothing is public until you deliberately flip one specific tag public. The
> public pages are served by a separate data path that re-checks that flag on
> every query — verified by a test, not by assurance. A private tag and a tag
> that doesn't exist are indistinguishable from the outside.

> **Your tokens are encrypted at rest.**
> And the sign-in cookie in your browser carries only *which* account you are,
> so it can't be stolen and replayed against X.

> **Walking away leaves X untouched.**
> Revoke access in your X settings whenever you want. Your actual X bookmarks
> are unaffected — nothing here ever modifies them.

**The honest counterweight** *(keep it in the same strip, same size)*
> And the part that cuts the other way: this is a hosted app. A copy of your
> saved posts lives in its database, not on your computer. There's no local
> mode, and no export yet.

**Visual caption**
Four short blocks, one line of mono or small-caps label each. No padlock
icons, no shield badges, no "SOC 2" style trust seals — none of that has been
earned and the imitation of it reads as a lie.

**CTA:** none.

**Short variant:** constraints 1, 2, and 4, plus the counterweight. The
counterweight is never the thing you cut.

---

## 13. FAQ

**Section ID:** `faq`
**Purpose:** Kill the reasons they leave.

**Desktop heading**
> The obvious questions.

**Q: Isn't this just X bookmarks with extra steps?**
> X gives you one reverse-chronological list. No tags, no grouping, no
> meaning-based search, no sharing, no export — and no record of when you
> bookmarked anything, only the order it comes back in. There's no discipline
> or folder scheme that fixes that, because the limit is in the tool. The only
> move available inside X is to save less. bkmrks adds all of it on top of the
> same bookmarks.

**Q: Does my library leave my machine?**
> Yes, and that should be in front of you before you sign in. bkmrks is a
> hosted app: a copy of your bookmarked posts lives in its cloud database, not
> on your computer. There is no local mode and no offline mode. The text of
> your saves is also sent to an outside service that indexes it by meaning —
> that's what makes the search work. What that buys you is permanence and
> retrieval; what it costs you is trusting someone else's server. Your X tokens
> are stored encrypted rather than in plain text, and the sign-in cookie in
> your browser carries only *which* account you are.

**Q: Do I need X Premium, an API key, or a developer account?**
> No. You sign in with your normal X account and that's the whole setup. The
> API access belongs to the product, not to you. Nothing here is gated on X
> Premium.

**Q: Can it post, like, or follow from my account?**
> No, and not as a matter of policy. The scopes requested are read scopes, and
> there is no code in bkmrks that posts, likes, follows, replies, or DMs — so
> there's no setting to misconfigure and nothing to take on faith. It reads
> your own bookmarks and nothing else.

**Q: Could using this put my X account at risk?**
> The posture is the conservative one: the official X API, your own
> authorization, reading only your own bookmarks, and posts displayed verbatim
> with attribution and a link back to the original — that last part is X's own
> display requirement, and it's followed. What can't be offered is a guarantee
> about X's future policy, and pretending otherwise would be worse than saying
> so.
>
> ⚠ **FOUNDER GATE — do not publish this answer until X's current developer
> policy is re-read and this wording checked against it.** `BUSINESS.md` §14
> flags X ToS/API risk as open and §13 attaches the same note to this exact
> objection. If the review comes back unclear, cut the question rather than
> hedge it further.

**Q: Why does it cost money? It's a bookmark viewer.**
> X's API meters per request — reading your bookmarks costs real money on every
> sync, and so does indexing them so they can be searched by meaning. There's
> no free tier because there's no free read.

**Q: How long does the first sync take?**
> A few minutes for a big pile, running in the background — you don't have to
> sit and watch it. Search keeps getting sharper over the first day as indexing
> catches up, so a post you saved years ago may not be findable in the first
> ten minutes.

**Q: Can I search for an exact phrase, a URL, or a quote?**
> Not reliably. Search here works on meaning, not literal text, so it's built
> for "that thread about pricing a small product" and not for finding a
> specific string. If you're after a particular person's posts, the @handle
> filter is the better tool for that.

**Q: What happens when a post I saved gets deleted off X?**
> Your copy stays. Every saved post is re-checked against X daily, so when the
> original disappears, what you saved doesn't turn into a dead link — the text
> is still readable in your library.

**Q: Does it work on my phone?**
> It's a web page, so yes — it works in a phone browser. There's no iOS or
> Android app.

**Q: What if I want out?**
> Revoke the app's access in your X settings whenever you like. Your actual X
> bookmarks are untouched — nothing here ever modifies them, so walking away
> costs you nothing on X's side. Access to the library runs on an active
> membership. Worth knowing up front: there's no export yet, so what you build
> here doesn't currently come out with you.

**Visual caption**
Accordion or plain stacked Q&A. If accordion, the first question opens by
default. No illustration.

**CTA:** none — the final CTA band is immediately below.

**Questions cut for guessing:** anything about price, billing period, refunds,
what happens to stored data after cancellation, or which region the database
sits in. All unset in the repo. A public FAQ that answers those would be
inventing policy, and "not decided yet" is not publishable.

---

## 14. Final CTA band

**Section ID:** `final`
**Purpose:** Restate the offer. No new information.

**H2**
> No more endless & forgotten bookmarks.

**Supporting line**
> Sign in, let your history copy over, and go find the one you've never been
> able to find.

**Primary CTA**
> `Sign in with X`

**Risk reversal — one line**
> Read-only, so nothing here can touch your X account — and revoking access
> leaves your actual bookmarks exactly as they are.

**Micro-line under that**
> Paid, no free tier.

**Visual caption**
Nothing, or the same search-box motif from the hero, closing the loop. The
page opened on a query and should end on one.

**Short variant:** H2 + CTA + risk reversal. The supporting line is cuttable.

**Banned here:** new features, countdown timers, "limited spots," founding-
member language, any price, any guarantee or refund window. None exists, and
`OFFER.md` § Risk reversal is explicit that one cannot be implied.

---

## 15. Sticky mobile CTA

**Label**
> `Sign in with X`

**Sub-label** (if the bar has two lines)
> Read-only · Paid, no free tier

**Appears:** once the hero scrolls out of view.
**Never:** as an interstitial, a modal, an exit-intent popup, or a slide-in.

---

## 16. Form, states, and post-click

*Page type C, so there is no email field anywhere on this page. Every state
below is an OAuth state.*

### Button states

| State | Copy |
|---|---|
| Default | `Sign in with X` |
| Hover | *(no label change — visual state only)* |
| Loading | `Taking you to X…` |
| Returning, already signed in | `Go to dashboard` *(this string already exists in the app — reuse it)* |
| Generic failure | `That didn't go through. Try again.` |

### Permission screen one-liner

*Shown next to the button, or on the hand-off to X's consent screen.*

> X will ask you to allow read access to your bookmarks and profile. That's all
> bkmrks asks for, and all it can use.

### Failed / denied OAuth

*The app redirects back to `/` with the error in a `login_error` param. Copy
for that banner:*

> **Sign-in didn't complete.**
> Nothing was connected and nothing changed on your X account. Try again, or
> come back in a minute if X is having a moment.

### Disconnected or expired X access

*Real state — the revalidation job already handles revoked tokens.*

> **bkmrks lost access to your X account.**
> This happens if access was revoked in your X settings. Your library is still
> here. Sign in again to start syncing new bookmarks.

### Post-click destination

There is **no thank-you page**, and one should not be invented. The OAuth
callback already routes to one of two real destinations:

**If the membership is active → `/app`.** First-run empty state, using the
app's real string:
> No bookmarks synced yet — if you just signed in, the first sync runs in the
> background and may take a moment. Try Refresh.

**If it isn't → `/subscribe`.** Use the app's existing voice:
> **bkmrks is a paid dashboard.**
> An active membership is required to use the dashboard — there's no free tier.

*If anyone proposes an interstitial "thanks for signing up" screen between
these, cut it. It adds a click to a flow that's already correct, and there is
nothing true to put on it.*

### Transactional expectation

> You're in. The first sync is running now — it copies your whole bookmark
> history in the background and doesn't need you to wait on it.

*No "check your email." No email is sent, and no email address is collected.*

---

## 17. Small snippets

**404**
> Nothing here. Unlike your bookmarks, this one really is gone.

**Empty search result** *(app's real string — keep it)*
> No bookmarks match your search.

**Empty filter result** *(app's real string — keep it)*
> No bookmarks match this filter.

**Public page, nothing tagged yet** *(app's real string)*
> Nothing tagged here yet.

**Public profile, no public tags** *(app's real string)*
> No public tags yet.

**Copy-link confirmation**
> Copied!

*This is the one exclamation mark the brand allows anywhere, and it already
ships in the product. Do not add a second one to this page.*

**Generic page error**
> Something broke on this end. Your library is fine — reload and it should
> come back.

---

## 18. Tweet-sized announcement for the page itself

> Your X bookmarks are a graveyard. One column, newest first, 3,000 deep, and
> no way to search what a post was actually about.
>
> bkmrks fixes the getting-back-out part. No more endless & forgotten
> bookmarks.

*(204 characters. No link shortener, no "check it out," no rocket emoji.)*

---

## 19. Design notes that are actually copy notes

**What the hero visual must mean**
Retrieval working. One vague query in, one specific old post out. If a viewer
can't tell from the image that the typed words and the returned post barely
share vocabulary, the image has failed at the only job it has.

**What scrolling should feel like**
Graveyard → library. The top of the page should feel like the unbroken column:
dense, undifferentiated, no controls. By the outcome grid it should feel
boxed, bounded, and countable — things in places. That transition is the
argument, made in layout instead of words.

**Words that must appear on screen**
endless · forgotten · library · pile · buried · find · get it back · what it
was about · read-only · no free tier · your copy · one query

**Words that must never appear on screen**
- *Hype:* seamless · supercharge · effortlessly · all-in-one · unlock ·
  next-gen · robust · revolutionary · AI-powered · game-changing · 10x ·
  second brain · knowledge graph · platform · solution
- *Internal vocabulary:* sync engine · backfill · watermark · embeddings ·
  vectors · pgvector · cosine similarity · semantic search · source order ·
  soft delete · server-rendered
- *Banned for accuracy:* remind · reminder · resurface · digest · nudge ·
  alert · unread · review queue · "bring it back to you" · "never forget a
  bookmark again"
- *Banned as overclaim:* "own your data" · "not locked in" · "free"

**Mechanical voice rules**
- `bkmrks` is always lowercase, including sentence-initial.
- Never write "we." The product is the subject: *"bkmrks can't post,"* not
  *"we don't post."* Every string in the app today follows this.
- No exclamation marks. The single exception is `Copied!`, which already ships.
- Describe what a thing does, then stop. No sentence exists to add warmth.

---

## 20. Claims register

| Claim | Allowed? | Source | Safer rewrite if weak |
|---|---|---|---|
| "Search by what it was about, not what it said" | ✅ | OFFER.md § Mechanism; BUSINESS.md §4 | — |
| "Read-only — can't post, like, follow, or DM" | ✅ | BUSINESS.md §4 Auth/privacy; `src/lib/x.ts` | — |
| "Your tokens are encrypted at rest" | ✅ | BUSINESS.md §4; `src/lib/crypto.ts` | — |
| "Private until you flip one tag public" | ✅ | BUSINESS.md §4; `src/lib/public.test.ts` | — |
| "Your copy outlives a deleted post" | ✅ | OFFER.md § Supporting promise 1 | — |
| "Paid, no free tier" | ✅ | BUSINESS.md §5.14; `/subscribe` | — |
| "Revoking access leaves your X bookmarks untouched" | ✅ | OFFER.md § Risk reversal | — |
| "Your whole history copies over on first sign-in" | ✅ | OFFER.md § How they start | — |
| "A few minutes" for first sync | ⚠️ soft | OFFER.md § The value exchange | Keep vague — never state a number of minutes. No measured benchmark exists. |
| "No export yet" | ✅ *required* | OFFER.md § What we are not claiming | Must stay on the page. Removing it turns the comparison table into a lie. |
| "Using this won't get your account restricted" | ⚠️ **gated** | BUSINESS.md §14 | Ships only after X developer-policy re-check. Otherwise cut the FAQ entry entirely. |
| "800–5,000 bookmarks" as the audience | ✅ | OFFER.md § The person this is for | It describes the reader, not a user count. Never restate it as "our users have…" |
| "Never forget a bookmark again" | ❌ | OFFER.md § The tagline rule | "No more forgotten bookmarks" = you can get them back. Nothing stronger. |
| Any price, tier, trial, or refund | ❌ | OFFER.md § Offer stack | Omit. "Paid, no free tier" is the ceiling. |
| What happens to data on cancellation | ❌ | BUSINESS.md §14 (unset) | Omit the question. Do not write "not decided yet" publicly. |
| Data residency / region | ❌ | BUSINESS.md §14 (unset) | Omit. Belongs in a privacy policy that doesn't exist yet. |
| Any user count, testimonial, logo, rating | ❌ | OFFER.md § What we are not claiming | There are none. Substitute the constraint device in §12. |
| "Works with everything you save online" | ❌ | BUSINESS.md §5.10 | X bookmarks are the only input. Say that instead. |

---

## 21. Cut list

Sections considered and rejected, with reasons.

| Section | Why it's cut |
|---|---|
| Logo bar / "as seen in" | No logos exist. The proof rule forbids the placeholder, and an empty strip is worse than no strip. |
| Testimonials / social proof | No users, no quotes, no counts. Replaced by the constraint device in §12. Never write "[Testimonial here]". |
| User-count or "join N others" | Fake by definition today. Also a mimetic-desire lever this audience specifically distrusts. |
| Pricing table | Price, billing period, and trial are all unset. A table would invent them. |
| Waitlist form + confirmation + Email #1 | Page type is C. There's no waitlist route, no email capture, and no email ever sent. Writing these would describe a product flow that doesn't exist. |
| Standalone thank-you page | The OAuth callback already routes to `/app` or `/subscribe`. An interstitial adds a click and has nothing true on it. |
| Demo request / "book a call" | Not in BUSINESS.md, and it's a second conversion goal competing with sign-in. |
| Enterprise / teams block | Every table is scoped to one `user_id`. Teams don't exist. |
| Integrations section | There are none. X is the only input and the only output is a public page. |
| Countdown / "limited spots" / founding-member pricing | No genuine scarcity exists. Fabricating it is the fastest way to lose a reader who is already skeptical of productivity tools. |
| Cookie banner | No analytics or advertising cookie is set. Only the session and reading-mode cookies, both functional. Revisit if a tracker is ever added. |
| Founder story / about block | BUSINESS.md has one drafted, but it repeats the problem section in the first person and pushes the CTA below a third screen. Better as launch-thread material. |
| Blog / changelog teaser | Neither exists, and both are exits from a one-action page. |
| Stats / "brag card" feature section | Real feature, but it's a post-signup delight, not a reason to sign up. It would read as filler next to retrieval. |
| Reading-mode as its own section | Folded into §12's "not a feed" framing and the outcome grid instead. It doesn't carry a section alone. |
| Comparison against named third-party apps | OFFER.md names only native X and a generic notes dump. Naming real competitors would be inventing a landscape. |

---

## 22. Section order on the page

1. Nav
2. `hero`
3. `problem`
4. `stakes`
5. *Interstitial 1*
6. `after`
7. `outcomes`
8. *Interstitial 2*
9. `how`
10. `walkthrough`
11. `usecases`
12. `compare`
13. `fit`
14. `trust`
15. `faq`
16. `final`
17. Footer
— plus the mobile sticky CTA, active from §3 onward.

**If the page has to be shortened to one screen-and-a-half:** keep `hero`,
`problem`, `after`, `how`, `trust`, `final`. That sequence still makes the
whole argument — wound, after, mechanism, safety, ask.
