# LAMP — Youth-Led Alternative Media Platform

A working ActivityPub social network built around the requirements of the EU call
**PPPA-2026-YOUTH-SOCIAL-MEDIA-DESIGN — Youth-Driven Social Media Design: Safe, Inclusive,
and Publicly-Owned Social Media** (DG CONNECT, Unit I.4).

This repository holds two things: the **prototype** (`src/`, `tests/`) and the **proposal**
it belongs to (`proposal/`).

## What it does

It federates. It runs a real ActivityPub server — WebFinger, actor documents, signed
inbox/outbox, follows, posts, likes, deletes — so an account here can be followed from
Mastodon and vice versa. What makes it a *youth-centred* service is the set of properties
that hold underneath that:

| Property | What it means in the product |
| --- | --- |
| **Chronological by default** | The default feed is strictly time-ordered. Other feeds are plugins, must be chosen, and must explain themselves on screen. No feed uses engagement data. |
| **No infinite scroll** | Paging is a link you click. The end of the timeline is stated in words. The product ships zero client-side JavaScript, and the CSP forbids it. |
| **Counts are private** | Like and follower counts are visible to the author only, unless the author opts in — over the protocol too, not just in the UI. |
| **Replies are consent-first** | The author decides who may reply, the rule is enforced at write time for local *and* federated replies, and a 30-second cool-down blunts pile-ons. |
| **Alt text is mandatory** | A post with an undescribed image is rejected. Undescribed remote images are dropped rather than shown. |
| **Pause, don't delete** | One click hides your profile and stops federation. Nothing is deleted, followers stay, one click brings it all back. |
| **Minors are protected by a floor** | Accounts registered as under 18 keep limited replies, DMs off, no discovery listing and private counts — settings cannot switch these off. |
| **AI routes, humans decide** | Automated triage ranks the moderation queue and reports its own per-language weakness. There is no code path from a classifier to content removal. |
| **You can leave** | Full export of profile, posts and both sides of the social graph, as JSON, at any time. |
| **No surveillance data model** | Reading behaviour is never recorded. There is no impressions table, no dwell time, no interest inference. |

Every row above is covered by a test. See `docs/design-decisions.md` for why each was
chosen, and `docs/call-traceability.md` for what maps to which call objective — including
an honest list of what is still missing.

## Run it

Requires Node.js ≥ 22.5 (uses the built-in SQLite). **No dependencies, no build step.**

```bash
npm run dev     # seeds two demo accounts, serves http://localhost:3000
npm test        # 55 tests
```

Demo accounts after `npm run dev`: `mira` and `jonas` (a minor account), password
`lamp-demo-password`.

Configuration is environment-driven — `LAMP_ORIGIN`, `LAMP_PORT`, `LAMP_DB`, `LAMP_NAME`,
`LAMP_SEED`, `LAMP_FEDERATION` — see `src/config.js`.

## Layout

```
src/
  config.js              well-being defaults live here, in one place
  db.js                  schema (note what it deliberately cannot store)
  lib/                   HTTP Signatures, password hashing, routing
  domain/                accounts, posts, safety, feeds, moderation
  federation/            AS2 documents, inbox handling, signed delivery
  web/                   server-rendered accessible HTML + stylesheet
tests/                   55 tests: wellbeing, safety, federation, end-to-end HTTP
docs/                    design decisions, call traceability
proposal/                the grant application this prototype belongs to
```

## Endpoints

| Path | Purpose |
| --- | --- |
| `/` | Timeline (or sign-in when signed out) |
| `/@user` | Profile as HTML, or the actor document under `Accept: application/activity+json` |
| `/@user/inbox`, `/inbox` | Signed ActivityPub delivery |
| `/@user/outbox`, `/followers`, `/following` | AS2 collections |
| `/.well-known/webfinger`, `/nodeinfo/2.1` | Discovery; NodeInfo publishes the well-being posture |
| `/settings`, `/settings/export` | Preferences, pause/resume, data export |
| `/moderation` | Human moderation queue with per-language triage agreement |

## Licence

EUPL-1.2. The call asks for results to be open-sourced under the most appropriate licence;
EUPL is the Commission's own, and is compatible with AGPL-3.0 for upstream contributions.
