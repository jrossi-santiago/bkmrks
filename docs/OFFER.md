# Offer: bkmrks

> Source of truth: `docs/BUSINESS.md`. Every claim here is one the shipped
> product can deliver today. Three items the usual offer template calls for —
> export, local storage, and anything that resurfaces old saves at you — do
> not exist in this product, so they are absent from the offer and parked in
> "What we are not claiming." Price is unset; nothing here invents one.

## The offer in one sentence

For the person with two thousand X bookmarks they have never once
successfully searched, bkmrks is the way to get any saved post back in a
single query — by what it was about, not what it said — without leaving X,
without a developer account, and without the app ever being able to post as
you.

## The person this is for

They have been on X for years and they save constantly. A thread on pricing,
a teardown they want to steal from, a tool someone mentioned, a post that
made them think "this is exactly the argument I need later." One tap, no
friction, no decision. The pile is somewhere between 800 and 5,000 deep and
it has never been read back.

They tell themselves they'll come back to it. What they actually do is
scroll the bookmark list for ninety seconds, fail to find the thing, feel
mildly bad about it, and go search Google instead. They have tried to fix
this before: a Notion page of pasted links that died in a week, a "saved for
later" folder in their browser, a DM to themselves. None of it survived,
because the saving was never the problem — the getting-back-out was.

They half-suspect their own library is worthless, and they keep adding to it
anyway.

**This is not for you if:**

- You save things from all over the web. X bookmarks are the only input here.
  No extension, no share sheet, no URL saver.
- You want a free tool. There is no free tier, not a limited one, not a trial
  documented anywhere in the product.
- You want a second brain — notes, highlights, linking, writing on top of
  your saves. This stores what you saved; it does not let you annotate it.
- You need to search for exact strings, URLs, or quoted phrases. Search here
  works on meaning, not literal text.
- You want your data on your own machine. This is a hosted app with a hosted
  database.
- You're a team. Everything is scoped to one person's account.

## The before

Monday, you save four things during a meeting you weren't paying attention
in. Tuesday, six more. By Friday you've added maybe twenty-five posts you
genuinely meant to use.

Then the following Tuesday someone asks you the thing. You *know* you saved
a post about it. You open bookmarks. It's one column, newest first, with no
tags, no groups, and no way to say "show me the ones about hiring." X does
not even record *when* you bookmarked something — only the order it hands
them back — so there is no sorting your way out of it either. You scroll.
You recognise four posts you'd forgotten, which is momentarily nice and then
a distraction. You don't find the one you came for, because you remember
what it *argued*, not the words it used or who wrote it, and there is
nothing in X that searches for that.

So you give up and reconstruct the point from memory, worse than the
original. The post is still in there. You just can't reach it.

The cost isn't the ten minutes. The cost is that you have stopped trusting
your own library, which means you've stopped consulting it, which means every
save you make from here is filed into a drawer you already know you won't
open. You are doing the work of collecting and getting none of the benefit of
having collected.

## The after

Same Tuesday. Someone asks you the thing. You open your library, type *what
the post was about* — "hiring a first salesperson too early" — and the thread
is on screen. You didn't remember the author. You didn't remember the
phrasing. You didn't need to.

The pile stopped being a pile the first time you signed in: everything you
have ever bookmarked on X got pulled into one page you can search, filter by
the person who wrote it, narrow to a tag, or flip upside down to read from
your oldest saves forward — the ones buried deepest in X, which you have
functionally never seen since the day you saved them.

**Three proof-of-after moments:**

1. **You find the thread you saved four months ago, from memory of its
   argument, in one query.** Not by scrolling to it — by describing it.
2. **You sit down with this week's saves in one pass.** They're at the top by
   default, and the ones you haven't filed yet are one click away behind an
   "Untagged" filter, so triage has a start and an end instead of being an
   infinite scroll.
3. **You stop treating bookmarks like a trash drawer.** Saving starts paying
   off, so you save more deliberately — and when a post you saved gets
   deleted off X, your copy of the text is still sitting in your library.

And one you didn't expect: the list you kept for yourself becomes something
you can hand over. Tag ten posts "pricing," flip that one tag public, copy
the link. That's a page anyone can open, with no account, showing exactly
those ten posts and nothing else you own.

## The promise

**Primary promise: every post you have bookmarked on X is in one place you
can search by meaning and actually get back out.**
Falsifiable: sign in, wait for the first sync, type a description of
something you saved, see it.

**Supporting promise 1: your copy outlives the original.** Saves are copied
into your library, and a daily job re-checks each one against X — when a
post is deleted, your copy of its text stays readable to you rather than
turning into a dead link.

**Supporting promise 2: any tag becomes a shareable page, and nothing else
ever becomes visible.** One toggle publishes a tag at its own URL. Everything
not on a public tag is unreachable from those pages by construction — the
public side reads through a separate data layer that re-checks the public
flag on every query, and that's covered by a test, not a policy.

That's three. Everything else is mechanism or detail.

## The mechanism (why this gets the result)

You get your saves back because they stop living inside X's list. On first
sign-in, bkmrks reads your bookmarks through X's official API using your own
authorisation and copies each one — text, author, images — into a library of
its own. Then it does the thing X never does: it reads every post for
*meaning* and stores that, so a search can match an idea against an idea
instead of a word against a word.

- **You find posts from what they argued, not what they said**, because each
  saved post is indexed by meaning — so "advice about pricing a small
  product" reaches the thread that only ever said "don't charge $9."
- **You can narrow instead of scroll**, because the library holds who wrote
  each post and which tags you put on it, and those stack with a search:
  everything from one person, tagged one way, about one idea, is a single
  view.
- **Your library survives X**, because it's your own copy being re-checked
  daily rather than a window onto posts that can vanish.

## The value exchange

**They give:** a sign-in with X, granting read access to their own bookmarks
and profile. A few minutes on the first sync while their history copies over
— longer if the pile is big, and search gets sharper over the first day as
indexing catches up. A subscription; there is no free tier. And trust, which
is the real ask: they are handing an app authorisation on their X account.

**They get:** the ability to actually consult the thing they've been building
for years. A library where a half-remembered post is thirty seconds away
instead of unreachable. The oldest saves — the ones they've never once
revisited — one click from the top of the page. Permanence, so a deleted post
doesn't take their save with it. A share link for any slice of it they want
to hand someone. And a place to read that deliberately doesn't behave like a
feed: no infinite scroll, no engagement counts, no algorithm, and a reading
mode that strips avatars and collapses images so it reads as text.

**The unfair advantage over "just use X bookmarks better."** There is no
better. X gives one chronological list, no tags, no grouping, no sharing, and
a search that can't match a description to a post. There is no discipline, no
folder scheme, and no saving habit that fixes that, because the limit is in
the tool. The only move available inside X is to save less. The move here is
to make the pile worth having.

## Objections and the honest answer

**"Doesn't X already do this?"**
No. X gives you one reverse-chronological list. No tags, no grouping, no
meaning-based search, no sharing, no export — and no record of when you
bookmarked something, only the order it hands them back. bkmrks adds all of
that on top of the same bookmarks.

**"Is my data leaving my machine?"**
Yes, and you should decide with that in front of you. This is a hosted app: a
copy of your bookmarked posts lives in the product's own cloud database, not
on your computer. There is no local mode. What that buys you is the
permanence and the search; what it costs you is that you're trusting someone
else's server. Your X access tokens are stored encrypted rather than in
plain text, and the sign-in cookie in your browser carries only *which*
account you are — it can't be stolen and replayed against X. Two things are
honestly unresolved: which region the database sits in, and what happens to
your data if you cancel. Neither is decided yet, and neither should be
guessed at in marketing.

**"Do I need X Premium, an API key, or a developer account?"**
No. You sign in with your normal X account. The API access is the product's,
not yours. Nothing here is gated on X Premium.

**"Will this get my account in trouble?"**
The posture is the safe one: official X API, your own authorisation, reading
only your own bookmarks, posts displayed verbatim with attribution and a link
back to the original — that last part is X's own display requirement and it's
followed. The app has no code path that can post, like, follow, reply, or DM
— that's architecture, not a promise. What we can't do is speak for X's
future policy, and we shouldn't pretend otherwise.

**"Why won't I ignore this the same way I ignore my bookmarks?"**
Honest answer: you might, and this product will not nag you. There is no
digest, no reminder, no weekly email, nothing that pulls you back. What
changes is the payoff when you *do* open it. Bookmarks get ignored because
retrieval fails — you go looking, you don't find it, you learn not to look.
Fix retrieval and the trip is worth making, so you start making it. That's
the entire bet, and it's a bet on the moment you need something, not on a
new daily habit.

## The offer stack (value, not SKUs)

What a person walks away with:

1. **Everything you already saved, in one place** — your full X bookmark
   history, copied over on first sign-in, not a window onto X's list.
2. **Any one post, from a vague memory, in seconds** — search by what it was
   about; narrow by who wrote it and how you tagged it.
3. **A way through this week's saves in one sitting** — newest at the top,
   unfiled ones behind one filter, so triage ends.
4. **Access to your oldest saves for the first time** — one toggle reads the
   pile from the bottom, where the things X buried hardest have been sitting.
5. **A copy that outlives the post** — deleted tweets don't erase what you
   saved.
6. **A share link for any slice of it** — one tag, one URL, nothing else of
   yours exposed.
7. **A place to read that isn't a feed** — no infinite scroll, no metrics, no
   algorithm, and a mode that strips it down to text.

**Commercial wrapper: unset. Do not invent tiers.** What is decided in the
product: there is no free tier and every one of the outcomes above sits
behind an active subscription. Price, billing period, trial, and what happens
on cancellation are all undecided — say nothing about them until they are.

## Risk reversal

Only what is true today:

- **It cannot act as you.** No posting, liking, following, replying, or DMing
  is possible from this app — there is no code that does it, so it isn't a
  matter of trusting a setting.
- **Walking away leaves X untouched.** Revoke the app's access in your X
  settings whenever you like; your actual X bookmarks are unaffected —
  nothing here ever modifies them.
- **Private unless you say otherwise.** Nothing is public until you
  deliberately flip a specific tag public. The public pages are served by a
  separate data path that re-checks that flag on every query, verified by a
  test rather than by assurance, and a private tag is indistinguishable from
  one that doesn't exist.
- **Read-only against your account, by design** — the scopes requested are
  read scopes.

**What we cannot offer and must not imply:** there is no export, so "you're
not locked in" is not a claim we get to make. There is no local-only or
offline mode. There is no money-back guarantee, refund window, or documented
cancellation outcome in the product — if the commercial wrapper adds one
later, it goes here then, not now.

## How they start

1. Sign in with your X account — no developer account, no API key, no
   Premium.
2. Start a subscription. There's no free tier, so this is the gate, not a
   trial.
3. Let the first sync run. Your whole bookmark history copies over in the
   background; a big pile takes a few minutes, and search sharpens over the
   first day as indexing finishes.
4. Search for something you know you saved and never found. Describe it —
   don't quote it.
5. Tag five things while you're there. It's one word typed on a card, and
   tags become filters immediately.
6. Optional, and the part people don't expect: flip one tag public and copy
   its link. You now have a page you can hand to someone.

## Words to use / words to kill

**Use:** library · pile · buried · graveyard · find · reopen · get it back ·
what it was about · saved for later and never later · your copy · one query ·
the bottom of the pile · hand someone the link.

**Kill:** synergy · all-in-one · unlock · seamless · next-gen · robust ·
solution · deliverables · platform · supercharge · second brain · knowledge
graph · effortlessly.

**Also kill** — internal words that mean nothing to the buyer: sync engine,
backfill, watermark, embeddings, vectors, pgvector, cosine similarity,
semantic search, source order, soft delete, server-rendered. The one plain
term the mechanism section is allowed is *searches by meaning*, and that's
enough.

**Kill for accuracy, not style:** "never forget" and every relative of it
(remind, resurface, digest, nudge, bring it back to you). The product has no
mechanism for it. Also "own your data" as an absolute — no export means we
haven't earned the phrase.

## Assets to write next (do not write them here)

- Landing hero — headline, subhead, one CTA, built off the one-sentence offer.
- Three outcome bullets for the landing page, taken from the offer stack, not
  the feature list.
- Waitlist / activation email — one email, built on the before→after, ending
  at step 4 of "How they start" (search for something you never found).
- One launch thread — the before is the hook; the product enters late.
- One design prompt — "design the after": the moment a four-month-old thread
  appears from a vague description. Not the settings page, not the tag
  manager.
- A pricing page, blocked until the commercial wrapper is decided.

## What we are not claiming

- That it reminds you, resurfaces old saves, emails you a digest, or gives
  you an unread queue. None of that exists.
- That you'll "never forget a bookmark again."
- That you can export your library. You can't, yet.
- That anything is stored locally or works offline.
- That it saves anything from outside X — no extension, no share sheet, no
  URLs, no other platforms.
- That you can search exact phrases, URLs, or quotes reliably.
- That there's a free plan, a trial, a refund, or any specific price.
- That you can annotate, highlight, star, or write notes on a save.
- That it works for teams, or that anyone can share a library with you.
- That we know what happens to your data when you cancel, or which region it
  sits in. Both are undecided.
- Any user count, testimonial, logo, or "used by" claim. There are none.
