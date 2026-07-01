type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") === true ? params.next : "/journal";
  const errorMessage =
    params.error === "config"
      ? "Owner login is not configured yet."
      : params.error === "invalid"
        ? "That username or password did not work."
        : null;

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="owner-login-title">
        <span className="login-kicker">Owner Access</span>
        <h1 id="owner-login-title">Private Journal Login</h1>
        <p>
          Sign in to review drafts, mysteries, private map details, and owner-only
          settings.
        </p>
        <form className="login-form" action="/login/submit" method="post">
          <input type="hidden" name="next" value={nextPath} />
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
          <button type="submit">Log In</button>
        </form>
      </section>
    </main>
  );
}
