import type { Metadata, Viewport } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import "./landing.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
  variable: "--font-newsreader",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "bkmrks — every post you saved on X, findable",
  description:
    "Every post you've ever saved on X, in one library you can search by what it was about — not what it said. Tag it, filter it, and share any tag as a link.",
  openGraph: {
    title: "No more endless & forgotten bookmarks.",
    description:
      "Your whole X bookmark history, pulled out of the scroll into a library you can search by meaning, filter by author, and tag in one keystroke.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "No more endless & forgotten bookmarks.",
    description:
      "Every post you've saved on X, in one library you can search by what it was about. Not what it said.",
  },
};

export const viewport: Viewport = { themeColor: "#0b0b0b" };

/* The running border sentence is the locked H1 (OFFER.md § The tagline). */
const FRAME_RUN = "No more endless & forgotten bookmarks";
const runs = (n: number) =>
  Array.from({ length: n }, (_, i) => (
    <i key={i}>
      {FRAME_RUN} <span aria-hidden="true">·</span>
    </i>
  ));

/* Sticky mobile CTA appears once the hero has scrolled out (LANDING-FULL §15). */
const STICKY_SCRIPT = `(function(){
  var hero=document.getElementById('hero'),bar=document.getElementById('sticky');
  if(!hero||!bar||!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(e){
    bar.setAttribute('data-shown',String(!e[0].isIntersecting));
  },{rootMargin:'-72px 0px 0px 0px'}).observe(hero);
})();`;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ login_error?: string }>;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  const { login_error: loginError } = await searchParams;

  /* Button states, LANDING-FULL §16. "Go to dashboard" already ships in the app. */
  const ctaHref = session ? "/app" : "/login";
  const ctaLabel = session ? "Go to dashboard" : "Sign in with X";

  return (
    <div className={`landing ${newsreader.variable} ${plexMono.variable}`} id="top">
      {/* ---------------------------------------------------------------- nav */}
      <header className="nav">
        <div className="wrap nav__in">
          <a className="nav__mark" href="#top">
            bkmrks
          </a>
          <nav className="nav__links" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#outcomes">What you get</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className="btn btn--ghost" href={ctaHref}>
            {ctaLabel}
          </a>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------- hero */}
        <section className="hero" id="hero" aria-labelledby="hero-h">
          <div className="wrap">
            <div className="frame">
              <span className="frame__run frame__run--top" aria-hidden="true">
                <span>{runs(24)}</span>
              </span>
              <span className="frame__run frame__run--bottom" aria-hidden="true">
                <span>{runs(24)}</span>
              </span>
              <span className="frame__run frame__run--left" aria-hidden="true">
                {runs(3)}
              </span>
              <span className="frame__run frame__run--right" aria-hidden="true">
                {runs(3)}
              </span>

              <div className="frame__inner">
                <div>
                  {loginError && (
                    <div className="notice" role="status">
                      <strong>Sign-in didn’t complete.</strong>
                      <p>
                        Nothing was connected and nothing changed on your X account. Try
                        again, or come back in a minute if X is having a moment.
                      </p>
                    </div>
                  )}

                  <p className="micro hero__eyebrow">For people with 2,000 bookmarks</p>

                  <h1 id="hero-h">
                    No more endless &amp; <em>forgotten</em> bookmarks.
                  </h1>

                  <p className="hero__sub">
                    Every post you’ve saved on X, in one library you can search by what it
                    was about — not what it said.
                  </p>

                  <div className="hero__act">
                    <a className="btn" href={ctaHref}>
                      {ctaLabel}
                    </a>
                    <a className="anchor-link only-wide" href="#how">
                      See how it works ↓
                    </a>
                  </div>

                  <p className="hero__trust">
                    <b>Read-only</b> — bkmrks can’t post, like, follow, or DM from your
                    account. <b>Paid, no free tier.</b>
                  </p>

                  <p className="hero__perm">
                    No developer account, no API key, no X Premium. X will ask you to allow
                    read access to your bookmarks and profile. That’s all bkmrks asks for,
                    and all it can use.
                  </p>

                  <p className="micro hero__mark">bkmrks · Read-only · Paid, no free tier</p>
                </div>

                {/* ref-02, texture only: a duotone film. Never a portrait. */}
                <div className="texture" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- problem */}
        <section className="band" id="problem" aria-labelledby="problem-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">01</span>
            </p>
            <div className="sec__head">
              <h2 id="problem-h">
                <span className="only-wide">You saved it. That’s the last time you saw it.</span>
                <span className="only-narrow">You saved it. Then it was gone.</span>
              </h2>
              <p className="lede">
                Not because you’re disorganized. Because there is no way back in.
              </p>
            </div>

            {/* The unbroken column: dense, undifferentiated, no controls. */}
            <div className="column">
              <div className="column__beat">
                <h3>Saving costs nothing.</h3>
                <p>
                  One tap, no decision. A pricing thread. A teardown worth stealing from.
                  The exact argument you’ll want in a meeting later. Monday you save four.
                  By Friday, twenty-five.
                </p>
              </div>
              <div className="column__beat only-wide">
                <h3>The pile grows faster than anyone reads it.</h3>
                <p>
                  It’s one column, newest first. No tags. No groups. No way to say “show me
                  the ones about hiring.” X doesn’t even record <em>when</em> you bookmarked
                  something — only the order it hands things back — so there’s no sorting
                  your way out of it either.
                </p>
              </div>
              <div className="column__beat">
                <h3>Then you need one, and it’s gone.</h3>
                <p>
                  You remember what the post <em>argued</em> — not its wording, not who
                  wrote it, not where it sits in a 3,000-item scroll. So you scroll for
                  ninety seconds, give up, and reconstruct the point from memory, worse than
                  the original. The post is still in there. You just can’t reach it.
                </p>
              </div>
            </div>

            <p className="aside-note">
              You’ve tried to fix this before. A Notion page of pasted links that died in a
              week. A browser folder. A DM to yourself.
            </p>

            <p className="closer">
              Native bookmarks aren’t a library. They’re a list you never reopen.
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------- stakes */}
        <section className="band" id="stakes" aria-labelledby="stakes-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">02</span>
            </p>
            <div className="stakes__grid">
              <div className="sec__head">
                <h2 id="stakes-h">The cost isn’t the ten minutes.</h2>
                <p className="lede">It’s what the ten minutes teaches you.</p>
              </div>
              <div className="prose">
                <p>You went looking. You didn’t find it. So next time you don’t bother looking.</p>
                <p>
                  That’s the real damage: you’ve stopped trusting your own library, which
                  means you’ve stopped consulting it, which means every save you make from
                  here gets filed into a drawer you already know you won’t open.
                </p>
                <p>
                  You’re still doing the work of collecting. You’ve just stopped getting any
                  of the benefit of having collected.
                </p>
                <p>
                  The posts didn’t stop being worth keeping. The keeping stopped being worth
                  anything.
                </p>
              </div>
            </div>

            <p className="pull">
              Every save from here is filed into a drawer you already know you won’t open.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------- interstitial 1 */}
        <aside className="inter">
          <div className="wrap">
            <p>
              None of that is a discipline problem. It’s a <em>retrieval</em> problem — and
              retrieval is fixable.
            </p>
          </div>
        </aside>

        {/* ------------------------------------ after — colour hit: ink orange */}
        <section className="band band--orange band--flush" id="after" aria-labelledby="after-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">03</span>
            </p>
            <div className="after__grid">
              <div>
                <h2 id="after-h">The pile stops being a pile.</h2>
              </div>
              <div>
                <p className="lede">
                  Same Tuesday. Someone asks you the thing. You type what the post was about
                  — “hiring a first salesperson too early” — and the thread is on screen.
                </p>
                <p className="after__body">
                  You didn’t remember the author. You didn’t remember the phrasing. You
                  didn’t need to. It was four months old. You’d have never scrolled to it.
                </p>
              </div>
            </div>

            <p className="promise">
              Every post you have bookmarked on X, in one place you can search by meaning
              and <em>actually get back out.</em>
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------- outcomes */}
        <section className="band band--flush" id="outcomes" aria-labelledby="outcomes-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">04</span>
            </p>
            <div className="sec__head">
              <h2 id="outcomes-h">What you walk away with.</h2>
              <p className="lede">Outcomes, not modules.</p>
            </div>

            <div className="board">
              <article className="board__cell">
                <p className="micro board__n">01</p>
                <h3>Everything you already saved, in one place</h3>
                <p>
                  Not a window onto X’s list. Your full bookmark history, copied over on
                  first sign-in, sitting in a library that’s yours to search.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">02</p>
                <h3>Any one post, from a vague memory, in seconds</h3>
                <p>
                  You remember the argument, not the wording. That’s now enough to find it.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">03</p>
                <h3>This week’s saves, handled in one sitting</h3>
                <p>
                  They’re at the top by default, and the ones you haven’t filed yet are one
                  click away behind an “Untagged” filter. Triage gets an ending.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">04</p>
                <h3>The bottom of the pile, for the first time</h3>
                <p>
                  One toggle reads your library oldest-first, where the saves X buried
                  hardest have been sitting untouched since the day you made them.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">05</p>
                <h3>A copy that outlives the post</h3>
                <p>
                  Your saves are copied, then re-checked against X daily. When a post gets
                  deleted, your copy of its text stays readable instead of turning into a
                  dead link.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">06</p>
                <h3>A share link for any slice of it</h3>
                <p>
                  Tag ten posts “pricing,” flip that one tag public, copy the link. Anyone
                  can open it with no account, and they see exactly those ten posts —
                  nothing else you own becomes visible, ever.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- interstitial 2 */}
        <aside className="inter">
          <div className="wrap">
            <p>
              Which is a large claim for a bookmark list. Here’s what’s actually{" "}
              <em>underneath</em> it.
            </p>
          </div>
        </aside>

        {/* ------------------------------------- how — colour hit: printer blue */}
        <section className="band band--blue band--flush" id="how" aria-labelledby="how-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">05</span>
            </p>
            <div className="sec__head">
              <h2 id="how-h">
                <span className="only-wide">Three steps, then it’s just there.</span>
                <span className="only-narrow">Three steps.</span>
              </h2>
            </div>

            <div className="steps">
              <article className="step">
                <span className="step__n" aria-hidden="true">1</span>
                <h3>Sign in with X</h3>
                <p>
                  No developer account, no API key, no X Premium. bkmrks reads your
                  bookmarks through X’s official API using your own authorization.
                </p>
              </article>
              <article className="step">
                <span className="step__n" aria-hidden="true">2</span>
                <h3>Your whole history copies over</h3>
                <p>
                  Every post you’ve ever bookmarked gets pulled out of X’s list into a
                  library of its own — text, author, images. A big pile takes a few minutes,
                  and search keeps sharpening over the first day as indexing catches up.
                  Nothing is asked of you while it runs. It finishes whether you watch it or
                  not.
                </p>
              </article>
              <article className="step">
                <span className="step__n" aria-hidden="true">3</span>
                <h3>Describe what you’re looking for</h3>
                <p>
                  Type what the post was about, not what it said. Narrow by who wrote it, or
                  by a tag you typed on the card. They stack: everything from one person,
                  tagged one way, about one idea, is a single view.
                </p>
              </article>
            </div>

            <p className="reassure">
              Read-only scopes, your own token, encrypted at rest. There is no code path in
              bkmrks that can post, like, follow, reply, or DM — that’s architecture, not a
              setting you have to trust.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------ walkthrough */}
        <section className="band band--flush" id="walkthrough" aria-labelledby="walkthrough-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">06</span>
            </p>
            <div className="sec__head">
              <h2 id="walkthrough-h">Three moments.</h2>
            </div>

            {/* The product UI, once, as a framed object on black.
                Every string here is one the app actually renders. */}
            <div className="ui">
              <div className="ui__bar">
                <p className="ui__title">Your bookmarks</p>
                <p className="micro">Recently saved</p>
              </div>
              <div className="ui__body">
                <p className="ui__field">
                  hiring a first salesperson too early
                  <span className="ui__caret" aria-hidden="true" />
                </p>
                <p className="ui__field ui__field--empty">Filter by @handle…</p>
                <div className="ui__chips">
                  <span className="ui__chip ui__chip--on">Untagged</span>
                  <span className="ui__chip">Show oldest first</span>
                  <span className="ui__chip">Manage tags</span>
                </div>
              </div>
            </div>

            <div className="moments">
              <article className="moment">
                <span className="micro moment__n">01</span>
                <h3>The search</h3>
                <p>
                  A description typed into the search box — not a quote, not a handle, not a
                  keyword — and the thread it returns. The words typed and the words in the
                  result barely overlap.
                </p>
              </article>
              <article className="moment">
                <span className="micro moment__n">02</span>
                <h3>The tag</h3>
                <p>
                  One word typed onto a card, which immediately becomes a filter chip at the
                  top of the library. That was the entire filing system. There is no folder
                  tree, no setup, no second screen.
                </p>
              </article>
              <article className="moment">
                <span className="micro moment__n">03</span>
                <h3>The public page</h3>
                <p>
                  A tag flipped public, its link copied, and the resulting page open in a
                  browser with nobody signed in. It shows exactly one tag’s posts, and
                  nothing else about the account is visible or reachable from it.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- use cases */}
        <section className="band" id="usecases" aria-labelledby="usecases-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">07</span>
            </p>
            <div className="sec__head">
              <h2 id="usecases-h">Three ways this gets used.</h2>
            </div>

            <div className="cases">
              <article className="case">
                <h3>The pile you’ve stopped opening</h3>
                <p>
                  You saved a thread on pricing eight months ago and you know it’s in there.
                </p>
                <p>
                  <b>You need</b> it now, and you remember the argument, not the wording.
                </p>
                <p>
                  <b>Now you</b> describe it and it comes back — with everything else you
                  ever saved on the subject sitting next to it.
                </p>
              </article>
              <article className="case">
                <h3>The list you want to hand someone</h3>
                <p>
                  You’ve bookmarked thirty genuinely good posts on one subject over two
                  years.
                </p>
                <p>
                  <b>You need</b> to give someone the good ones without re-collecting them
                  in a DM or spending a post on it.
                </p>
                <p>
                  <b>Now you</b> tag them, flip that one tag public, and send a link.
                  Nothing else of yours becomes visible.
                </p>
              </article>
              <article className="case">
                <h3>The body of work by one person</h3>
                <p>
                  You’ve been saving one person’s posts for years without ever grouping
                  them.
                </p>
                <p>
                  <b>You need</b> to read the whole run at once.
                </p>
                <p>
                  <b>Now you</b> filter to their handle and the set is in front of you — and
                  you can flip it oldest-first and read forward.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* -------------------------------- compare — quiet paper band, no ticks */}
        <section className="band band--paper band--flush" id="compare" aria-labelledby="compare-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">08</span>
            </p>
            <div className="sec__head">
              <h2 id="compare-h">Against what you’re doing now.</h2>
            </div>

            <div className="compare-wrap">
              <table className="compare">
                <caption className="sr-only">
                  How native X bookmarks, a notes-app dump of links, and bkmrks each handle
                  four jobs.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">The job</span>
                    </th>
                    <th scope="col">Native X bookmarks</th>
                    <th scope="col">A notes-app dump of links</th>
                    <th scope="col">bkmrks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Find an old save</th>
                    <td>Scroll one list, newest first, until you spot it</td>
                    <td>
                      Search only the words you happened to paste; the post’s text was never
                      captured
                    </td>
                    <td>Describe what it was about and it’s on screen</td>
                  </tr>
                  <tr>
                    <th scope="row">Review this week</th>
                    <td>No idea which are new to you and which you’ve already seen</td>
                    <td>
                      Whatever you remembered to paste, if you kept it up — you didn’t
                    </td>
                    <td>
                      Newest at the top, unfiled ones behind one filter, so triage ends
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Leave with your data</th>
                    <td>No export. Your saves live and die inside X’s list</td>
                    <td>It’s your file, so this one you genuinely win</td>
                    <td>
                      No export yet. Your copy survives a deleted post, but it doesn’t leave
                      with you
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Setup</th>
                    <td>None — it’s already there, which is the whole trap</td>
                    <td>
                      Manual forever. Every save is a copy-paste you have to remember to do
                    </td>
                    <td>Sign in once; your whole history copies over on its own</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="compare-note">
              The third row isn’t a win. Export doesn’t exist yet, and a table that hid that
              wouldn’t be worth reading.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------------- fit */}
        <section className="band band--flush" id="fit" aria-labelledby="fit-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">09</span>
            </p>
            <div className="sec__head">
              <h2 id="fit-h">Worth it for some people. Not for most.</h2>
            </div>

            <div className="fit">
              <div className="fit__col">
                <h3>This is for you if</h3>
                <ul>
                  <li>
                    You’ve been on X for years and save constantly — somewhere between 800
                    and 5,000 deep.
                  </li>
                  <li>You’ve never once successfully searched that pile.</li>
                  <li>
                    You’ve already tried to fix it: a Notion page of pasted links that died
                    in a week, a browser folder, a DM to yourself.
                  </li>
                  <li>
                    You want a running public list of what you’re saving that isn’t your
                    posting feed.
                  </li>
                </ul>
              </div>
              <div className="fit__col">
                <h3>This is not for you if</h3>
                <ul>
                  <li>
                    You save things from all over the web. X bookmarks are the only input —
                    no extension, no share sheet, no URL saver.
                  </li>
                  <li>You want a free tool. There is no free tier, and no trial.</li>
                  <li>
                    You want to take notes on your saves. This stores what you saved; it
                    doesn’t let you annotate it.
                  </li>
                  <li>
                    You need to search exact strings, URLs, or quoted phrases. Search here
                    works on meaning, not literal text.
                  </li>
                  <li>
                    You want your data on your own machine. This is a hosted app with a
                    hosted database.
                  </li>
                  <li>You’re a team. Everything is scoped to one person’s account.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ trust */}
        <section className="band" id="trust" aria-labelledby="trust-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">10</span>
            </p>
            <div className="sec__head">
              <h2 id="trust-h">What it can and can’t do to your account.</h2>
            </div>

            <dl className="constraints">
              <div className="constraint">
                <dt>It cannot act as you</dt>
                <dd>
                  No posting, liking, following, replying, or DMing is possible from this
                  app. There is no code that does it, so it isn’t a setting you have to
                  trust.
                </dd>
              </div>
              <div className="constraint">
                <dt>Private until you say otherwise</dt>
                <dd>
                  Nothing is public until you deliberately flip one specific tag public. The
                  public pages are served by a separate data path that re-checks that flag
                  on every query — verified by a test, not by assurance. A private tag and a
                  tag that doesn’t exist are indistinguishable from the outside.
                </dd>
              </div>
              <div className="constraint">
                <dt>Your tokens are encrypted at rest</dt>
                <dd>
                  And the sign-in cookie in your browser carries only <em>which</em> account
                  you are, so it can’t be stolen and replayed against X.
                </dd>
              </div>
              <div className="constraint">
                <dt>Walking away leaves X untouched</dt>
                <dd>
                  Revoke access in your X settings whenever you want. Your actual X
                  bookmarks are unaffected — nothing here ever modifies them.
                </dd>
              </div>
              <div className="constraint constraint--counter">
                <dt>And the part that cuts the other way</dt>
                <dd>
                  This is a hosted app. A copy of your saved posts lives in its database,
                  not on your computer. There’s no local mode, and no export yet.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* -------------------------------------------- faq — quiet paper band */}
        <section className="band band--paper band--flush" id="faq" aria-labelledby="faq-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">11</span>
            </p>
            <div className="sec__head">
              <h2 id="faq-h">The obvious questions.</h2>
            </div>

            <div className="faq">
              <details open>
                <summary>Isn’t this just X bookmarks with extra steps?</summary>
                <p>
                  X gives you one reverse-chronological list. No tags, no grouping, no
                  meaning-based search, no sharing, no export — and no record of when you
                  bookmarked anything, only the order it comes back in. There’s no
                  discipline or folder scheme that fixes that, because the limit is in the
                  tool. The only move available inside X is to save less. bkmrks adds all of
                  it on top of the same bookmarks.
                </p>
              </details>
              <details>
                <summary>Does my library leave my machine?</summary>
                <p>
                  Yes, and that should be in front of you before you sign in. bkmrks is a
                  hosted app: a copy of your bookmarked posts lives in its cloud database,
                  not on your computer. There is no local mode and no offline mode. The text
                  of your saves is also sent to an outside service that indexes it by
                  meaning — that’s what makes the search work. What that buys you is
                  permanence and retrieval; what it costs you is trusting someone else’s
                  server. Your X tokens are stored encrypted rather than in plain text, and
                  the sign-in cookie in your browser carries only <em>which</em> account you
                  are.
                </p>
              </details>
              <details>
                <summary>Do I need X Premium, an API key, or a developer account?</summary>
                <p>
                  No. You sign in with your normal X account and that’s the whole setup. The
                  API access belongs to the product, not to you. Nothing here is gated on X
                  Premium.
                </p>
              </details>
              <details>
                <summary>Can it post, like, or follow from my account?</summary>
                <p>
                  No, and not as a matter of policy. The scopes requested are read scopes,
                  and there is no code in bkmrks that posts, likes, follows, replies, or DMs
                  — so there’s no setting to misconfigure and nothing to take on faith. It
                  reads your own bookmarks and nothing else.
                </p>
              </details>
              <details>
                <summary>Why does it cost money? It’s a bookmark viewer.</summary>
                <p>
                  X’s API meters per request — reading your bookmarks costs real money on
                  every sync, and so does indexing them so they can be searched by meaning.
                  There’s no free tier because there’s no free read.
                </p>
              </details>
              <details>
                <summary>How long does the first sync take?</summary>
                <p>
                  A few minutes for a big pile, running in the background — you don’t have
                  to sit and watch it. Search keeps getting sharper over the first day as
                  indexing catches up, so a post you saved years ago may not be findable in
                  the first ten minutes.
                </p>
              </details>
              <details>
                <summary>Can I search for an exact phrase, a URL, or a quote?</summary>
                <p>
                  Not reliably. Search here works on meaning, not literal text, so it’s
                  built for “that thread about pricing a small product” and not for finding
                  a specific string. If you’re after a particular person’s posts, the
                  @handle filter is the better tool for that.
                </p>
              </details>
              <details>
                <summary>What happens when a post I saved gets deleted off X?</summary>
                <p>
                  Your copy stays. Every saved post is re-checked against X daily, so when
                  the original disappears, what you saved doesn’t turn into a dead link —
                  the text is still readable in your library.
                </p>
              </details>
              <details>
                <summary>Does it work on my phone?</summary>
                <p>
                  It’s a web page, so yes — it works in a phone browser. There’s no iOS or
                  Android app.
                </p>
              </details>
              <details>
                <summary>What if I want out?</summary>
                <p>
                  Revoke the app’s access in your X settings whenever you like. Your actual X
                  bookmarks are untouched — nothing here ever modifies them, so walking away
                  costs you nothing on X’s side. Access to the library runs on an active
                  membership. Worth knowing up front: there’s no export yet, so what you
                  build here doesn’t currently come out with you.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* -------------------------------- final — last colour hit, same button */}
        <section className="band band--orange band--flush final" id="final" aria-labelledby="final-h">
          <p className="final__run" aria-hidden="true">
            {runs(14)}
          </p>
          <div className="wrap">
            <h2 id="final-h">
              No more endless &amp; <em>forgotten</em> bookmarks.
            </h2>
            <p className="final__support">
              Sign in, let your history copy over, and go find the one you’ve never been
              able to find.
            </p>
            <div className="final__act">
              <a className="btn btn--oncolour" href={ctaHref}>
                {ctaLabel}
              </a>
            </div>
            <p className="final__risk">
              Read-only, so nothing here can touch your X account — and revoking access
              leaves your actual bookmarks exactly as they are.
              <br />
              <b>Paid, no free tier.</b>
            </p>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- footer */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer__grid">
            <div>
              <h2 className="micro">Product</h2>
              <ul className="footer__nav">
                <li>
                  <a href="#how">How it works</a>
                </li>
                <li>
                  <a href="#outcomes">What you get</a>
                </li>
                <li>
                  <a href="#fit">Who it’s for</a>
                </li>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
              </ul>
            </div>
            {/*
              LANDING-FULL §1 Footer, column 2 (Legal) is intentionally not rendered.
              Privacy, Terms and Contact do not exist in this repo, and BUSINESS.md §14
              lists data residency, retention and deletion/DSAR as undecided. A page that
              takes an OAuth grant and links to a dead /privacy is worse than a missing
              column. Founder gate: write the policy, then add the column.
              The copyright line is likewise omitted — the legal entity name is unset.
            */}
            <div>
              <h2 className="micro">bkmrks</h2>
              <p className="footer__pos">
                <b>
                  bkmrks — a private, searchable library for everything you’ve bookmarked on
                  X.
                </b>{" "}
                Read-only. Paid, no free tier.
              </p>
            </div>
          </div>
          <div className="footer__base micro">
            <span>bkmrks</span>
            <span>Read-only · Paid, no free tier</span>
          </div>
        </div>
      </footer>

      {/* -------------------------------------------- sticky mobile CTA (§15) */}
      <div className="sticky" id="sticky" data-shown="false">
        <span className="sticky__sub">
          Read-only · Paid, no free tier
        </span>
        <a className="btn btn--oncolour" href={ctaHref}>
          {ctaLabel}
        </a>
      </div>

      <script dangerouslySetInnerHTML={{ __html: STICKY_SCRIPT }} />
    </div>
  );
}
