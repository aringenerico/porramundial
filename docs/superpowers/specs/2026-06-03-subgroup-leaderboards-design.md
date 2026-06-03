# Subgroup Leaderboards — Design Spec
# porramundial

**Date:** 2026-06-03
**Status:** Approved

---

## Overview

Add admin-managed subgroups (e.g. "Bilbao", "Backend Team") on top of the existing global leaderboard. Each user can belong to zero, one, or many groups. The general leaderboard stays untouched and visible to everyone. Subgroup leaderboards are visible only to their members, who pick them via chips in the ranking page.

## Goals

- Admin can create, delete, and assign users to groups from the admin panel.
- Users see only the groups they belong to.
- A user with no group assignments sees the app exactly as today.
- Membership is many-to-many (a user can be in several groups).

## Non-goals

- Combining the group filter with the existing `matchday`/`phase` filters.
- Per-group prize pool (the bote stays global).
- Per-group statistics beyond the leaderboard (no group top scorer, etc.).
- Notifications when membership changes.
- Real-time reactive UI when admin changes membership (next reload picks it up).

---

## Data model

### Table: `groups`

```sql
CREATE TABLE groups (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
```

### Table: `group_members`

```sql
CREATE TABLE group_members (
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  user_id  UUID   REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
```

### RLS policies

Follow the existing `admins` table pattern already used across porramundial.

**`groups`:**

```sql
-- Members can read groups they belong to
CREATE POLICY "groups_select_member" ON groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = groups.id AND user_id = auth.uid()
  ));

-- Admins can read every group
CREATE POLICY "groups_select_admin" ON groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Admins can create/update/delete groups
CREATE POLICY "groups_insert_admin" ON groups FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "groups_update_admin" ON groups FOR UPDATE
  USING       (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK  (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "groups_delete_admin" ON groups FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
```

**`group_members`:**

```sql
-- Members can read membership rows of groups they belong to
CREATE POLICY "gm_select_member" ON group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
  ));

-- Admins can read all membership rows
CREATE POLICY "gm_select_admin" ON group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Admins manage membership
CREATE POLICY "gm_insert_admin" ON group_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "gm_delete_admin" ON group_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
```

Non-admin users cannot insert or delete in either table.

### Migration file

`supabase/migrations/phase6_groups.sql` — all of the above, ready to paste in the SQL editor.

---

## Frontend

### Data loading

After `user` is known in `App()`, load membership:

```js
const [myGroups,         setMyGroups]         = useState([]); // [{id, name}]
const [groupMembersById, setGroupMembersById] = useState({}); // { group_id: Set<user_id> }

const loadGroups = useCallback(async () => {
  if (!user) { setMyGroups([]); setGroupMembersById({}); return; }
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, user_id, groups(id, name)');
  if (error || !data) return;
  // RLS already filtered to groups I belong to
  const grpMap = new Map();
  const memMap = {};
  data.forEach(row => {
    if (row.groups) grpMap.set(row.groups.id, row.groups);
    if (!memMap[row.group_id]) memMap[row.group_id] = new Set();
    memMap[row.group_id].add(row.user_id);
  });
  setMyGroups([...grpMap.values()].sort((a,b) => a.name.localeCompare(b.name)));
  setGroupMembersById(memMap);
}, [user]);

useEffect(() => { loadGroups(); }, [loadGroups]);
```

The two pieces of state are passed down to `LeaderboardPage`.

### LeaderboardPage — filter state extension

The existing filter state is a tagged union:

```js
filter = { mode: 'general' }
       | { mode: 'matchday', md: number }
       | { mode: 'phase',    phase: string }
```

Add a new variant:

```js
       | { mode: 'group',    groupId: number, groupName: string }
```

Group mode is **mutually exclusive** with the others, same as today.

### Filter chips — render

In `LeaderboardFilters` (or inline in `LeaderboardPage`), render group chips between the `General` chip and the `Por fase` dropdown:

```
[ General ]  [ 🏢 Bilbao ]  [ 💻 Backend Team ]  ...  [ Por fase ▾ ]
```

Each group chip:

```jsx
<button
  className={`chip ${filter.mode==='group' && filter.groupId===g.id ? 'on' : ''}`}
  onClick={() => setFilter({ mode:'group', groupId: g.id, groupName: g.name })}>
  🏢 {g.name}
</button>
```

If `myGroups.length === 0`, no group chips render → the UI is identical to today.

### LeaderboardPage — applying the filter

When `filter.mode === 'group'`, derive the leaderboard client-side from the full `leaderboardProp`:

```js
let leaderboard;
if (filter.mode === 'group') {
  const memberIds = groupMembersById[filter.groupId] || new Set();
  leaderboard = leaderboardProp.filter(r => memberIds.has(r.user_id));
} else if (filteredData) {
  leaderboard = filteredData; // matchday / phase
} else {
  leaderboard = leaderboardProp;
}
```

Group mode does NOT call `leaderboard_filtered` RPC — it filters the already-loaded general rows. The podium reuses the existing 1/2/3-row layout (already handles small groups).

### Prize pool banner

Prize pool, prize distribution, and `awardWinners` calculation remain global. The banner stays as-is even when a group filter is active.

### User detail modal

The modal added in 2026-06-03 (click on a participant to see their predictions + breakdown) keeps working identically. It always shows the user's global predictions and breakdown, not a group-scoped view.

---

## Admin panel

New section in `AdminPage`, placed after the matches result section.

### Layout

```
┌──────────────────────────────────────────────┐
│ 🏢 Grupos                                    │
├──────────────────────────────────────────────┤
│ [ Nombre nuevo grupo            ] [ + Crear ]│
├──────────────────────────────────────────────┤
│ ▾ Bilbao                · 5 miembros    🗑   │
│   ├─ Gorka Barroso                       ✕   │
│   ├─ Diego López                         ✕   │
│   └─ …                                       │
│   [ Selecciona usuario ▾ ] [ + Añadir ]      │
├──────────────────────────────────────────────┤
│ ▸ Backend Team          · 3 miembros    🗑   │
└──────────────────────────────────────────────┘
```

### State

```js
const [allGroups,    setAllGroups]    = useState([]);    // RLS-admin sees all
const [allMembers,   setAllMembers]   = useState({});    // { group_id: [{ user_id, display_name, email }] }
const [allUsers,     setAllUsers]     = useState([]);    // profiles list
const [newGroupName, setNewGroupName] = useState('');
const [expanded,     setExpanded]     = useState({});    // { group_id: bool }
const [addPick,      setAddPick]      = useState({});    // { group_id: user_id }
```

### Loaders

```js
async function loadAllGroups() {
  const { data } = await supabase.from('groups').select('*').order('name');
  setAllGroups(data || []);
}
async function loadAllMembers() {
  const { data } = await supabase
    .from('group_members')
    .select('group_id, user_id, profiles(display_name, email)');
  const map = {};
  (data || []).forEach(r => {
    if (!map[r.group_id]) map[r.group_id] = [];
    map[r.group_id].push({
      user_id: r.user_id,
      display_name: r.profiles?.display_name || 'Anónimo',
      email: r.profiles?.email,
    });
  });
  setAllMembers(map);
}
async function loadAllUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .order('display_name');
  setAllUsers(data || []);
}
```

All three are called on mount and after each mutation.

### Mutations

```js
async function createGroup() {
  const name = newGroupName.trim();
  if (!name) return;
  const { error } = await supabase.from('groups').insert({ name });
  if (!error) { setNewGroupName(''); loadAllGroups(); }
}

async function deleteGroup(id) {
  if (!window.confirm('¿Borrar este grupo? Se eliminarán todas las pertenencias.')) return;
  await supabase.from('groups').delete().eq('id', id);
  loadAllGroups(); loadAllMembers();
}

async function addMember(groupId) {
  const userId = addPick[groupId];
  if (!userId) return;
  await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
  setAddPick(p => ({ ...p, [groupId]: '' }));
  loadAllMembers();
}

async function removeMember(groupId, userId) {
  await supabase.from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', userId);
  loadAllMembers();
}
```

All four rely on RLS (admin policies) — no RPC needed.

### Profiles SELECT for admin

The admin needs to read every profile to populate the "add member" picker. Check the current `profiles` RLS first; if no admin-bypass SELECT policy exists, add one to `phase6_groups.sql`:

```sql
-- Run only if no equivalent policy is already in place
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
```

If `profiles` is already publicly readable or already has admin coverage, skip this statement.

### "Add member" picker

The picker for a given group shows users from `allUsers` who are NOT yet members of that group:

```js
const available = allUsers.filter(u =>
  !(allMembers[groupId] || []).some(m => m.user_id === u.id)
);
```

---

## Interaction details

- **Group mutually exclusive with matchday/phase filters.** Selecting a group resets `filteredData` to null and clears the phase chips visual state.
- **Admin removes me from a group while I am viewing it.** Next `loadGroups()` (triggered by tab navigation, refresh, or any data reload) drops the group from `myGroups`, the chip disappears, and the view falls back to General. No live invalidation needed.
- **Group with 0 or 1 members.** The leaderboard renders with the existing 1/2-player podium logic. No special case.
- **Awards bonus.** Each row in the filtered list keeps its own `awardBonus`; sorting inside the group works automatically.
- **Bote total / premios €.** Stay global, unchanged.

---

## Out of scope (explicit)

- Combining group filter with `matchday` or `phase` filter.
- Per-group prize pool.
- Group icons or colors beyond the name.
- Per-group stats (top scorer, most exacts, etc.).
- Notifications on membership changes.
- Self-service join/leave by users.
