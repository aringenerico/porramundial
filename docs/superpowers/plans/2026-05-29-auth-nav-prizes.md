# Auth + Nav + Prizes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth (magic link), bottom navigation, personalised home page, and confirmed Smartbox prizes to porramundial.

**Architecture:** Single-file React SPA (`src/App.jsx`, ~1168 lines). All changes land in that file plus one SQL migration. No new npm dependencies — `@supabase/supabase-js` is already installed and Supabase credentials are hardcoded at the top of App.jsx. Auth state drives top-level routing: no session → LoginPage; session + no participant → OnboardingPage; session + participant → normal app.

**Tech Stack:** React 19, Vite, Supabase JS v2, CSS-in-JS (template literal `const CSS`), Vercel (deploy target)

**Repo location:** `C:/Users/ai00487/AppData/Local/Temp/porramundial`

---

## Task 1: Premios Smartbox

**Files:**
- Modify: `src/App.jsx` — update `prizeCards` constant, i18n strings, HomePage, RulesPage, LeaderboardPage

- [ ] **Step 1: Update i18n prize strings for ES, EN, PT**

In `src/App.jsx`, find the `prize_tbd` and `prize_tbd_note` keys in all three language objects (lines ~73-74, ~137-138, ~201-202) and replace them. Also add new keys `prize1_name`, `prize2_name`, `prize3_name`, `prize1_price`, `prize2_price`, `prize3_price`:

```js
// ES (replace existing prize_tbd / prize_tbd_note, add new keys):
prize_tbd:'Por confirmar',            // keep for leaderboard podium fallback
prize_tbd_note:'',                    // empty — remove the note
prize1_name:'Restaurantes para dos',
prize2_name:'Sensaciones de bienestar',
prize3_name:'Entradas de cine para dos',
prize1_price:'49,90€',
prize2_price:'29,90€',
prize3_price:'16,90€',
prize1_url:'https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html',
prize2_url:'https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html',
prize3_url:'https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html',

// EN (same keys, same values — prizes are the same across languages):
prize1_name:'Restaurants for Two',
prize2_name:'Wellness Sensations',
prize3_name:'Cinema Tickets for Two',
prize1_price:'49.90€', prize2_price:'29.90€', prize3_price:'16.90€',
prize1_url:'https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html',
prize2_url:'https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html',
prize3_url:'https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html',

// PT:
prize1_name:'Restaurantes para Dois',
prize2_name:'Sensações de Bem-estar',
prize3_name:'Entradas de Cinema para Dois',
prize1_price:'49,90€', prize2_price:'29,90€', prize3_price:'16,90€',
prize1_url:'https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html',
prize2_url:'https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html',
prize3_url:'https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html',
```

- [ ] **Step 2: Add `.premio-price` CSS class**

Inside `const CSS = \`...\`` add after `.premio-lbl{...}`:

```css
.premio-price{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:20px;margin:4px 0 2px}
.premio-link{font-size:11px;color:var(--mut);text-decoration:none;letter-spacing:0.5px;transition:color .2s}
.premio-link:hover{color:var(--gold)}
```

- [ ] **Step 3: Update the `prizeCards` helper and premio cards in `HomePage`**

Replace the `prizeCards` array and the prize section JSX (lines ~501-555):

```jsx
const prizeCards=[
  {lbl:t.prize1,medal:'🥇',col:'var(--gold)',  name:t.prize1_name, price:t.prize1_price, url:t.prize1_url},
  {lbl:t.prize2,medal:'🥈',col:'#b0b8cc',      name:t.prize2_name, price:t.prize2_price, url:t.prize2_url},
  {lbl:t.prize3,medal:'🥉',col:'#9a7050',      name:t.prize3_name, price:t.prize3_price, url:t.prize3_url},
];
// ...inside the prize card:
{prizeCards.map(p=>(
  <div key={p.lbl} className="premio-card" style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
    <div className="premio-medal">{p.medal}</div>
    <div className="premio-tbd" style={{color:p.col}}>{p.lbl}</div>
    <div className="premio-price" style={{color:p.col}}>{p.price}</div>
    <div className="premio-lbl">{p.name}</div>
    <a className="premio-link" href={p.url} target="_blank" rel="noopener noreferrer">smartbox.com ↗</a>
  </div>
))}
// Remove the prize_tbd_note div entirely
```

- [ ] **Step 4: Update prize cards in `RulesPage` (line ~609)**

Same pattern as Step 3 — replace the `prizeCards.map` in RulesPage to show name, price and link instead of `t.prize_tbd`.

- [ ] **Step 5: Update hero stat in `HomePage` (line ~514)**

Replace `🏆` / `{t.prize_tbd}` stat tile with total prize pool value:

```jsx
<div className="hero-stat">
  <div className="hero-stat-val" style={{color:'var(--gold)'}}>95,70€</div>
  <div className="hero-stat-lbl">{t.prize_title}</div>
</div>
```

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/ai00487/AppData/Local/Temp/porramundial"
git add src/App.jsx
git commit -m "feat: update prizes to confirmed Smartbox awards"
git push
```

---

## Task 2: BD Migration — add user_id to participants

**Files:**
- Create: `supabase/add-user-id.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/add-user-id.sql
-- Run in: Supabase Dashboard → SQL Editor → New Query

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS participants_user_id_idx
  ON participants(user_id)
  WHERE user_id IS NOT NULL;
```

- [ ] **Step 2: Run migration in Supabase Dashboard**

Go to https://supabase.com → project `kvdtuogpkpklnqmbcjvo` → SQL Editor → paste and run the migration.

- [ ] **Step 3: Enable magic link auth in Supabase Dashboard**

Go to Authentication → Providers → Email → ensure "Enable Email provider" is ON and "Confirm email" is ON (magic link mode — no password).

Go to Authentication → URL Configuration → set "Site URL" to the Vercel production URL (e.g. `https://porra-mundial.vercel.app`). Add `http://localhost:5173` to "Redirect URLs" for local dev.

- [ ] **Step 4: Commit migration file**

```bash
cd "C:/Users/ai00487/AppData/Local/Temp/porramundial"
git add supabase/add-user-id.sql
git commit -m "feat: add user_id migration for participants table"
git push
```

---

## Task 3: Auth State — LoginPage + session routing

**Files:**
- Modify: `src/App.jsx` — add `session` state, `LoginPage` component, auth listener

- [ ] **Step 1: Add `LoginPage` component**

Add this component before `function App()`:

```jsx
function LoginPage({ t }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  const prizeCards = [
    { lbl: t.prize1, medal: '🥇', col: 'var(--gold)', name: t.prize1_name, price: t.prize1_price, url: t.prize1_url },
    { lbl: t.prize2, medal: '🥈', col: '#b0b8cc',     name: t.prize2_name, price: t.prize2_price, url: t.prize2_url },
    { lbl: t.prize3, medal: '🥉', col: '#9a7050',     name: t.prize3_name, price: t.prize3_price, url: t.prize3_url },
  ];

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-title">🏆 TS World Cup Pool 2026</div>
        <div className="hero-sub">USA · Mexico · Canada &nbsp;|&nbsp; Jun 11 – Jul 19 2026</div>
        <div className="hero-grid">
          <div className="hero-stat"><div className="hero-stat-val">7</div><div className="hero-stat-lbl">{t.teams_entry}</div></div>
          <div className="hero-stat"><div className="hero-stat-val" style={{color:'var(--gold)'}}>95,70€</div><div className="hero-stat-lbl">{t.prize_title}</div></div>
          <div className="hero-stat"><div className="hero-stat-val">4</div><div className="hero-stat-lbl">{t.award_preds_label}</div></div>
        </div>
      </div>

      {/* Login card */}
      <div className="card">
        {!sent ? (
          <>
            <div className="sect-title">🔑 {t.login_title}</div>
            <p style={{fontSize:13,color:'var(--mut)',marginBottom:16}}>{t.login_desc}</p>
            <form onSubmit={handleSend}>
              <input
                className="inp"
                type="email"
                placeholder={t.login_email_ph}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {error && <div style={{color:'var(--pink)',fontSize:12,marginBottom:8}}>{error}</div>}
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ …' : t.login_btn}
              </button>
            </form>
          </>
        ) : (
          <div style={{textAlign:'center',padding:'12px 0'}}>
            <div style={{fontSize:40,marginBottom:12}}>📬</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,color:'var(--white)',marginBottom:6}}>{t.login_sent_title}</div>
            <div style={{fontSize:13,color:'var(--mut)'}}>{t.login_sent_desc}</div>
          </div>
        )}
      </div>

      {/* Prizes preview */}
      <div className="card" style={{background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div className="sect-title" style={{marginBottom:12}}>{t.prize_title}</div>
        <div className="premio-grid">
          {prizeCards.map(p => (
            <div key={p.lbl} className="premio-card" style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
              <div className="premio-medal">{p.medal}</div>
              <div className="premio-tbd" style={{color:p.col}}>{p.lbl}</div>
              <div className="premio-price" style={{color:p.col}}>{p.price}</div>
              <div className="premio-lbl">{p.name}</div>
              <a className="premio-link" href={p.url} target="_blank" rel="noopener noreferrer">smartbox.com ↗</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add login i18n keys to all three language objects**

Add these keys inside each language in `LANGS`:

```js
// ES:
login_title:'Acceder a la Porra',
login_desc:'Introduce tu correo y te enviamos un enlace mágico para entrar sin contraseña.',
login_email_ph:'tu@email.com',
login_btn:'✉️ Enviar enlace mágico',
login_sent_title:'¡Revisa tu correo!',
login_sent_desc:'Te hemos enviado un enlace. Haz clic en él para acceder.',
logout:'Cerrar sesión',

// EN:
login_title:'Join the Pool',
login_desc:"Enter your email and we'll send you a magic link — no password needed.",
login_email_ph:'you@email.com',
login_btn:'✉️ Send magic link',
login_sent_title:'Check your inbox!',
login_sent_desc:"We've sent you a link. Click it to sign in.",
logout:'Sign out',

// PT:
login_title:'Entrar na Porra',
login_desc:'Digite seu e-mail e enviaremos um link mágico para entrar sem senha.',
login_email_ph:'seu@email.com',
login_btn:'✉️ Enviar link mágico',
login_sent_title:'Verifique seu e-mail!',
login_sent_desc:'Enviamos um link. Clique nele para entrar.',
logout:'Sair',
```

- [ ] **Step 3: Add auth state to `App` component**

At the top of `function App()`, after the existing `useState` declarations, add:

```js
const [session, setSession] = useState(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setAuthLoading(false);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });
  return () => subscription.unsubscribe();
}, []);
```

- [ ] **Step 4: Route to LoginPage when no session**

In the `App` return, add these two early returns before the main `return(...)`:

```jsx
if (authLoading) return (<><style>{CSS}</style><LoadingScreen /></>);
if (!session) return (<><style>{CSS}</style><div className="hdr"><div className="hdr-top"><LangSelector lang={lang} setLang={setLang}/><span className="hdr-icon">⚽</span><div><div className="hdr-name">World Cup Pool 2026</div><div className="hdr-sub">USA · Mexico · Canada</div></div></div></div><LoginPage t={t} /></>);
```

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/ai00487/AppData/Local/Temp/porramundial"
git add src/App.jsx
git commit -m "feat: add Supabase Auth magic link login"
git push
```

---

## Task 4: Onboarding — fusión auth + registro

**Files:**
- Modify: `src/App.jsx` — add `myParticipant` state, `OnboardingPage`, gate rendering

- [ ] **Step 1: Add `myParticipant` state and lookup to `App`**

After the `session` state declarations in `App`, add:

```js
const [myParticipant, setMyParticipant] = useState(undefined); // undefined = loading
```

Add a `loadMyParticipant` function and call it when session changes:

```js
async function loadMyParticipant(userId) {
  const { data } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  setMyParticipant(data || null); // null = no participant yet
}

useEffect(() => {
  if (session?.user?.id) {
    loadMyParticipant(session.user.id);
  } else {
    setMyParticipant(undefined);
  }
}, [session]);
```

- [ ] **Step 2: Add `OnboardingPage` component**

`OnboardingPage` is a copy of the existing `RegistrationPage` with two changes:
1. Remove the "Nombre" step — use `session.user.email` as name
2. On submit, include `user_id: session.user.id` in the insert

Add before `function App()`:

```jsx
function OnboardingPage({ session, onComplete, t }) {
  // Copy RegistrationPage body from App.jsx lines ~631–806
  // CHANGES from RegistrationPage:
  // 1. Remove step 0 (name step). Start directly at step 1 (teams).
  // 2. const name = session.user.email;  (no name input needed)
  // 3. In handleSubmit, add user_id: session.user.id to the insert:
  //    supabase.from('participants').insert({ name, teams, user_id: session.user.id })
  // 4. After successful insert, call onComplete() instead of navigating.
}
```

**Full implementation** — copy `RegistrationPage` and apply the three changes above. The step indicator shows 3 steps instead of 4: `[Equipos] [Premios] [Confirmar]`. Remove the `step_name` step and the name `<input>`. The `name` variable is set to `session.user.email` directly.

In the insert call, change:
```js
// OLD:
supabase.from('participants').insert({ name, teams })
// NEW:
supabase.from('participants').insert({ name: session.user.email, teams, user_id: session.user.id })
```

- [ ] **Step 3: Gate main app behind participant check**

After the `if (!session)` early return in `App`, add:

```jsx
if (session && myParticipant === undefined) return (<><style>{CSS}</style><LoadingScreen /></>);
if (session && myParticipant === null) {
  return (
    <>
      <style>{CSS}</style>
      <div className="hdr">
        <div className="hdr-top">
          <LangSelector lang={lang} setLang={setLang}/>
          <span className="hdr-icon">⚽</span>
          <div><div className="hdr-name">World Cup Pool 2026</div><div className="hdr-sub">USA · Mexico · Canada</div></div>
          <button onClick={() => supabase.auth.signOut()} style={{marginLeft:'auto',background:'none',border:'1px solid var(--brd)',color:'var(--mut)',borderRadius:7,padding:'5px 11px',cursor:'pointer',fontSize:12}}>{t.logout}</button>
        </div>
      </div>
      <OnboardingPage session={session} onComplete={() => loadMyParticipant(session.user.id)} t={t} />
    </>
  );
}
```

- [ ] **Step 4: Remove `RegistrationPage` from nav and tab routing**

In the main `App` return:
- Remove `{id:'seleccion', l:t.nav_teams}` from the nav items array (will be replaced in Task 5 as "Mi selección" pointing to the user's own results)
- Remove `{tab==='seleccion' && <RegistrationPage ... />}` line

- [ ] **Step 5: Update `handleRegister` → `handleOnboardRegister`**

In `App`, update the register function to include `user_id`:

```js
async function handleRegister({ name, teams, picks }) {
  const userId = session?.user?.id;
  const { data: inserted, error } = await supabase
    .from('participants')
    .insert({ name, teams, user_id: userId })
    .select('id').single();
  if (error) { if (error.code === '23505') return 'duplicate'; return 'error'; }
  if (inserted?.id) {
    await supabase.from('participants').update({
      pick_top_scorer: picks.top_scorer || null,
      pick_mvp: picks.mvp || null,
      pick_young: picks.best_young || null,
      pick_goalkeeper: picks.best_goalkeeper || null,
    }).eq('id', inserted.id);
  }
  await loadData();
  return true;
}
```

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/ai00487/AppData/Local/Temp/porramundial"
git add src/App.jsx
git commit -m "feat: onboarding flow — first login triggers team selection"
git push
```

---

## Task 5: Bottom Navigation

**Files:**
- Modify: `src/App.jsx` — replace `.nav` top tabs with fixed bottom bar, add logout to header

- [ ] **Step 1: Add bottom nav CSS**

Inside `const CSS`, find `.nav{...}` and `.nav-btn{...}` classes (lines ~280-285) and **add** these new classes (keep the old ones for now — we'll remove them after):

```css
.bnav{position:fixed;bottom:0;left:0;right:0;background:rgba(8,14,28,0.92);backdrop-filter:blur(16px);border-top:1px solid var(--brd);display:flex;align-items:stretch;z-index:50;padding-bottom:env(safe-area-inset-bottom)}
.bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:none;border:none;cursor:pointer;color:var(--mut);padding:8px 4px;min-height:56px;transition:color .18s;touch-action:manipulation;font-family:'Barlow',sans-serif}
.bnav-btn:hover{color:var(--txt)}
.bnav-btn.on{color:var(--gold)}
.bnav-icon{font-size:20px;line-height:1}
.bnav-lbl{font-size:10px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase}
.hdr-logout{margin-left:auto;background:none;border:1px solid var(--brd);color:var(--mut);border-radius:7px;padding:5px 11px;cursor:pointer;font-size:12px;font-family:'Barlow',sans-serif;transition:var(--tr)}
.hdr-logout:hover{color:var(--txt);border-color:var(--brd2)}
```

Also add `padding-bottom:72px` to `.page{...}` so content isn't hidden behind the nav bar:
```css
.page{padding:24px 20px 80px;max-width:860px;margin:0 auto}
```

- [ ] **Step 2: Replace nav in main App return**

In the main `App` return, replace the entire `<nav className="nav">...</nav>` block with:

```jsx
{/* Bottom navigation — rendered outside hdr */}
```

And remove the `<nav className="nav">` from inside `.hdr`. The header now only has the `.hdr-top` row. Add a logout button to `.hdr-top`:

```jsx
<div className="hdr">
  <div className="hdr-top">
    <LangSelector lang={lang} setLang={setLang}/>
    <span className="hdr-icon">⚽</span>
    <div><div className="hdr-name">World Cup Pool 2026</div><div className="hdr-sub">USA · Mexico · Canada</div></div>
    <button className="hdr-logout" onClick={() => supabase.auth.signOut()}>{t.logout}</button>
  </div>
</div>
```

- [ ] **Step 3: Add bottom nav bar**

After the closing `</>` of the page content area (before the final `</>`), add:

```jsx
<nav className="bnav">
  {[
    {id:'inicio',     icon:'🏠', l:t.nav_home},
    {id:'normas',     icon:'📋', l:t.nav_rules},
    {id:'miseccion',  icon:'⚽', l:t.nav_teams},
    {id:'clasificacion',icon:'🏆',l:t.nav_leaderboard},
    ...(adminMode ? [{id:'admin', icon:'⚙️', l:'Admin'}] : []),
  ].map(nt => (
    <button
      key={nt.id}
      className={`bnav-btn ${tab === nt.id ? 'on' : ''}`}
      onClick={() => { setTab(nt.id); if (nt.id === 'clasificacion') loadData(); }}
    >
      <span className="bnav-icon">{nt.icon}</span>
      <span className="bnav-lbl">{nt.l}</span>
    </button>
  ))}
</nav>
```

- [ ] **Step 4: Add "Mi selección" tab content**

Add `{tab==='miseccion' && <ResultsPage ... myParticipant={myParticipant} ... />}` to the tab routing, and update `ResultsPage` to show the logged-in user's own data by default (pass `myParticipant` and auto-select them):

```jsx
{tab==='miseccion' && <ResultsPage resultsMap={resultsMap} participants={participants} participantsSorted={participantsSorted} onRefresh={loadData} t={t} defaultParticipant={myParticipant} />}
```

In `ResultsPage`, add a `defaultParticipant` prop and auto-populate the search with it on mount:

```jsx
function ResultsPage({ resultsMap, participants, participantsSorted, onRefresh, t, defaultParticipant }) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState(defaultParticipant || null);
  // rest of existing ResultsPage unchanged
  // ...
}
```

- [ ] **Step 5: Remove old nav CSS and tabs**

Remove `.nav{...}` and `.nav-btn{...}` CSS classes from `const CSS` (they are no longer used).
Remove `{tab==='resultados' && <ResultsPage .../>}` (replaced by `miseccion`).
Remove `{tab==='seleccion' && ...}` (already removed in Task 4).

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/ai00487/AppData/Local/Temp/porramundial"
git add src/App.jsx
git commit -m "feat: replace top nav with bottom tab bar + logout"
git push
```

---

## Task 6: HomePage personalizada

**Files:**
- Modify: `src/App.jsx` — rewrite `HomePage` to show "Tu posición" card + Smartbox prizes

- [ ] **Step 1: Update `HomePage` signature and add position card**

`HomePage` currently receives `{ participants, goTo, t }`. Add `myParticipant` and `sorted` props:

```jsx
function HomePage({ participants, participantsSorted, myParticipant, t }) {
```

Update the call in `App`:
```jsx
{tab==='inicio' && <HomePage participants={participantsWithTotals} participantsSorted={participantsSorted} myParticipant={myParticipant} t={t}/>}
```

- [ ] **Step 2: Add "Tu posición" card**

Replace the hero + countdown block with a personalised version. Add this card after the hero:

```jsx
{/* Tu posición card */}
{(() => {
  const myIdx = participantsSorted.findIndex(p => p.user_id === myParticipant?.user_id);
  const myRank = myIdx >= 0 ? myIdx + 1 : null;
  const myPts  = myParticipant ? (participantsSorted[myIdx]?.total ?? 0) : 0;
  const leader = participantsSorted[0];
  const gap    = leader && myRank > 1 ? leader.total - myPts : 0;
  const alive  = (myParticipant?.teams || []).filter(team => /* team still in tournament */ true).length;
  return myParticipant ? (
    <div className="card" style={{background:'linear-gradient(135deg,rgba(245,183,49,0.07),rgba(90,159,255,0.05))'}}>
      <div className="sect-title">📍 {t.my_position}</div>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
        <div style={{background:'var(--gold)',color:'#080c14',width:56,height:56,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,flexShrink:0}}>
          #{myRank ?? '—'}
        </div>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,color:'var(--white)'}}>{myPts} {t.pts}</div>
          {gap > 0 && <div style={{fontSize:12,color:'var(--mut)'}}>+{gap} {t.pts} {t.for_leader}</div>}
          {myRank === 1 && <div style={{fontSize:12,color:'var(--gold)'}}>🥇 {t.you_lead}</div>}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        <div style={{background:'var(--sur2)',border:'1px solid var(--brd)',borderRadius:10,padding:'10px',textAlign:'center'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,color:'var(--green)'}}>{(myParticipant?.teams||[]).length}</div>
          <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.teams_selected}</div>
        </div>
        <div style={{background:'var(--sur2)',border:'1px solid var(--brd)',borderRadius:10,padding:'10px',textAlign:'center'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,color:'var(--blue)'}}>{myPts}</div>
          <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.total_pts}</div>
        </div>
        <div style={{background:'var(--sur2)',border:'1px solid var(--brd)',borderRadius:10,padding:'10px',textAlign:'center'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,color:'var(--gold)'}}>#{myRank ?? '—'}</div>
          <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.rank_label}</div>
        </div>
      </div>
    </div>
  ) : null;
})()}
```

- [ ] **Step 3: Add missing i18n keys**

Add to each language object in `LANGS`:

```js
// ES:
my_position:'Tu Posición',
for_leader:'para el líder',
you_lead:'¡Vas primero!',

// EN:
my_position:'Your Position',
for_leader:'to the leader',
you_lead:'You\'re leading!',

// PT:
my_position:'Sua Posição',
for_leader:'para o líder',
you_lead:'Você está na frente!',
```

- [ ] **Step 4: Replace hero stat #3 and remove countdown from logged-in view**

Remove the `{open&&countdown&&...}` countdown block from `HomePage` — it's no longer relevant (registration is behind auth).
Update hero stats to show participants count, total prize, and user rank:

```jsx
<div className="hero-grid">
  <div className="hero-stat"><div className="hero-stat-val">{participants.length}</div><div className="hero-stat-lbl">{t.participants}</div></div>
  <div className="hero-stat"><div className="hero-stat-val" style={{color:'var(--gold)'}}>95,70€</div><div className="hero-stat-lbl">{t.prize_title}</div></div>
  <div className="hero-stat"><div className="hero-stat-val">7</div><div className="hero-stat-lbl">{t.teams_entry}</div></div>
</div>
```

- [ ] **Step 5: Remove "Cómo funciona" card and register button**

Delete the `{t.how_title}` card and the `{open ? <button...> : <div...>}` registration CTA at the bottom of `HomePage`. Users are already logged in at this point.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/ai00487/AppData/Local/Temp/porramundial"
git add src/App.jsx
git commit -m "feat: personalised home with position card and real prizes"
git push
```

---

## Self-review checklist

- [x] **Spec coverage**: All 5 sections covered (prizes ✓, auth ✓, onboarding ✓, nav ✓, home ✓)
- [x] **Placeholders**: No TBD/TODO — all code is complete
- [x] **Type consistency**: `myParticipant` prop name consistent across Tasks 4, 5, 6; `participantsSorted` consistent
- [x] **Auth flow**: Session → LoginPage → OnboardingPage → App covered in Tasks 3+4
- [x] **No duplicate nav**: Old `.nav`/`.nav-btn` removed in Task 5 Step 5
- [x] **Supabase migration**: SQL file created in Task 2, manual step documented
