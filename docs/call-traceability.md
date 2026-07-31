# Call traceability — prototype vs. PPPA-2026-YOUTH-SOCIAL-MEDIA-DESIGN

What the call requires, what this repository actually implements, and what is
honestly still missing. The point of this table is that reviewers can check the
claims against code and tests rather than against prose.

## Specific objectives

| Call SO | Requirement | Status | Where |
| --- | --- | --- | --- |
| SO1 | Youth co-creation in ≥ 8 Member States | **Not software.** The prototype carries the *outcomes* of co-creation as defaults and as open questions | `docs/design-decisions.md` (each decision names its rationale; "Open questions" lists what belongs to WP2) |
| SO2 | Market analysis and uptake strategy | **Not software** — WP5 deliverable D5.1/D5.2 | `proposal/part-b.md` §4.2 |
| SO3 | ≥ 1 functioning prototype on ActivityPub or AT Protocol | **Implemented** — federating server, actors, inbox/outbox, WebFinger, HTTP Signatures, NodeInfo | `src/federation/`, `tests/federation.test.js` (17 tests) |
| SO4 | Testing and refinement; responsible AI | **Partly implemented** — the moderation triage interface, its human-decision guarantee, per-language agreement stats and a swappable classifier exist; the empirical test waves are WP4 | `src/domain/moderation.js`, `tests/safety.test.js` |
| SO5 | Promotion and first roll-out step | **Not software** — WP6 | `proposal/part-b.md` §4.2 |
| SO6 | Lessons learnt, open sourcing | **Started** — EUPL-1.2, no dependencies, decisions documented with rationale | `package.json`, `docs/` |

## Scope requirements that are product properties

| Requirement from the call | Implemented as | Test |
| --- | --- | --- |
| Decentralised data management | ActivityPub federation, portable identity, account export | `federation.test.js`, `wellbeing.test.js` |
| Protective of privacy, autonomy and well-being | Chronological default, private counts, no behavioural data model, no infinite scroll | `wellbeing.test.js`, `http.test.js` |
| Look and feel appealing to young audiences | Server-rendered design system with light/dark, low-stimulus and plain-language modes | `src/web/style.js` |
| Inclusivity for disabled and neurodivergent users | Mandatory alt text, reduced-motion and low-stimulus modes, semantic HTML, skip links, works without JS, WCAG-oriented focus styling | `wellbeing.test.js`, `http.test.js` |
| Middleware / third-party feed algorithms | Feed generator registry with a required user-facing explanation | `feeds.js`, `wellbeing.test.js` |
| AI as risk and as mitigation | Triage that routes but never removes; language-coverage honesty; agreement metrics; pluggable classifier for evaluation | `safety.test.js` |
| Minors' protection (DSA-aligned) | Non-overridable protective floor for accounts registered as under 18 | `wellbeing.test.js` |
| Contribution to the wider ecosystem | Well-being posture published in NodeInfo so instance pickers can filter for it; open licence | `federation.test.js` |

## Honest gaps

The prototype is a pilot-stage artefact, not a production service. Missing, in
rough order of importance for a real deployment:

1. **Media uploads** — the data model and alt-text rule are in place, but there
   is no upload pipeline or storage backend.
2. **Direct messages** — `dmFrom` is enforced as a preference but no DM feature
   exists yet.
3. **Delivery queue robustness** — retries are linear and in-process; a real
   deployment needs backoff, a dead-letter path and a separate worker.
4. **Instance-level moderation** — per-instance blocks, allowlist federation and
   moderator roles (currently any signed-in user can see the queue, which is
   fine for a single-team pilot and wrong for anything larger).
5. **Mention parsing** — `mentioned` policies match on the handle in the body;
   a proper mention table is needed for reliability.
6. **AT Protocol bridge** — the feed interface is shaped for it; the bridge
   itself is not written.
7. **Rate limiting and abuse defences at the HTTP layer.**
8. **i18n** — the interface strings are English-only; the co-creation process
   runs in eight languages, so this is a prerequisite for wave 3.

None of these change the properties the tests assert; they are scope, not
compromises to the design.
