import { useEffect, useState, type FormEvent } from "react";
import type {
  AdminCatalogResponseV1,
  AdminCampaignHistoryResponseV1,
  AdminDraft,
  AdminDraftResponseV1,
  AdminSessionResponseV1,
  AdminTeamMember,
  AdminTeamResponseV1,
  AdminValidationResponseV1,
  CampaignResponseV1,
  CatalogCampaignDefinition,
} from "@kodergarden/shared";
import { ChallengeMechanicsEditor } from "./ChallengeMechanicsEditor.js";

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function AdminApp() {
  const [session, setSession] = useState<AdminSessionResponseV1 | null>(null),
    [catalog, setCatalog] = useState<AdminCatalogResponseV1 | null>(null),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState<AdminDraft | null>(null),
    [team, setTeam] = useState<readonly AdminTeamMember[] | null>(null),
    [history, setHistory] = useState<AdminCampaignHistoryResponseV1 | null>(null),
    [validation, setValidation] = useState<AdminValidationResponseV1 | null>(null),
    [preview, setPreview] = useState<CatalogCampaignDefinition | null>(null),
    [previewLocale, setPreviewLocale] = useState<"en" | "es">("en");
  const loadCatalog = async () =>
    setCatalog(
      await json<AdminCatalogResponseV1>(await fetch("/api/admin/catalog")),
    );
  useEffect(() => {
    void (async () => {
      try {
        const current = await json<AdminSessionResponseV1>(
          await fetch("/api/admin/auth/session"),
        );
        setSession(current);
        await loadCatalog();
      } catch {
        /* signed out */
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const mutate = async <T,>(url: string, method: string, body?: unknown) => {
    if (!session) throw new Error("Session expired");
    return json<T>(
      await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
          "x-kodergarden-csrf": session.csrfToken,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  };
  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const current = await json<AdminSessionResponseV1>(
        await fetch("/api/admin/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        }),
      );
      setSession(current);
      setPassword("");
      setCatalog(
        await json<AdminCatalogResponseV1>(await fetch("/api/admin/catalog")),
      );
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    if (session)
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { "x-kodergarden-csrf": session.csrfToken },
      });
    setSession(null);
    setCatalog(null);
    setDraft(null);
  };
  const openDraft = async (campaignId: string, draftId: string | null) => {
    setBusy(true);
    setMessage("");
    try {
      const result = draftId
        ? await json<AdminDraftResponseV1>(
            await fetch(`/api/admin/drafts/${draftId}`),
          )
        : await mutate<AdminDraftResponseV1>(
            `/api/admin/campaigns/${campaignId}/drafts`,
            "POST",
          );
      setDraft(result.draft);
      setPreview(null);
      setValidation(null);
      await loadCatalog();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to open draft",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await mutate<AdminDraftResponseV1>(
        `/api/admin/drafts/${draft.id}`,
        "PATCH",
        {
          order: draft.order,
          translations: draft.translations,
          challenges: draft.challenges,
        },
      );
      setDraft(result.draft);
      setMessage("Draft saved.");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to save draft",
      );
    } finally {
      setBusy(false);
    }
  };
  const showPreview = async (locale: "en" | "es") => {
    if (!draft) return;
    setBusy(true);
    setMessage("");
    try {
      const saved = await mutate<AdminDraftResponseV1>(
        `/api/admin/drafts/${draft.id}`,
        "PATCH",
        {
          order: draft.order,
          translations: draft.translations,
          challenges: draft.challenges,
        },
      );
      setDraft(saved.draft);
      setPreviewLocale(locale);
      setPreview(
        (
          await json<CampaignResponseV1>(
            await fetch(
              `/api/admin/drafts/${draft.id}/preview?locale=${locale}`,
            ),
          )
        ).campaign,
      );
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to preview draft",
      );
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (
      !draft ||
      !window.confirm(
        `Publish version ${draft.version}? Learners will immediately receive this revision.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await mutate<AdminDraftResponseV1>(
        `/api/admin/drafts/${draft.id}`,
        "PATCH",
        {
          order: draft.order,
          translations: draft.translations,
          challenges: draft.challenges,
        },
      );
      await mutate<CampaignResponseV1>(
        `/api/admin/drafts/${draft.id}/publish`,
        "POST",
      );
      setDraft(null);
      setPreview(null);
      await loadCatalog();
      setMessage("Revision published successfully.");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to publish",
      );
    } finally {
      setBusy(false);
    }
  };
  const validateDraft = async () => {
    if (!draft) return;
    setBusy(true);
    setMessage("");
    try {
      const saved = await mutate<AdminDraftResponseV1>(`/api/admin/drafts/${draft.id}`, "PATCH", { order: draft.order, translations: draft.translations, challenges: draft.challenges });
      setDraft(saved.draft);
      const result = await json<AdminValidationResponseV1>(await fetch(`/api/admin/drafts/${draft.id}/validate`));
      setValidation(result);
      setMessage(result.valid ? "Draft is ready to publish." : `Validation found ${result.issues.length} issue${result.issues.length === 1 ? "" : "s"}.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Unable to validate draft");
    } finally { setBusy(false); }
  };
  const setCampaignCopy = (
    locale: "en" | "es",
    field: "title" | "description",
    value: string,
  ) =>
    setDraft(
      (current) =>
        current && {
          ...current,
          translations: {
            ...current.translations,
            [locale]: { ...current.translations[locale], [field]: value },
          },
        },
    );
  const setChallenge = (
    slug: string,
    locale: "en" | "es",
    field: "title" | "instruction" | "concept",
    value: string,
  ) =>
    setDraft(
      (current) =>
        current && {
          ...current,
          challenges: current.challenges.map((item) =>
            item.slug === slug
              ? {
                  ...item,
                  translations: {
                    ...item.translations,
                    [locale]: { ...item.translations[locale], [field]: value },
                  },
                }
              : item,
          ),
        },
    );
  const updateChallenge = (slug: string, change: Partial<AdminDraft["challenges"][number]>) =>
    setDraft((current) => current && ({ ...current, challenges: current.challenges.map((item) => item.slug === slug ? { ...item, ...change } : item) }));
  const moveChallenge = (slug: string, direction: -1 | 1) => setDraft((current) => {
    if (!current) return current;
    const challenges=[...current.challenges];const index=challenges.findIndex((item)=>item.slug===slug);const target=index+direction;if(index<0||target<0||target>=challenges.length)return current;[challenges[index],challenges[target]]=[challenges[target]!,challenges[index]!];return{...current,challenges:challenges.map((item,position)=>({...item,order:position+1}))};
  });
  const duplicateChallenge=async(sourceSlug:string)=>{if(!draft)return;const slug=window.prompt("New challenge slug (lowercase letters, numbers, and hyphens):",`${sourceSlug}-copy`);if(!slug)return;setBusy(true);setMessage("");try{await mutate(`/api/admin/drafts/${draft.id}`,"PATCH",{order:draft.order,translations:draft.translations,challenges:draft.challenges});const result=await mutate<AdminDraftResponseV1>(`/api/admin/drafts/${draft.id}/challenges`,"POST",{sourceSlug,slug});setDraft(result.draft);setMessage("Challenge duplicated and draft saved.");}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to duplicate challenge");}finally{setBusy(false);}};
  const removeChallenge=async(slug:string)=>{if(!draft||!window.confirm(`Remove ${slug} from this draft?`))return;setBusy(true);setMessage("");try{const result=await mutate<AdminDraftResponseV1>(`/api/admin/drafts/${draft.id}/challenges/${encodeURIComponent(slug)}`,"DELETE");setDraft(result.draft);setMessage("Challenge removed from draft.");}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to remove challenge");}finally{setBusy(false);}};
  const openTeam=async()=>{setBusy(true);setMessage("");try{const result=await json<AdminTeamResponseV1>(await fetch("/api/admin/team"));setTeam(result.members);setDraft(null);}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to load team");}finally{setBusy(false);}};
  const createMember=async(input:{email:string;displayName:string;password:string;role:"admin"|"viewer"})=>{setBusy(true);setMessage("");try{await mutate<AdminTeamMember>("/api/admin/team","POST",input);const result=await json<AdminTeamResponseV1>(await fetch("/api/admin/team"));setTeam(result.members);setMessage("Team member created.");}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to create team member");}finally{setBusy(false);}};
  const updateMember=async(id:string,input:{role?:"admin"|"viewer";disabled?:boolean;password?:string})=>{setBusy(true);setMessage("");try{await mutate<AdminTeamMember>(`/api/admin/team/${id}`,"PATCH",input);const result=await json<AdminTeamResponseV1>(await fetch("/api/admin/team"));setTeam(result.members);setMessage("Team member updated.");}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to update team member");}finally{setBusy(false);}};
  const openHistory=async(campaignId:string)=>{setBusy(true);setMessage("");try{setHistory(await json<AdminCampaignHistoryResponseV1>(await fetch(`/api/admin/campaigns/${campaignId}/history`)));}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to load history");}finally{setBusy(false);}};
  const restoreRevision=async(revisionId:string)=>{if(!history)return;setBusy(true);setMessage("");try{const result=await mutate<AdminDraftResponseV1>(`/api/admin/campaigns/${history.campaignId}/restore/${revisionId}`,"POST");setHistory(null);setDraft(result.draft);await loadCatalog();setMessage("Historical revision restored as a new draft.");}catch(reason){setMessage(reason instanceof Error?reason.message:"Unable to restore revision");}finally{setBusy(false);}};
  if (loading)
    return (
      <main className="admin-state">
        <p>Checking your admin session…</p>
      </main>
    );
  if (!session)
    return (
      <main className="admin-login">
        <section className="admin-login-card">
          <Brand />
          <small>TEAM ADMIN</small>
          <h1>Welcome back</h1>
          <p>Sign in to manage the curriculum.</p>
          <form onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {message && (
              <div className="admin-error" role="alert">
                {message}
              </div>
            )}
            <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <a href="/">← Learner app</a>
        </section>
      </main>
    );
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Brand />
        <div>
          <span>{session.user.displayName}</span>
          <small>{session.user.email}</small>
        </div>
        <button onClick={() => team ? setTeam(null) : void openTeam()}>{team ? "Campaigns" : "Team"}</button>
        <button onClick={() => void logout()}>Sign out</button>
      </header>
      <section className="admin-content">
        {message && (
          <div
            className={
              message.includes("success") || message.includes("saved") || message.includes("ready") || message.includes("created") || message.includes("updated") || message.includes("restored")
                ? "admin-notice"
                : "admin-error"
            }
          >
            {message}
          </div>
        )}
        {team ? <TeamPanel members={team} canEdit={session.user.role === "admin"} busy={busy} onCreate={(input)=>void createMember(input)} onUpdate={(id,input)=>void updateMember(id,input)}/> : history ? <HistoryPanel history={history} canRestore={session.user.role === "admin"} busy={busy} onBack={()=>setHistory(null)} onRestore={(id)=>void restoreRevision(id)}/> : draft ? (
          <DraftEditor
            draft={draft}
            busy={busy}
            preview={preview}
            previewLocale={previewLocale}
            onBack={() => {
              setDraft(null);
              setPreview(null);
              setMessage("");
            }}
            onSave={() => void save()}
            onPublish={() => void publish()}
            onPreview={(locale) => void showPreview(locale)}
            onValidate={() => void validateDraft()}
            validation={validation}
            setCampaignCopy={setCampaignCopy}
            setChallenge={setChallenge}
            updateChallenge={updateChallenge}
            moveChallenge={moveChallenge}
            duplicateChallenge={(slug)=>void duplicateChallenge(slug)}
            removeChallenge={(slug)=>void removeChallenge(slug)}
          />
        ) : (
          <>
            <div className="admin-title">
              <div>
                <small>CURRICULUM</small>
                <h1>Campaigns</h1>
                <p>
                  Create an isolated draft, review both languages, then publish
                  it atomically.
                </p>
              </div>
              <span>{catalog?.campaigns.length ?? 0} campaigns</span>
            </div>
            <div className="admin-campaigns">
              {catalog?.campaigns.map((campaign) => (
                <article key={campaign.id}>
                  <div>
                    <small>{campaign.kind}</small>
                    <h2>{campaign.titleKey}</h2>
                    <p>{campaign.descriptionKey}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Challenges</dt>
                      <dd>{campaign.challengeCount}</dd>
                    </div>
                    <div>
                      <dt>Published</dt>
                      <dd>{campaign.revisionId.slice(0, 8)}</dd>
                    </div>
                    <div>
                      <dt>Draft</dt>
                      <dd>
                        {campaign.draftVersion
                          ? `v${campaign.draftVersion}`
                          : "None"}
                      </dd>
                    </div>
                  </dl>
                  <div className="campaign-admin-actions"><button
                    className="admin-primary"
                    disabled={busy || (session.user.role === "viewer" && !campaign.draftRevisionId)}
                    onClick={() =>
                      void openDraft(campaign.id, campaign.draftRevisionId)
                    }
                  >
                    {campaign.draftRevisionId ? (session.user.role === "viewer" ? "View draft" : "Edit draft") : (session.user.role === "viewer" ? "No draft" : "Create draft")}
                  </button><button disabled={busy} onClick={()=>void openHistory(campaign.id)}>History</button></div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function HistoryPanel({history,canRestore,busy,onBack,onRestore}:{history:AdminCampaignHistoryResponseV1;canRestore:boolean;busy:boolean;onBack:()=>void;onRestore:(id:string)=>void}) {
  const hasDraft=history.revisions.some((revision)=>revision.status==="draft");
  return <section className="history-panel"><button onClick={onBack}>← Campaigns</button><div className="admin-title"><div><small>REVISION HISTORY</small><h1>{history.campaignId}</h1><p>Published revisions are immutable. Restore copies one into a new editable draft.</p></div></div><div className="history-grid"><section><h2>Versions</h2>{history.revisions.map((revision)=><article key={revision.id}><div><strong>Version {revision.version}</strong><span>{revision.current?"Current published":revision.status}</span>{revision.publishedAt&&<small>{new Date(revision.publishedAt).toLocaleString()}</small>}</div>{canRestore&&revision.status==="published"&&!revision.current&&<button disabled={busy||hasDraft} onClick={()=>onRestore(revision.id)}>Restore as draft</button>}</article>)}</section><section><h2>Activity</h2>{history.events.map((event)=><article key={event.id}><div><strong>{event.action.replaceAll("."," ")}</strong><span>{event.displayName}</span><small>{new Date(event.createdAt).toLocaleString()}</small></div></article>)}</section></div>{hasDraft&&<p className="history-note">Finish or publish the current draft before restoring an older revision.</p>}</section>;
}

function TeamPanel({members,canEdit,busy,onCreate,onUpdate}:{members:readonly AdminTeamMember[];canEdit:boolean;busy:boolean;onCreate:(input:{email:string;displayName:string;password:string;role:"admin"|"viewer"})=>void;onUpdate:(id:string,input:{role?:"admin"|"viewer";disabled?:boolean;password?:string})=>void}) {
  const [email,setEmail]=useState(""),[displayName,setDisplayName]=useState(""),[password,setPassword]=useState(""),[role,setRole]=useState<"admin"|"viewer">("viewer");
  const submit=(event:FormEvent)=>{event.preventDefault();onCreate({email,displayName,password,role});setEmail("");setDisplayName("");setPassword("");};
  return <section className="team-panel"><div className="admin-title"><div><small>ACCESS</small><h1>Team</h1><p>Admins can edit and publish. Viewers can inspect drafts and previews.</p></div><span>{members.length} members</span></div>{canEdit&&<form className="team-create" onSubmit={submit}><label>Name<input required value={displayName} onChange={(event)=>setDisplayName(event.target.value)}/></label><label>Email<input required type="email" value={email} onChange={(event)=>setEmail(event.target.value)}/></label><label>Temporary password<input required type="password" minLength={12} value={password} onChange={(event)=>setPassword(event.target.value)}/></label><label>Role<select value={role} onChange={(event)=>setRole(event.target.value as "admin"|"viewer")}><option value="viewer">Viewer</option><option value="admin">Admin</option></select></label><button className="admin-primary" disabled={busy}>Add member</button></form>}<div className="team-list">{members.map((member)=><article key={member.id} className={member.disabled?"is-disabled":""}><div><strong>{member.displayName}</strong><span>{member.email}</span><small>{member.disabled?"Disabled":member.role}</small></div>{canEdit&&<div className="team-actions"><select aria-label={`Role for ${member.displayName}`} value={member.role} disabled={busy||member.disabled} onChange={(event)=>onUpdate(member.id,{role:event.target.value as "admin"|"viewer"})}><option value="admin">Admin</option><option value="viewer">Viewer</option></select><button disabled={busy} onClick={()=>{const next=window.prompt(`New password for ${member.email} (12+ characters):`);if(next)onUpdate(member.id,{password:next});}}>Reset password</button><button className="danger-button" disabled={busy} onClick={()=>onUpdate(member.id,{disabled:!member.disabled})}>{member.disabled?"Reactivate":"Disable"}</button></div>}</article>)}</div></section>;
}

function Brand() {
  return (
    <div className="admin-brand">
      <span>K</span>
      <strong>
        Koder<em>garden</em>
      </strong>
    </div>
  );
}
function DraftEditor({
  draft,
  busy,
  preview,
  previewLocale,
  onBack,
  onSave,
  onPublish,
  onPreview,
  onValidate,
  validation,
  setCampaignCopy,
  setChallenge,
  updateChallenge,
  moveChallenge,
  duplicateChallenge,
  removeChallenge,
}: {
  draft: AdminDraft;
  busy: boolean;
  preview: CatalogCampaignDefinition | null;
  previewLocale: "en" | "es";
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onPreview: (locale: "en" | "es") => void;
  onValidate: () => void;
  validation: AdminValidationResponseV1 | null;
  setCampaignCopy: (
    locale: "en" | "es",
    field: "title" | "description",
    value: string,
  ) => void;
  setChallenge: (
    slug: string,
    locale: "en" | "es",
    field: "title" | "instruction" | "concept",
    value: string,
  ) => void;
  updateChallenge: (slug:string,change:Partial<AdminDraft["challenges"][number]>)=>void;
  moveChallenge: (slug:string,direction:-1|1)=>void;
  duplicateChallenge: (slug:string)=>void;
  removeChallenge: (slug:string)=>void;
}) {
  return (
    <div className="draft-editor">
      <div className="draft-toolbar">
        <button onClick={onBack}>← Campaigns</button>
        <div>
          <small>DRAFT VERSION {draft.version}</small>
          <h1>{draft.campaignId}</h1>
        </div>
        <div className="draft-actions">
          <button disabled={busy} onClick={() => onPreview("en")}>
            Preview EN
          </button>
          <button disabled={busy} onClick={() => onPreview("es")}>
            Preview ES
          </button>
          <button disabled={busy} onClick={onValidate}>Validate</button>
          <button className="admin-primary" disabled={busy} onClick={onSave}>
            Save draft
          </button>
          <button className="admin-publish" disabled={busy} onClick={onPublish}>
            Publish
          </button>
        </div>
      </div>
      {validation && <section className={`draft-validation ${validation.valid ? "is-valid" : ""}`}><strong>{validation.valid ? "✓ Ready to publish" : "Validation issues"}</strong>{!validation.valid && <ul>{validation.issues.map((issue, index) => <li key={`${issue.challengeSlug}-${issue.code}-${index}`}><b>{issue.challengeSlug ?? "Campaign"}</b> — {issue.message}</li>)}</ul>}</section>}
      {preview && (
        <section className="draft-preview">
          <div>
            <small>PRIVATE PREVIEW · {previewLocale.toUpperCase()}</small>
            <h2>{preview.titleKey}</h2>
            <p>{preview.descriptionKey}</p>
          </div>
          <ol>
            {preview.challenges.map((item) => (
              <li key={item.id}>
                <strong>{item.titleKey}</strong>
                <span>{item.instructionKey}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="draft-section">
        <h2>Campaign copy</h2>
        <div className="draft-languages">
          {(["en", "es"] as const).map((locale) => (
            <fieldset key={locale}>
              <legend>{locale === "en" ? "English" : "Spanish"}</legend>
              <label>
                Title
                <input
                  value={draft.translations[locale].title}
                  onChange={(event) =>
                    setCampaignCopy(locale, "title", event.target.value)
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={draft.translations[locale].description}
                  onChange={(event) =>
                    setCampaignCopy(locale, "description", event.target.value)
                  }
                />
              </label>
            </fieldset>
          ))}
        </div>
      </section>
      <section className="draft-section">
        <div className="draft-section-heading"><div><h2>Challenges</h2><p>Reorder, configure, duplicate, or remove challenges in this draft.</p></div></div>
        <div className="draft-challenges">
          {draft.challenges.map((challenge) => (
            <details key={challenge.slug}>
              <summary>
                <span>{challenge.order}</span>
                <strong>{challenge.translations.en.title}</strong>
                <small>{challenge.slug}</small>
              </summary>
              <div className="draft-languages">
                <div className="challenge-structure-controls">
                  <div className="challenge-order-actions"><button disabled={busy||challenge.order===1} onClick={()=>moveChallenge(challenge.slug,-1)}>↑ Move up</button><button disabled={busy||challenge.order===draft.challenges.length} onClick={()=>moveChallenge(challenge.slug,1)}>↓ Move down</button><button onClick={()=>duplicateChallenge(challenge.slug)} disabled={busy}>Duplicate</button><button className="danger-button" onClick={()=>removeChallenge(challenge.slug)} disabled={busy||draft.challenges.length===1}>Remove</button></div>
                  <fieldset><legend>Allowed blocks</legend><div className="tool-checkboxes">{(["moveForward","turn","repeat","ifPathAhead","ifElsePathAhead"] as const).map(tool=><label key={tool}><input type="checkbox" checked={challenge.allowed.includes(tool)} onChange={event=>updateChallenge(challenge.slug,{allowed:event.target.checked?[...challenge.allowed,tool]:challenge.allowed.filter(value=>value!==tool)})}/>{tool}</label>)}</div></fieldset>
                  <div className="limit-fields">{(["maxBlocks","parBlocks","parSteps"] as const).map(field=><label key={field}>{field}<input type="number" min="1" value={challenge[field]??""} placeholder="None" onChange={event=>updateChallenge(challenge.slug,{[field]:event.target.value===""?null:Number(event.target.value)})}/></label>)}</div>
                </div>
                <ChallengeMechanicsEditor challenge={challenge} onUpdate={(change) => updateChallenge(challenge.slug, change)}/>
                {(["en", "es"] as const).map((locale) => (
                  <fieldset key={locale}>
                    <legend>{locale === "en" ? "English" : "Spanish"}</legend>
                    <label>
                      Title
                      <input
                        value={challenge.translations[locale].title}
                        onChange={(event) =>
                          setChallenge(
                            challenge.slug,
                            locale,
                            "title",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      Concept
                      <input
                        value={challenge.translations[locale].concept}
                        onChange={(event) =>
                          setChallenge(
                            challenge.slug,
                            locale,
                            "concept",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      Instruction
                      <textarea
                        rows={4}
                        value={challenge.translations[locale].instruction}
                        onChange={(event) =>
                          setChallenge(
                            challenge.slug,
                            locale,
                            "instruction",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </fieldset>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
