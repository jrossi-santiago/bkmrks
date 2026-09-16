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

/* Progressive enhancement only — the page is complete without it.
   1. Sticky mobile CTA appears once the hero scrolls out (LANDING-FULL §15).
   2. The CTA takes its Loading label on the way to X (§16 button states).
      The label travels on the element, so no copy lives in this script. */
const LANDING_SCRIPT = `(function(){
  var hero=document.getElementById('hero'),bar=document.getElementById('sticky');
  if(hero&&bar&&'IntersectionObserver' in window){
    new IntersectionObserver(function(e){
      bar.setAttribute('data-shown',String(!e[0].isIntersecting));
    },{rootMargin:'-72px 0px 0px 0px'}).observe(hero);
  }
  document.addEventListener('click',function(ev){
    if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
    var t=ev.target,a=t&&t.closest?t.closest('a[data-loading]'):null;
    if(!a||a.getAttribute('aria-busy')==='true')return;
    a.setAttribute('aria-busy','true');
    a.style.minWidth=a.offsetWidth+'px';
    a.textContent=a.getAttribute('data-loading');
  });
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

  /* Button states, LANDING-FULL §16. "Go to dashboard" already ships in the app.
     The hero button sits next to the failure banner, so it is the one that
     carries the retry label; the other three keep the standing ask. */
  const signedIn = Boolean(session);
  const ctaHref = signedIn ? "/app" : "/login";
  const ctaLabel = signedIn ? "Go to dashboard" : "Sign in with X";
  const loadingLabel = signedIn ? undefined : "Taking you to X…";
  const heroCtaLabel =
    !signedIn && loginError ? "That didn't go through. Try again." : ctaLabel;

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
          <a className="btn btn--ghost" href={ctaHref} data-loading={loadingLabel}>
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
                <span>{runs(12)}</span>
              </span>
              <span className="frame__run frame__run--bottom" aria-hidden="true">
                <span>{runs(12)}</span>
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
                      <strong>Sign-in didn’t finish.</strong>
                      <p>
                        Nothing was connected. Nothing on your X account changed. Try again
                        in a minute.
                      </p>
                    </div>
                  )}

                  <p className="micro hero__eyebrow">For people with 2,000 bookmarks</p>

                  <h1 id="hero-h">
                    No more endless &amp; <em>forgotten</em> bookmarks.
                  </h1>

                  <p className="hero__sub">
                    Every post you saved on X, in one place. Find any of them by what it
                    was about.
                  </p>

                  <div className="hero__act">
                    <a className="btn" href={ctaHref} data-loading={loadingLabel}>
                      {heroCtaLabel}
                    </a>
                    <a className="anchor-link only-wide" href="#how">
                      See how it works ↓
                    </a>
                  </div>

                  <div className="hero__fine">
                    <p className="hero__trust">
                      <b>It can only read.</b> It can’t post, like, or follow for you.{" "}
                      <b>Paid. No free version.</b>
                    </p>

                    <p className="hero__perm">
                      There is nothing to set up. X will ask you to allow read access to
                      your bookmarks. That is all we ask for, and all we can use.
                    </p>
                  </div>

                  <p className="micro hero__mark">bkmrks · Read only · No free version</p>
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
              <h2 id="problem-h">You saved it. Then you never saw it again.</h2>
              <p className="lede">It is not you. There is just no way back in.</p>
            </div>

            {/* The unbroken column: dense, undifferentiated, no controls. */}
            <div className="column">
              <div className="column__beat">
                <h3>Saving is easy.</h3>
                <p>
                  One tap. No thinking. You save four posts on Monday. By Friday you have
                  twenty-five.
                </p>
              </div>
              <div className="column__beat">
                <h3>The pile grows.</h3>
                <p>
                  It is one long list, newest first. No tags. No groups. No way to ask for
                  the ones about hiring.
                </p>
              </div>
              <div className="column__beat">
                <h3>Then you need one.</h3>
                <p>
                  You remember the idea, not the words. So you scroll for a minute, give
                  up, and guess. The post is still in there. You just cannot reach it.
                </p>
              </div>
            </div>

            <p className="aside-note">
              You have tried to fix this. A page of pasted links. A browser folder. A note
              to yourself.
            </p>

            <p className="closer">
              Saved posts are not a library. They are a list you never open again.
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------- stakes */}
        <section className="band" id="stakes" aria-labelledby="stakes-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">02</span>
            </p>
            <div className="sec__head">
              <h2 id="stakes-h">The cost is not the ten minutes.</h2>
              <p className="lede">It is what those ten minutes teach you.</p>
            </div>

            <div className="prose prose--mid">
              <p>You went looking. You did not find it. So next time you do not look.</p>
              <p>
                That is the real loss. You still save things. You just stopped getting
                anything back.
              </p>
            </div>

            <p className="pull">Every save goes into a drawer you know you will not open.</p>
          </div>
        </section>

        {/* -------------------------------------------------- interstitial 1 */}
        <aside className="inter">
          <div className="wrap">
            <p>
              This is not a willpower problem. It is a <em>finding</em> problem. That one
              can be fixed.
            </p>
          </div>
        </aside>

        {/* ------------------------------------ after — colour hit: ink orange */}
        <section className="band band--orange band--flush" id="after" aria-labelledby="after-h">
          <div className="wrap">
            <p className="micro label">
              <span className="label__n">03</span>
            </p>
            <div className="sec__head">
              <h2 id="after-h">The pile stops being a pile.</h2>
              <p className="lede">
                Someone asks you the thing. You type what the post was about. It is on
                screen.
              </p>
            </div>

            <p className="after__body">
              You did not remember who wrote it. You did not remember the words. You did
              not need to. It was four months old.
            </p>

            <p className="promise">
              Every post you saved on X, in one place you can search
              <em>and actually get back out.</em>
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
              <h2 id="outcomes-h">What you get.</h2>
              <p className="lede">Six things you can do on day one.</p>
            </div>

            <div className="board">
              <article className="board__cell">
                <p className="micro board__n">01</p>
                <h3>Everything you saved, in one place</h3>
                <p>
                  Your whole history copies over the first time you sign in. Then it is
                  yours to search.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">02</p>
                <h3>Find a post from a hazy memory</h3>
                <p>You remember the idea, not the words. That is enough now.</p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">03</p>
                <h3>This week’s saves, done in one sitting</h3>
                <p>
                  New ones sit at the top. The ones you have not sorted yet are one click
                  away.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">04</p>
                <h3>The bottom of the pile, at last</h3>
                <p>
                  Flip the order and read the oldest first. Those have been buried since
                  the day you saved them.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">05</p>
                <h3>A copy that outlives the post</h3>
                <p>
                  We check your saves against X every day. If a post is deleted, your copy
                  still reads.
                </p>
              </article>
              <article className="board__cell">
                <p className="micro board__n">06</p>
                <h3>A link you can hand to anyone</h3>
                <p>
                  Tag ten posts, make that one tag public, and send the link. Those ten
                  show. Nothing else of yours does.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- interstitial 2 */}
        <aside className="inter">
          <div className="wrap">
            <p>
              That is a big claim for a bookmark list. Here is what is{" "}
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
              <h2 id="how-h">Three steps.</h2>
            </div>

            <div className="steps">
              <article className="step">
                <span className="step__n" aria-hidden="true">1</span>
                <h3>Sign in with X</h3>
                <p>
                  Nothing to set up. No extra account, no keys, no paid X plan. You sign in
                  the same way you sign in anywhere.
                </p>
              </article>
              <article className="step">
                <span className="step__n" aria-hidden="true">2</span>
                <h3>Your history copies over</h3>
                <p>
                  Every post you ever saved moves into a place of its own. Text, author and
                  pictures. A big pile takes a few minutes. You do not have to watch it.
                </p>
              </article>
              <article className="step">
                <span className="step__n" aria-hidden="true">3</span>
                <h3>Say what you are looking for</h3>
                <p>
                  Type what the post was about, not what it said. You can also pick a
                  person or a tag. All three work together.
                </p>
              </article>
            </div>

            <p className="reassure">
              It can only read. There is no code here that can post, like, follow, reply or
              send a message as you. Your sign-in is stored encrypted, not in plain text.
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
                  You type what a post was about. The right one comes back. The words you
                  typed and the words in the post barely match.
                </p>
              </article>
              <article className="moment">
                <span className="micro moment__n">02</span>
                <h3>The tag</h3>
                <p>
                  You type one word on a post. It turns into a button at the top that shows
                  you that group. That is the whole filing system.
                </p>
              </article>
              <article className="moment">
                <span className="micro moment__n">03</span>
                <h3>The public page</h3>
                <p>
                  You make one tag public and copy the link. Anyone can open it. They see
                  those posts and nothing else about you.
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
              <h2 id="usecases-h">Three ways people use it.</h2>
            </div>

            <div className="cases">
              <article className="case">
                <h3>The pile you stopped opening</h3>
                <p>You saved a thread about pricing eight months ago.</p>
                <p>
                  <b>You need</b> it today, and you only remember the idea.
                </p>
                <p>
                  <b>Now you</b> describe it and it comes back, with everything else you
                  saved on the subject.
                </p>
              </article>
              <article className="case">
                <h3>The list you want to share</h3>
                <p>You have saved thirty good posts on one subject.</p>
                <p>
                  <b>You need</b> to hand someone the good ones.
                </p>
                <p>
                  <b>Now you</b> tag them, make that tag public, and send one link.
                </p>
              </article>
              <article className="case">
                <h3>One person’s whole run</h3>
                <p>You have saved one person’s posts for years.</p>
                <p>
                  <b>You need</b> to read them all at once.
                </p>
                <p>
                  <b>Now you</b> pick their name, flip to oldest first, and read forward.
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
              <h2 id="compare-h">Next to what you do now.</h2>
            </div>

            <div className="compare-wrap">
              <table className="compare">
                <caption className="sr-only">
                  How saved posts on X, a notes app full of links, and bkmrks each handle
                  four jobs.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">The job</span>
                    </th>
                    <th scope="col">Saved posts on X</th>
                    <th scope="col">A notes app</th>
                    <th scope="col">bkmrks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Find an old save</th>
                    <td>Scroll one list, newest first, until you spot it</td>
                    <td>You can only search the words you pasted</td>
                    <td>Say what it was about and it is on screen</td>
                  </tr>
                  <tr>
                    <th scope="row">Review this week</th>
                    <td>No way to tell new from old</td>
                    <td>Only what you remembered to paste</td>
                    <td>Newest on top, unsorted ones one click away</td>
                  </tr>
                  <tr>
                    <th scope="row">Take it with you</th>
                    <td>No way out. Your saves live inside X</td>
                    <td>It is your file, so you win this one</td>
                    <td>Not yet. Your copy lasts, but it cannot leave</td>
                  </tr>
                  <tr>
                    <th scope="row">Setup</th>
                    <td>None, which is the whole trap</td>
                    <td>Every save is a copy and paste you must remember</td>
                    <td>Sign in once. Your history copies itself</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="compare-note">
              Row three is not a win. You cannot take your library out yet. Hiding that
              would not be honest.
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
                  <li>You have been on X for years and save all the time.</li>
                  <li>You have never once found an old save when you needed it.</li>
                  <li>You already tried a page of links or a folder, and it died.</li>
                  <li>You want a public list of what you save that is not your feed.</li>
                </ul>
              </div>
              <div className="fit__col">
                <h3>This is not for you if</h3>
                <ul>
                  <li>You save things from all over the web. X is the only source here.</li>
                  <li>You want it free. There is no free version and no trial.</li>
                  <li>You want to write notes on your saves. You cannot yet.</li>
                  <li>You need to find exact words or a link. Search works on ideas.</li>
                  <li>You want your data on your own computer. This lives online.</li>
                  <li>You are a team. This is built for one person.</li>
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
              <h2 id="trust-h">What it can and cannot do.</h2>
            </div>

            <dl className="constraints">
              <div className="constraint">
                <dt>It cannot act as you</dt>
                <dd>
                  It cannot post, like, follow, reply or send messages. There is no code
                  here that does any of it.
                </dd>
              </div>
              <div className="constraint">
                <dt>Private until you say so</dt>
                <dd>
                  Nothing is public until you make one tag public. From the outside, a
                  private tag looks the same as a tag that does not exist.
                </dd>
              </div>
              <div className="constraint">
                <dt>Your sign-in is kept encrypted</dt>
                <dd>
                  The cookie in your browser only says which account you are. It cannot be
                  stolen and used on X.
                </dd>
              </div>
              <div className="constraint">
                <dt>Leaving changes nothing on X</dt>
                <dd>
                  Turn off access in your X settings whenever you want. Your real bookmarks
                  stay exactly as they are.
                </dd>
              </div>
              <div className="constraint constraint--counter">
                <dt>And the part that cuts the other way</dt>
                <dd>
                  Your saved posts live on our server, not on your computer. There is no
                  offline mode, and no way to take them out yet.
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
                <summary>Is this just X bookmarks with extra steps?</summary>
                <p>
                  X gives you one long list. No tags, no groups, no real search, no
                  sharing. No folder trick fixes that, because the limit is in X. bkmrks
                  adds all of it on top of the same saves.
                </p>
              </details>
              <details>
                <summary>Where does my library live?</summary>
                <p>
                  On our server, not on your computer. There is no offline mode. To make
                  search work, the text of your saves is also read by an outside service.
                  You gain search and a copy that lasts. You give up keeping it all on your
                  own machine.
                </p>
              </details>
              <details>
                <summary>Do I need anything special from X?</summary>
                <p>
                  No. You sign in with your normal X account and that is the whole setup.
                  Nothing here needs a paid X plan.
                </p>
              </details>
              <details>
                <summary>Can it post or follow from my account?</summary>
                <p>
                  No. It asks X for read access only, and there is no code here that posts,
                  likes, follows, replies or sends messages. It reads your saves and
                  nothing else.
                </p>
              </details>
              <details>
                <summary>Why does it cost money?</summary>
                <p>
                  X charges us every time we read your bookmarks. Making them searchable
                  costs money too. There is no free version because there is no free read.
                </p>
              </details>
              <details>
                <summary>How long does the first copy take?</summary>
                <p>
                  A few minutes for a big pile, and it runs on its own. Search keeps
                  getting sharper over the first day, so an old post may not show up in the
                  first ten minutes.
                </p>
              </details>
              <details>
                <summary>Can I search for exact words or a link?</summary>
                <p>
                  Not reliably. Search works on ideas, not exact text. It is built for
                  “that thread about pricing a small product.” To find one person’s posts,
                  pick their name instead.
                </p>
              </details>
              <details>
                <summary>What if a post I saved gets deleted?</summary>
                <p>
                  Your copy stays. We check your saves against X every day, so a deleted
                  post does not turn into a dead link. The text is still there to read.
                </p>
              </details>
              <details>
                <summary>Does it work on my phone?</summary>
                <p>
                  Yes. It is a web page, so it works in a phone browser. There is no app to
                  install.
                </p>
              </details>
              <details>
                <summary>What if I want out?</summary>
                <p>
                  Turn off access in your X settings whenever you like. Your real bookmarks
                  are untouched, so leaving costs you nothing on X. Worth knowing up front:
                  there is no way to take your library out with you yet.
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
              Sign in, let your history copy over, and go find the one you could never
              find.
            </p>
            <div className="final__act">
              <a className="btn btn--oncolour" href={ctaHref} data-loading={loadingLabel}>
                {ctaLabel}
              </a>
            </div>
            <p className="final__risk">
              It can only read, so nothing here can touch your X account. Turn off access
              and your bookmarks stay as they are.
              <br />
              <b>Paid. No free version.</b>
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
                  <a href="#fit">Who it is for</a>
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
                <b>bkmrks — a private, searchable home for everything you saved on X.</b>{" "}
                Read only. Paid. No free version.
              </p>
            </div>
          </div>
          <div className="footer__base micro">
            <span>bkmrks</span>
            <span>Read only · No free version</span>
          </div>
        </div>
      </footer>

      {/* -------------------------------------------- sticky mobile CTA (§15) */}
      <div className="sticky" id="sticky" data-shown="false">
        <span className="sticky__sub">Read only · No free version</span>
        <a className="btn btn--oncolour" href={ctaHref} data-loading={loadingLabel}>
          {ctaLabel}
        </a>
      </div>

      <script dangerouslySetInnerHTML={{ __html: LANDING_SCRIPT }} />
    </div>
  );
}
