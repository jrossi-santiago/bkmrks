export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 640 }}>
      <h1>bkmrks</h1>
      <p>
        Phase 0 vendor spike. <a href="/login">Sign in with X</a> to fetch your
        bookmarks once via the API and dump the raw response for inspection.
      </p>
      <p>
        <a href="/health">/health</a> — check env vars and the exact
        callback URL this deployment will send, without logging in.
      </p>
    </main>
  );
}
