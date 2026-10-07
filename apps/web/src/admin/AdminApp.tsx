import { useEffect, useState, type FormEvent } from "react";
import type { AdminCatalogResponseV1, AdminSessionResponseV1 } from "@kodergarden/shared";

type State = { readonly kind: "loading" } | { readonly kind: "signed-out"; readonly message?: string } | { readonly kind: "signed-in"; readonly session: AdminSessionResponseV1; readonly catalog: AdminCatalogResponseV1 | null; readonly error?: string };

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? `Request failed (${response.status})`); }
  return response.json() as Promise<T>;
}

export function AdminApp() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCatalog = async (session: AdminSessionResponseV1) => {
    try { setState({ kind: "signed-in", session, catalog: await json<AdminCatalogResponseV1>(await fetch("/api/admin/catalog")) }); }
    catch (reason) { setState({ kind: "signed-in", session, catalog: null, error: reason instanceof Error ? reason.message : "Catalog unavailable" }); }
  };
  useEffect(() => { void (async () => {
    const response = await fetch("/api/admin/auth/session");
    if (response.status === 401) { setState({ kind: "signed-out" }); return; }
    try { await loadCatalog(await json<AdminSessionResponseV1>(response)); }
    catch (reason) { setState({ kind: "signed-out", message: reason instanceof Error ? reason.message : "Unable to check session" }); }
  })(); }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true);
    try {
      const session = await json<AdminSessionResponseV1>(await fetch("/api/admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }));
      setPassword(""); await loadCatalog(session);
    } catch (reason) { setState({ kind: "signed-out", message: reason instanceof Error ? reason.message : "Sign in failed" }); }
    finally { setSubmitting(false); }
  };
  const logout = async () => {
    if (state.kind !== "signed-in") return;
    await fetch("/api/admin/auth/logout", { method: "POST", headers: { "x-kodergarden-csrf": state.session.csrfToken } });
    setState({ kind: "signed-out" });
  };

  if (state.kind === "loading") return <main className="admin-state"><div className="admin-brand"><span>K</span><strong>Kodergarden</strong></div><p>Checking your admin session…</p></main>;
  if (state.kind === "signed-out") return <main className="admin-login"><section className="admin-login-card"><div className="admin-brand"><span>K</span><strong>Koder<em>garden</em></strong></div><small>TEAM ADMIN</small><h1>Welcome back</h1><p>Sign in to review the published curriculum.</p><form onSubmit={login}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{state.message && <div className="admin-error" role="alert">{state.message}</div>}<button disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button></form><a href="/">← Learner app</a></section></main>;
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><span>K</span><strong>Koder<em>garden</em></strong></div><div><span>{state.session.user.displayName}</span><small>{state.session.user.email}</small></div><button onClick={() => void logout()}>Sign out</button></header><section className="admin-content"><div className="admin-title"><div><small>CURRICULUM</small><h1>Published campaigns</h1><p>This first admin milestone is read-only. Drafting and publishing come next.</p></div><span>{state.catalog?.campaigns.length ?? 0} campaigns</span></div>{state.error && <div className="admin-error" role="alert">{state.error} <button onClick={() => void loadCatalog(state.session)}>Retry</button></div>}<div className="admin-campaigns">{state.catalog?.campaigns.map((campaign) => <article key={campaign.id}><div><small>{campaign.kind}</small><h2>{campaign.titleKey}</h2><p>{campaign.descriptionKey}</p></div><dl><div><dt>Challenges</dt><dd>{campaign.challengeCount}</dd></div><div><dt>Published revision</dt><dd title={campaign.revisionId}>{campaign.revisionId.slice(0, 8)}</dd></div><div><dt>Slug</dt><dd>{campaign.id}</dd></div></dl></article>)}</div></section></main>;
}
