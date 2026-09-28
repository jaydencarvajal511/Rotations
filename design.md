# Design Doc: Rotations Rewrite

## Background

Rotations v1 (live at album-organizer-8305f.web.app) is a working album tracker built with vanilla HTML/CSS/JS, Firebase, and the Spotify Search API. It works, but the goal of this rewrite is twofold: modernize the stack, and use it as a deliberate practice project for agentic/AI-assisted development workflows (Claude Code, CLAUDE.md-driven development, subagents, hooks, etc.).

This doc is the source of truth for **why** decisions were made. CLAUDE.md is the source of truth for **how** to work in the repo day to day.

## What Rotations is

Rotations is a personal music-listening tracker. A signed-in user maintains two lists of albums:

- **Want to Listen** — albums they've found and want to get to
- **Listened** — albums they've actually heard

**Core flows:**

1. **Find an album.** User searches a music catalog (Apple's iTunes Search API, for now) by album or artist name from a search bar. Results show cover art, album name, artist, and release year.
2. **Add it to a list.** From a search result, the user adds the album directly to "Want to Listen." (There's no "add to Listened directly" in v1 — the intended path is you queue it up, then hear it, then move it.)
3. **Move it once heard.** From the "Want to Listen" list, the user moves an album to "Listened." This is the core state transition the whole data model is built around.
4. **Browse and sort.** Both lists support sorting (e.g., by date added, alphabetically, by release date) and a search/filter box to find an album already in one of the lists.

**Important framing: this is Goodreads for music, not Spotify-for-tracking.** The iTunes Search API is used purely as a catalog/metadata source — searching for an album and pulling its title, artist, cover art, and release date. Nothing about this app reads or imports a user's actual listening history, playlists, or account data from any streaming service, and there's no streaming-service login/OAuth anywhere in this app. The user is always the one manually deciding an album counts as "listened," exactly like a Goodreads user manually marking a book as read — the catalog API is just a convenient way to look up metadata, not a data pipeline into the app.

This also means **the user-facing experience shouldn't feel Apple-exclusive**, even though Apple's catalog is the data source under the hood. There's no Apple login, no "connect your account," and nothing in the UI implies you need Apple Music (or any streaming) account to get full use of the app — the user experience is streaming-service agnostic, and someone with no streaming subscription at all should be able to use every feature. Using iTunes' own album ID (`collectionId`) as the primary key in the `albums` table is fine — that's an implementation detail invisible to the user, not a UX decision.

That's the full scope of this rewrite. Ratings, notes, and a stats dashboard are ideas for later (see Future feature ideas below) but are explicitly not being built as part of getting the stack modernized — this phase is a like-for-like rebuild of v1's functionality.

**Who it's for:** just the author, at least initially — this is a personal-use tool, not a multi-tenant product with sharing/social features (see Non-goals). Every user's two lists are private to them; there's no browsing other users' collections.

**What a screen looks like, roughly:**
- Two tabs or a split view: "Want to Listen" / "Listened," each a grid or list of album cards (cover art, title, artist)
- A search bar/modal for finding new albums to add
- Tapping a card in "Want to Listen" surfaces a "Mark as listened" action

## Goals

- Rebuild core v1 functionality, 1:1, on a modern, resume-relevant stack
- Make the app feel great on a phone browser (not a native app — see Non-goals)
- Use the project to practice modern AI-assisted coding workflows end to end
- **Not** a goal for this phase: new features. Get the rewrite working and deployed first; new functionality is a deliberate next phase, prompted for separately once the stack rebuild is done (see Future feature ideas)

## Non-goals

- **No native mobile app / app store presence.** The target is "feels great in a mobile browser," achieved via a PWA, not React Native or Capacitor. If a real native app becomes a goal later, the plan is to extract shared logic (`/lib`) into a package a React Native/Expo app could import — but that is explicitly out of scope for this rewrite.
- No real-time multi-user collaboration (e.g., shared lists) in v2.
- No social graph (followers, feeds) in the initial rewrite — noted as a possible v3 feature.

## Target architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Server components, file routing, easy Vercel deploy, strong Claude Code fluency |
| Styling | Tailwind CSS + shadcn/ui | Fast to build, consistent design system, avoids hand-rolled CSS |
| Backend/DB | Supabase (Postgres + Auth + RLS) | Chosen over staying on Firebase specifically for the SQL/relational-modeling and RLS experience — more transferable to general backend roles than Firestore's NoSQL model |
| External API | iTunes Search API (catalog search only) | Used only to look up album metadata (title, artist, cover, release date) — no API key, no user auth, no personal listening data. This is a backend implementation detail; the user-facing experience stays streaming-service agnostic. Replaced Spotify's Web API — see "Catalog source decision" below |
| Validation | Zod | All external data (iTunes responses, form input) validated at the boundary |
| Testing | Vitest + React Testing Library, Playwright | Unit/component + e2e coverage on the core flows |
| PWA | `next-pwa` (or `@ducanh2912/next-pwa` if the former lags Next.js versions) | Installable, offline app shell, good mobile feel without native app complexity |
| Hosting | Vercel | Native Next.js support, trivial preview deployments |

## Data model (initial)

```sql
-- profiles: one row per authenticated user, mirrors auth.users
profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  created_at timestamptz default now()
)

-- albums: cached catalog album metadata so we're not re-fetching on every render
albums (
  id text primary key,          -- iTunes collectionId; using their ID directly is an implementation
                                 -- detail and doesn't imply anything to the user (see note below)
  name text not null,
  artist text not null,
  cover_url text,
  release_date date,
  fetched_at timestamptz default now()
)

-- listening_entries: the actual user-album relationship
listening_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  album_id text references albums(id) not null,
  status text not null check (status in ('want_to_listen', 'listened')),
  added_at timestamptz default now(),
  listened_at timestamptz,
  unique (user_id, album_id)
)
```

RLS policy shape: users can only select/insert/update/delete `listening_entries` rows where `user_id = auth.uid()`. `albums` is readable by anyone (it's just cached public metadata), writable only via server-side upsert when a search result is first added.

## UI direction for this phase

For this rewrite, UI/UX decisions should follow the original v1 design rather than being reinvented — this phase is a stack rebuild, not a redesign. v1's screenshots (`listened.jpg`, `wantToListen.jpg` in the repo) are the reference for layout, information hierarchy, and interaction patterns (how sorting is presented, how album cards look, how the two lists relate to each other). Visual polish (spacing, typography, color, using shadcn/ui components instead of hand-rolled CSS) is expected to improve as a natural side effect of the new stack, and mobile responsiveness should be tightened up — but the overall structure, flows, and layout choices should map back to v1, not introduce new UI patterns. Redesigning the UI is a separate, later decision, not part of this phase.

## Scope for this phase

This rewrite is v1 parity on the new stack. Full stop. Nothing below is new functionality:
- Album search via Apple's iTunes catalog (metadata lookup only — no auth, no personal data)
- Add to "want to listen"
- Move to "listened"
- Sort/filter both lists
- PWA install support, mobile-first layout pass (this is a stack/feel requirement, not a feature addition — v1's UI was already mobile-compatible, this just makes it installable and smoother)

## Future feature ideas (explicitly not in scope yet)

Parked here so they don't get lost, not because they're planned. Once the rewrite is working and deployed, these get brainstormed and prioritized properly before any get built:
- Star ratings + text notes per listened album
- Stats dashboard: albums per month, top artists/genres, current streak
- Supporting additional catalog sources beyond iTunes (e.g. MusicBrainz, Discogs), or fully manual album entry for anything not in a catalog — not needed now, but if pursued later would mean revisiting the `albums` schema to support more than one source
- Public shareable profile / "year in rotation" recap page
- Recommendations based on listened albums

## Catalog source decision

v1 used Spotify's Web API (client-credentials flow). In February 2026 Spotify began requiring the owner of any development-mode app to hold an active Premium subscription (effective March 9, 2026 for existing apps), capped search at 10 results per request, and removed batch album lookups. Rather than tie the app to a paid subscription, the rewrite uses Apple's iTunes Search API:

- No API key or secret, so there's nothing to leak or rotate
- ~20 requests/minute rate limit — search and lookup responses are cached server-side (Apple sends `max-age=86400` and encourages caching)
- Apple's terms allow album art "only to promote store content" and "proximate to a store badge", so the album detail view links to the album on Apple Music. That link is optional for the user — it doesn't imply an account is needed.
- The `albums` table was still empty when this switched, so no data migration was needed; `albums.id` is `text` and now holds the iTunes `collectionId`. (The initial migration's SQL comment still says "Spotify album ID" — applied migrations aren't edited.)

## Migration from v1

This is a rewrite, not an in-place migration — no automated Firebase → Supabase data migration is planned initially, since v1 has effectively no production user base beyond the author. If that changes, a one-off script reading the Firestore export and upserting into `listening_entries`/`albums` would be the approach.

## Open questions

- `next-pwa` maintenance status should be re-checked at implementation time; if it's stale, evaluate `serwist` as the service-worker layer instead.
