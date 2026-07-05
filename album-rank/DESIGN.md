# Ranked — Design Doc

An album/song rating companion for people who want more out of Apple Music than a play button: a fast way to score what they listen to, keep a running journal of their thoughts, watch their own opinions shift over time, and see how their taste stacks up against friends and everyone else.

## 1. Overview

Ranked is a personal rating and listening-journal app, built as a *companion* to Apple Music rather than a replacement for it. You still listen in Apple Music (or whatever plays the album) — Ranked is the fast side-panel you pop into to score an album, jot a thought, or re-rank a song, then get back to listening.

**Why "companion" and not "plugin"**: Apple does not expose any extension, plugin, or embedding API into the Music app itself — there is no supported way to inject UI into Apple Music or intercept its playback. Every real "Letterboxd for music" style product (Album of the Year, RateYourMusic, Musicboard) works the same way: a separate app/site that links out to the real streaming app for playback. Ranked follows that model: it fetches metadata and artwork from Apple's public iTunes catalog, and every "play" action is a deep link (`music.apple.com/...`) that hands off to the real Apple Music app.

## 2. Goals / Non-Goals

**Goals (v1 prototype)**
- Rate any album 1.0–10.0 (one decimal of precision), fast — a slider/stepper, not a form.
- A Library view of every album you've rated, sortable/filterable favorite → least favorite (and other useful orders).
- See your friends' average score and the global average score for any album.
- Attach timestamped notes/thoughts to an album — a running journal, not a single field you overwrite.
- Rate individual songs within an album, with a full append-only history so you can see how your opinion of a song evolved (first listen vs. later vs. now).
- Feel seamless: quick-rate interactions layered over the app, not buried behind navigation.

**Non-goals (v1 prototype)**
- No real accounts, auth, or backend — this is a local, single-user prototype.
- No real friends graph — friends and their scores are mocked.
- No in-app audio playback — playback is always handed off to Apple Music via deep link.
- No offline sync / multi-device support.

## 3. Information Architecture

Three real screens, stacked linearly (no router needed):

```
Library (home)
  └─▶ Album Detail
        └─▶ Song Ranking
```

An overlay layer floats above whichever screen is active, with its own state (not part of the screen stack), so scoring and note-taking feel like a quick interruption rather than a navigation:
- Search / Add Album
- Rating Sheet (bottom sheet — shared by album- and song-level scoring)
- Note Composer (bottom sheet)
- Track History (per-song timeline view)

## 4. Screen-by-Screen Spec

### Library (home)
- **Purpose**: the front door — everything you've rated, plus a queue of things you haven't gotten to yet.
- **Elements**: header with a search/add trigger; a horizontal "To Rank" queue strip for albums you've added but not scored; the main ranked list, one row per album (art thumbnail, title, artist, your score badge); a `SortFilterBar` above the list.
- **Empty state**: no albums yet — a prominent "Search for an album" call to action.
- **Interactions**: tap a library row → Album Detail. Tap the search trigger → Search overlay. Tap a sort/filter chip → re-orders the list in place.

### Album Detail
- **Purpose**: everything about one album — your score, how it compares to others, your notes, and the way in.
- **Elements**: large artwork, title/artist/year header; your current score with a "Rate" button (opens Rating Sheet); `FriendsAndGlobalStats` block (friends' avg + avatars, global avg + rating count); a "Rank Songs →" entry point into Song Ranking; `NotesTimeline` + "Add note" button (opens Note Composer); an Apple Music deep-link button.
- **Empty state (unrated)**: score area shows "Not yet rated" with a prominent Rate CTA instead of a number.
- **Interactions**: Rate → Rating Sheet; Add note → Note Composer; Rank Songs → Song Ranking screen; deep-link button opens `music.apple.com` in a new tab.

### Song Ranking
- **Purpose**: score each track on the album individually, and see how your opinion of a track has moved over time.
- **Elements**: track list (`TrackRow`: title, duration, current score badge, small trend arrow up/down/flat vs. the previous entry); tapping a row's score opens the Rating Sheet scoped to that track; tapping the trend/history affordance opens `TrackHistory`.
- **Empty state**: tracks with no rating yet show a dash instead of a badge, still tappable.
- **Interactions**: rating a track appends a new history entry (never overwrites); `TrackHistory` renders the full list oldest → newest, labeling the first entry "First listen" and the last "Current."

### Overlays
- **Search / Add Album**: live-typeahead against iTunes Search (`entity=album`), debounced, keyboard-navigable (mirrors the existing `SearchBar.jsx` pattern in `music-rec`). Selecting a result adds it to the library (if not already present) and opens Album Detail.
- **Rating Sheet**: a bottom sheet with a large numeric readout, a `<input type=range min=1 max=10 step=0.1>` slider, and ±0.1 stepper buttons flanking it for precision the slider alone can't reliably give on touch. Save commits the score (overwrite for album rank, append for song rank).
- **Note Composer**: a bottom sheet with a textarea and a Save button. Always appends a new entry — there is no edit-in-place.
- **Track History**: a read-only timeline of one track's score entries, newest state visually emphasized but list ordered chronologically.

## 5. Interaction Rationale

A plain `<input type=range>` at step 0.1 across a 1–10 span means ~91 discrete positions packed into one thumb drag — on a touch screen that's well below reliable finger precision. Pairing the slider with small ±0.1 stepper buttons gives two speeds in one control: drag for a fast rough placement, tap the steppers to nudge to the exact tenth you mean (e.g. landing on 7.4 vs. 7.5). This keeps rating a one-gesture-plus-a-tap action instead of a fiddly slider hunt or a typed-number form, which matters for the "seamless, doesn't get in the way of listening" goal.

## 6. Data Model

- **Album** (fetched live from iTunes, cached locally once added):
  `{ id, title, artist, artworkUrl, year, appleAlbumUrl, tracks: [{ id, title, trackNumber, durationMs, appleTrackUrl }] }`
- **UserAlbumRank** (keyed by albumId): `{ score, updatedAt }` — a single current value.
- **SongRankHistory** (keyed by trackId): `[{ id, score, timestamp }, ...]` — append-only; the latest entry by timestamp is the "current" score.
- **AlbumNotes** (keyed by albumId): `[{ id, timestamp, text }, ...]` — append-only, rendered newest-first.
- **MockFriendRanksByAlbum** (keyed by albumId, generated once per album and cached): `[{ friendId, score }, ...]` for a random subset of the 5 mock friends.
- **MockGlobalStatsByAlbum** (keyed by albumId, generated once and cached): `{ avg, count }`.
- **Friend** (static constant, 5 entries): `{ id, name, colorClass }`.

## 7. Mock Data Strategy

Album/track metadata is real (live iTunes fetch). Everything social is fabricated but must feel stable: the first time an album is viewed, a friends'-scores set and a global `{avg, count}` are generated once and written to localStorage, then read from cache on every subsequent view. Without this, a page reload would visibly re-randomize other people's opinions, which breaks the illusion this is real data.

## 8. Persistence

Everything is `localStorage`-backed, flat keys prefixed `albumrank_`, matching the existing style in `music-rec` (e.g. `lastfm_key`, `streaming`):
- `albumrank_library` — cached Album objects the user has added
- `albumrank_ranks` — map albumId → UserAlbumRank
- `albumrank_song_history` — map trackId → SongRankHistory array
- `albumrank_notes` — map albumId → AlbumNotes array
- `albumrank_social` — map albumId → `{ friends, global }`, generated lazily on first view

## 9. Apple Music Deep-Linking

iTunes Lookup responses include `collectionViewUrl` (album) and `trackViewUrl` (track) fields, which are already valid `music.apple.com` links — these are used directly for the deep-link buttons. If a lookup result is missing one (uncommon but possible for some releases), fall back to a constructed search URL: `https://music.apple.com/search?term=<artist> <title>`.

## 10. Features to Consider Adding (beyond this prototype)

- Real friends system: invites, requests, privacy controls (public/private ratings and notes)
- Activity feed: see what friends just rated or wrote about
- Yearly/decade "wrapped"-style recaps and best-of lists
- Comparison-based rating as an alternative input model — pairwise "which do you prefer" prompts (Letterboxd/chess-rating style) to seed or refine a score instead of picking a raw number
- Listening-history import (from Apple Music or Last.fm) to auto-populate the "To Rank" queue instead of manual search-add
- Public profile + stats: top genres/artists, score distribution, most-argued-about albums
- Shareable rank cards — export a score/note as an image for social sharing
- Per-album rating-distribution histograms (not just a single average)
- Notifications (a friend rated something you rated highly/poorly)
- Multi-device sync via a real backend, once the concept is validated

## 11. Open Questions

- Should the **album-level** rank also become append-only history for symmetry with songs, or stay a single overwritable value as literally requested? (Prototype implements the latter; flagging in case the intent was full symmetry.)
- Are note entries or song-history entries ever **editable or deletable**, or is true permanence ("you can't un-say what you thought at the time") the intended behavior? (Prototype treats them as permanent.)
- Score-band color thresholds (e.g. what score range reads as "green" vs "red") are a visual-design choice, not specified — the prototype picks a reasonable default (see App.css) but this is easy to retune.
- Behavior when iTunes returns an album with zero tracks (prototype shows an empty-tracklist state rather than erroring).

## 12. Prototype Scope Note

**Live data**: album search results, artwork, tracklists, and deep-link URLs — all fetched from Apple's public iTunes Search/Lookup API in real time.

**Mocked data**: your own ratings, notes, song rank history, the friends roster, friends' scores per album, and the global average per album — all fabricated and stored only in this browser's `localStorage`. There is no account system and no real other users. This prototype exists to validate the *interaction design*, not to be a production-ready social product.
