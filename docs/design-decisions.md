# Design decisions

Each decision records what was chosen, why, and where it is enforced. The
`Enforced by` column matters more than the prose: a design commitment that is
not in a test is a slogan, not a property.

## D1 — ActivityPub as the base protocol, AT Protocol via a bridge

**Chosen:** federate natively over ActivityPub; interoperate with AT Protocol
through a bridge; model the feed-generator interface on AT Protocol semantics.

**Why:** ActivityPub is a W3C Recommendation with the largest deployed European
instance base, so a pilot reaches real users on day one. AT Protocol's feed
generators are the better primitive for user-chosen ranking, so LAMP adopts the
*shape* of that interface without splitting a pilot budget across two full
stacks.

**Enforced by:** `src/federation/`, `tests/federation.test.js`.

## D2 — Chronological by default, and every feed explains itself

**Chosen:** the default feed is strictly time-ordered. Alternative feeds are
registered plugins that must declare an `explanation`, shown above the timeline.
No feed may use engagement data.

**Why:** engagement ranking is the mechanism most directly implicated in the
harms the call describes. Making ranking opt-in, named and explained keeps user
agency real rather than buried in settings.

**Enforced by:** `registerFeed()` refuses a generator without an explanation
(`src/domain/feeds.js`); `tests/wellbeing.test.js` asserts the default.

## D3 — No infinite scroll, anywhere

**Chosen:** paging is an explicit link. The end of a timeline is stated in
words. There is no client-side JavaScript in the product at all.

**Why:** the strongest guarantee that nothing loads, re-orders or autoplays
under the reader is that no code exists to do it. This also makes the product
work on old devices and under assistive technology.

**Enforced by:** `tests/http.test.js` asserts no `<script>` tag is served and
that the CSP sets `script-src 'none'`.

## D4a — Support statt Like: Menschen statt Zahl

**Chosen:** die Kernreaktion heisst Support ("ich stehe dahinter", nicht "ich finde das
gut") und wird als Satz aus Namen angezeigt — "Mira, Jonas und 2 weitere stehen dahinter".
Eine nackte Gesamtzahl existiert nirgends im Produkt. Wer einen Beitrag mit Inhaltshinweis
unterstuetzt, bekommt danach angeboten, tatsaechlich zu antworten.

**Why:** ein umbenannter Like waere Kosmetik. Rueckhalt ist konkret oder er ist nichts —
und er soll in Zuwendung muenden, nicht im Klick enden.

**Enforced by:** `supportSentence()` (`src/domain/posts.js`), das Folgeangebot in
`postArticle()`; getestet in `tests/wellbeing.test.js` und `tests/http.test.js`.

Ueber ActivityPub wird Support als `Like` uebertragen, damit fremde Server es verstehen.
Die Semantik und die Anzeigeregeln liegen bei Huddle; was andere Server daraus machen,
laesst sich nicht kontrollieren — deshalb ist die Nicht-Vergleichbarkeit im eigenen Produkt
verankert, nicht im Protokoll.

## D4 — Public metrics off by default

**Chosen:** who supported a post is visible to the author only. The author — not the
viewer — opts in to making them public. Follower collections stay empty over
ActivityPub while counts are private.

**Why:** public scoreboards are the feature young participants most consistently
name as harmful. Privacy that leaks over the protocol is not privacy.

**Enforced by:** `metricsVisible()` (`src/domain/posts.js`), the followers and
following collection routes, `tests/wellbeing.test.js`, `tests/http.test.js`.

## D5 — Reply permission is a write-time gate, not a UI hint

**Chosen:** `canReply()` is the single gate. Local composer and federated inbox
both pass through it. `followers` means *the author follows you* — stricter than
the Fediverse norm, where being a follower is enough.

**Why:** anyone can follow you; being followed should not buy the right to speak
in your thread. A gate that only exists in the UI is bypassed by any other
client or server.

**Enforced by:** `src/domain/safety.js`, `createPost()`, `handleCreate()` in
`src/federation/inbox.js`; tested from both directions.

## D6 — Reply cool-down

**Chosen:** the same account cannot post repeated replies into one thread within
30 seconds.

**Why:** rapid repeated replies are the shape of a pile-on. A small amount of
friction changes the dynamic without removing anyone's voice.

**Enforced by:** `replyCooldownRemaining()`, `tests/safety.test.js`.

## D7 — Alt text is mandatory

**Chosen:** a post with an image and no description is rejected. Remote
attachments without a description are dropped rather than displayed.

**Why:** accessibility is an acceptance criterion in this project. An
unlabelled image is not content for a screen-reader user; showing it anyway
would be a worse outcome than not showing it.

**Enforced by:** `createPost()`, `handleCreate()`, both tested.

## D8 — Pause instead of delete

**Chosen:** pausing hides the profile and posts and stops all federation.
Nothing is deleted, followers are kept, one step restores everything.

**Why:** the choice between "stay" and "destroy your account" is a false one.
Leaving for a while must be cheap, and returning must be cheaper.

**Enforced by:** `pauseAccount()`/`resumeAccount()`, the paused checks in the
timeline query, delivery queue and inbox handlers; `tests/wellbeing.test.js`.

## D9 — Minor protections cannot be switched off

**Chosen:** for accounts registered as under 18, `updatePreferences()` re-applies
the protective floor after every write: replies limited, DMs off, not listed in
discovery, counts private. Posts default to followers-only.

**Why:** a protection that a dark pattern, a friend or a bad day can switch off
is not a protection. Comfort settings stay fully user-controlled.

**Enforced by:** `updatePreferences()`, `tests/wellbeing.test.js`.

## D10 — Automated classification routes; humans decide

**Chosen:** `triage()` returns a severity hint and opens a queue item. There is
no code path from a classifier's output to `deleted_at`. Only `decideReport()`
removes content, and it records the moderator and the note.

**Why:** the call asks for responsible AI in moderation. The defensible line is
that automation may allocate human attention, never restrict legal speech.

**Enforced by:** `src/domain/moderation.js`; `tests/safety.test.js` asserts a
flagged post survives classification.

## D11 — The classifier reports its own language limits

**Chosen:** triage output carries `languageSupported` and a lowered confidence
outside evaluated languages. `triageAgreementStats()` reports human agreement
per language.

**Why:** a moderation model that works in English and not in Estonian will
quietly under-protect Estonian users. Measuring per language is the only way
that failure becomes visible.

**Enforced by:** `defaultClassifier()`, `triageAgreementStats()`, tested.

## D12 — No data model for behavioural advertising

**Chosen:** reading behaviour is not recorded. There is no impressions table, no
dwell time, no interest inference. The timeline is computed from follows and
time only.

**Why:** the surveillance business model cannot be adopted later by accident if
the data to run it was never collected.

**Enforced by:** the schema in `src/db.js` — and by its absence.

## D13 — Export is a first-class feature

**Chosen:** any signed-in user can download their profile, posts and both sides
of their social graph as JSON, without asking anyone.

**Why:** portability is the property that makes well-being competitive rather
than charitable. Leaving must be a supported action.

**Enforced by:** `exportAccount()`, `/settings/export`, tested.

## Open questions for co-creation

These are deliberately unresolved in code — they belong to WP2, not to the
engineers:

- Should the reply cool-down scale with thread heat, or stay a flat 30 seconds?
- Is "quiet voices first" the right second feed, or should the slot go to a
  topic feed?
- Should a paused account show a tombstone to followers, or nothing at all?
- What is the right default for `sessionLimitMinutes` — off, or a suggested value?
