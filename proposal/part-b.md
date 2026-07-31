# Application Form — Part B (Technical description)

**Call:** PPPA-2026 — PPPA-2026-YOUTH-SOCIAL-MEDIA
**Topic:** PPPA-2026-YOUTH-SOCIAL-MEDIA-DESIGN
**Acronym:** lamb
**Title:** lamb — Youth-Led Alternative Media Platform: co-created, protocol-based social
media for young Europeans
**Coordinator:** [[COORDINATOR LEGAL NAME, PIC, COUNTRY]]
**Duration:** 24 months
**Requested EU contribution:** EUR 1 480 000 (80 % of EUR 1 850 000 total eligible costs)

> Drafting note — remove before submission. All `[[PLACEHOLDER]]` fields must be replaced
> with validated consortium data. Section numbering follows the standard PPPA Part B
> template (1 Relevance, 2 Quality, 3 Impact, 4 Work plan/Work packages/Timing, 5 Other,
> 6 Declarations). Keep the assembled document within the 70-page limit.

---

## 1. Relevance

### 1.1 Background and need

For Europeans aged 15–24, social media platforms are now the primary source of information
on social and political affairs, ahead of newspapers, television and radio (Eurobarometer,
Social Media Survey 2025). The environment in which that happens is shaped by attention-
maximising economic incentives that the JRC's *Fractured reality* report links to
information overload, opinion polarisation, echo chambers and toxic language. Young users
carry the sharpest edge of these effects — on attention, sleep, body image, exposure to
harassment — while having the least influence over how the products are designed.

Three structural facts define the opportunity lamb addresses.

1. **Lock-in is a design choice, not a law of nature.** On protocol-based social media
   (ActivityPub, AT Protocol), identity, social graph and content can move between
   services. A young user who finds a service harmful can leave without losing their
   friends. That single property converts wellbeing from a corporate courtesy into a
   competitive requirement.
2. **Middleware makes user agency concrete.** Open architectures let third parties supply
   feed algorithms, moderation services, verification and wellbeing features that users
   choose individually — a contestable market layer that does not exist on closed platforms.
3. **European decentralised services exist but are not built for the young.** The
   Fediverse's onboarding, defaults, moderation tooling and visual language are largely
   inherited from adult, technically literate early adopters. There is currently no
   protocol-based service whose interface, safety model and content experience were
   designed *with* European teenagers and young adults, including disabled and
   neurodivergent ones.

lamb exists to close gap 3 while making gaps 1 and 2 usable in practice.

### 1.2 Objectives of the action

**General objective (GO).** Through youth co-creation across at least eight Member States,
design, build and test an ActivityPub-based social media service for young EU citizens
centred on user well-being, and develop and begin executing a roll-out strategy grounded
in market research and stakeholder consultation.

| Call SO | lamb objective | Where delivered | Verifiable target |
| --- | --- | --- | --- |
| SO1 | Youth co-creation with expert and civil-society support | WP2 | ≥ 480 young participants, 8+ MS (N/E/W/S balanced), ≥ 25 % self-identifying as disabled or neurodivergent, gender-balanced; 12 experts on the Expert Support Pool |
| SO2 | Market conditions analysis and uptake/sustainability strategy | WP5 | Market study covering ≥ 30 comparable services; ≥ 120 mapped stakeholders; strategy co-drafted with ≥ 25 of them |
| SO3 | Functioning prototype on an open protocol | WP3 | lamb v1.0 federating over ActivityPub, open-sourced; ≥ 3 upstream contributions accepted by existing FOSS projects |
| SO4 | Testing and refinement incl. responsible AI | WP4 | ≥ 3 test waves, ≥ 900 test users; feature-comparison matrix vs. ≥ 10 platforms; ≥ 2 AI features evaluated against a fundamental-rights protocol |
| SO5 | Promotion and first roll-out step | WP6 | ≥ 15 000 registered young users in ≥ 12 MS by M24; ≥ 40 creators/multipliers activated |
| SO6 | Lessons learnt and ecosystem contribution | WP7 | Public "State of Youth-Centred Decentralised Social Media" report with funding recommendations; all code under EUPL-1.2/AGPL-3.0; open datasets where ethically possible |

### 1.3 Concept and approach

**Chosen technical route — one new service, built from existing open components.**
The call allows either one new prototype or upgrades to at least two existing services.
lamb proposes **one new, functioning prototype**, because the barriers young people face
on the Fediverse today (onboarding, safety defaults, discovery, aesthetics) are *product*
barriers rooted in the assumptions of existing codebases, and cannot be reached by
incremental patches to services whose current users would reject the necessary defaults.
The prototype is nevertheless not built on a blank page: it reuses mature open-source
building blocks ([[e.g. server framework]], moderation tooling, media pipeline) and every
generic improvement is contributed upstream, so existing services benefit regardless
(≥ 3 accepted upstream contributions is a binding target, WP3/WP7).

**Protocol choice — ActivityPub as the base, AT Protocol via bridge.** ActivityPub is a
W3C Recommendation with the largest deployed European instance base, mature
implementations and a governance culture lamb can contribute to. AT Protocol offers
stronger primitives for account portability and, notably, composable feed generators —
directly relevant to youth agency over ranking. lamb therefore federates natively over
ActivityPub and interoperates with the AT Protocol network through a maintained bridge,
with a feed-generator interface modelled on AT Protocol semantics so that third-party
"middleware" feeds can be plugged in on either side. This gives reach today and
portability tomorrow without splitting a pilot-scale engineering budget across two full
stacks.

**Well-being as an architectural property, not a settings screen.** Design commitments
carried through WP2 → WP3 → WP4:

- *Chronological or user-chosen ranking by default;* engagement-optimised ranking is never
  the default and never implicit.
- *No infinite scroll, no streaks, no unrequested notification pressure;* session shape is
  user-declared.
- *Public metrics off by default* (like/follower counts visible to the author only unless
  opted in) — repeatedly requested by young users in prior participatory research.
- *Consent-first interaction:* reply and quote permissions, cool-down on pile-ons,
  one-tap "pause my account" without deletion.
- *Accessibility as an acceptance criterion:* WCAG 2.2 AA, reduced-motion and low-stimulus
  modes, plain-language variants, screen-reader-verified flows — co-tested with disabled
  and neurodivergent participants rather than audited at the end.
- *Data minimisation by design:* no behavioural advertising profile exists in the data
  model; GDPR and DSA minor-protection obligations are design inputs from M1.

**AI, explored prominently and responsibly.** AI appears in lamb in three roles, each with
a youth-co-designed control surface and a documented fundamental-rights assessment:
(i) **moderation support** — multilingual triage and severity ranking that routes to human
moderators, never autonomous removal of legal speech; (ii) **verification and context** —
provenance signals and claim-matching against fact-check corpora, surfaced as context, not
verdicts; (iii) **discovery and new experiences** — opt-in, explainable feed generators
and adaptive content formats that young co-creators can inspect, switch and switch off.
Each is evaluated in WP4 for accuracy, language coverage, bias across the participant
diversity axes, and for whether young users understand what the system did and why.

### 1.4 EU strategic and legislative context

| Policy instrument | lamb contribution |
| --- | --- |
| European Democracy Shield (Nov 2025) | Concrete exploration of future social networking pathways supporting EU digital sovereignty |
| Communication on European Tech Sovereignty + EU Open Source Strategy | Strengthens the open-source social media space; all outputs are EU-hosted, EU-governed, open-licensed |
| Apply AI Strategy — media flagship | Responsible AI adoption for moderation, verification and user experience in a media context |
| Special panel on child safety online | Empowerment-focused design pattern for minors and youth, documented for reuse |
| DSA (incl. Art. 28 minors, risk mitigation) and GDPR | Compliance-by-design; the reference implementation doubles as a worked example for small providers |
| European Accessibility Act | Accessibility built into the product and its procurement-ready documentation |

### 1.5 European and trans-national dimension

Co-creation runs in **≥ 8 Member States** with North/East/West/South balance
([[e.g. SE, EE, PL, DE, NL, FR, ES, IT, EL, PT — confirm]]), in national languages, through
partners rooted in each country's youth infrastructure. The service ships multilingual
from v0.9 and the moderation model is federated: instances can be operated by national
youth organisations under a shared, published policy baseline. Results — code, design
system, moderation playbook, research data, uptake strategy — are reusable by any European
operator, and the ecosystem report is written for a readership of policy-makers and
funders in all Member States, not only the consortium's own.

### 1.6 Complementarity with other EU-funded work

lamb will actively seek cooperation with the two awardees of the 2025 *Building a
trustworthy social media sphere* call (publication of awardees expected Q3/4 2026) through
a joint annual workshop and shared dissemination, and will align with
[[NGI / Horizon Europe / CERV projects to be listed]]. Complementarity is managed as a
standing agenda item of the Steering Committee, with no duplication of funded activities;
where an existing project already delivers a component (e.g. an accessibility test suite),
lamb reuses rather than rebuilds and records the reuse in the periodic report.

---

## 2. Quality

### 2.1 Logical framework

| Problem | Need | lamb response | Output | Outcome |
| --- | --- | --- | --- | --- |
| Youth get information from platforms designed against their wellbeing | Products designed with them | WP2 co-creation, 8+ MS | Youth Design Charter, feature backlog | Design decisions traceable to youth input |
| Existing Fediverse services are not usable or appealing for young people | A youth-grade product | WP3 build on ActivityPub | lamb v1.0, open source | A credible European alternative exists |
| No evidence on what actually helps | Systematic testing | WP4 test waves + comparison matrix | Usability/wellbeing evidence base | Design claims are validated, not asserted |
| Alternatives fail on adoption and funding | Realistic market and uptake path | WP5 market study + strategy | Uptake & sustainability strategy | Post-project viability |
| Insights stay inside projects | Public knowledge | WP6/WP7 outreach + report | Users acquired, public report | Ecosystem and funders learn |

### 2.2 Consortium

| # | Partner | Country | Type | Role / required capacity | PM |
| --- | --- | --- | --- | --- | --- |
| P1 | [[COORDINATOR]] | [[MS]] | Non-profit / civic tech | Coordination, WP1, product ownership; **software development capacity** | 48 |
| P2 | [[YOUTH ORG]] | [[MS]] | Youth organisation network | WP2 lead; **youth engagement capacity**; 8-MS participant recruitment | 46 |
| P3 | [[DEV STUDIO / FOSS ENTITY]] | [[MS]] | SME / foundation | WP3 lead; ActivityPub engineering, AT bridge, upstream contributions | 55 |
| P4 | [[SCALING PARTNER]] | [[MS]] | Impact accelerator / venture-support body | WP5 lead; **capacity in scaling businesses/non-profits**; sustainability modelling | 24 |
| P5 | [[MENTAL HEALTH / DIGITAL RIGHTS NGO]] | [[MS]] | NGO | WP4 wellbeing and rights methodology; Expert Support Pool convenor | 22 |
| P6 | [[UNIVERSITY]] | [[MS]] | HEI (supportive role only) | Research design, evaluation, ecosystem report co-authoring | 15 |

Compliance: ≥ 4 independent beneficiaries from ≥ 3 eligible countries; the three mandatory
capacities are held by P1/P3 (software), P2 (youth engagement) and P4 (scaling); the single
university (P6) is a supportive partner, is not the coordinator and is 1 of 6 applicants
(≤ 1/4 rounded — [[verify: with 6 applicants, at most 1 university keeps the ratio at
16.7 %]]). Associated partners ([[national youth councils, creator networks, media
partners]]) participate without EU funding and do not count toward the minimum.

**Expert Support Pool (SO1).** Twelve named experts — mental health and adolescent
psychiatry, cognitive science, HCI/accessibility, trust & safety, economics of platform
markets, political science — contracted as individual experts or via P5/P6, each attached
to specific co-creation waves so that youth deliberation is informed, not steered.

### 2.3 Governance, cooperation and problem-solving

- **Steering Committee** (one voting representative per beneficiary, chaired by P1):
  quarterly; decides scope, budget shifts, risk escalations; simple majority, coordinator
  casts the deciding vote only after a documented mediation attempt.
- **Youth Board**: 12 young people elected from co-creation participants (2-year terms,
  paid), with a formal seat in the Steering Committee and a **documented veto-and-explain
  right** over product decisions that contradict the Youth Design Charter: the team may
  override only in writing, with the reason published in the release notes. This is the
  mechanism that makes "youth voice shapes the product" auditable.
- **Product Council** (P1 PO, P3 tech lead, P2 participation lead, P5 wellbeing lead):
  fortnightly backlog triage; every accepted backlog item carries a `source:` field
  pointing at the co-creation evidence that motivated it.
- **Conflict path**: Product Council → Steering Committee → mediation by an external
  facilitator named in the Consortium Agreement, decided within 30 days.
- **Consortium Agreement** signed before the GA, covering IPR (open-source licences
  pre-agreed), data protection roles, publication rights and exit.
- Tooling: shared repository and issue tracker (public by default), monthly all-hands,
  written decision log, quarterly internal quality review against deliverable acceptance
  criteria.

### 2.4 Methodology

**Participation.** Four co-creation waves aligned to product stages — *Explore* (M2–M5),
*Shape* (M6–M9), *Refine* (M12–M15), *Adopt* (M18–M21) — combining national workshops
(8+ MS), two multi-country living labs, focus groups dedicated to disabled and
neurodivergent participants, and two hackathons for older participants with development
skills. Every wave ends with a translation session in which participants review how their
input became backlog items — the anti-tokenism control. Recruitment runs through P2's
national member organisations plus schools, youth clubs, disability organisations and
online outreach, with quotas on geography, gender, socio-economic background and digital
literacy; participants are reimbursed, and safeguarding, informed consent (parental where
required) and data-minimising research protocols apply throughout (see 5.2 Ethics).

**Engineering.** Trunk-based development in two-week iterations, public roadmap, CI with
automated accessibility and performance gates, security review before each public
milestone, staged releases (v0.5 internal M9 → v0.9 closed beta M13 → v1.0 public M18 →
v1.1 hardened M22). Definition of Done includes: WCAG 2.2 AA check passed, wellbeing
default not regressed, `source:` traceability recorded, documentation and licence headers
present.

**Evaluation.** Mixed methods: instrumented (privacy-preserving, aggregate) usability
metrics; validated wellbeing and experience scales applied pre/post in test cohorts;
moderated usability sessions surfacing key barriers; and a structured **feature-comparison
matrix** scoring lamb against ≥ 10 mainstream and decentralised services on safety,
accessibility, agency, transparency and appeal. An independent evaluator ([[named]])
reviews method and findings at M12 and M23.

**Monitoring.** KPI dashboard (participation, engineering, adoption, dissemination)
reviewed monthly by the Product Council and quarterly by the Steering Committee; deviation
> 20 % from target triggers a documented corrective action.

### 2.5 Risk management

| # | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Recruitment shortfall in some Member States | M | H | Over-recruit in wave 1; associated national youth councils as reserve channels; online-first formats as fallback |
| R2 | Youth input is collected but does not shape the product | M | H | Youth Board veto-and-explain; `source:` traceability; translation sessions |
| R3 | Prototype scope creep beyond pilot budget | M | H | Fixed MVP scope frozen at M9 after wave 2; change requests require Steering Committee approval with budget offset |
| R4 | Safety incident / harmful content on the pilot service | M | H | Trust & safety plan before public beta, trained human moderators, incident playbook, staged invite-only growth, minors' protection measures per DSA |
| R5 | Federation or bridge instability | M | M | Conformance test suite; fallback to native ActivityPub-only if the bridge fails acceptance at M14 |
| R6 | AI features underperform in smaller EU languages | H | M | Language coverage measured per feature; feature ships only where measured quality passes; human-in-the-loop always |
| R7 | Adoption below target | M | M | Creator and multiplier partnerships contracted by M14; uptake strategy revised at M18 gate |
| R8 | Partner underperformance or withdrawal | L | H | Consortium Agreement remedies; task reallocation plan; 5 % contingency in effort planning |
| R9 | Data protection breach | L | H | DPIA before beta, joint-controller arrangement, pen-test before v1.0, breach procedure |
| R10 | Post-project funding not secured | M | H | Sustainability workstream from M6; ≥ 3 funding conversations documented by M20 |

### 2.6 Subcontracting and cost effectiveness

Subcontracting is limited to clearly delimited tasks that no beneficiary can perform:
independent security testing and penetration test, external evaluation, professional
translation and localisation QA, video/creative production for the campaign, and
accessibility certification — indicatively [[≤ 8 %]] of total eligible costs, awarded on
best value for money per Art. 6.2 MGA. Cost effectiveness rests on: reuse of mature
open-source components instead of greenfield build; participation costs concentrated where
they change decisions; a single product line rather than parallel stacks; and a partner mix
in which each mandatory capacity is held in-house rather than bought in.

---

## 3. Impact

### 3.1 Expected results and long-term impact

- **For young Europeans:** a live, free, EU-governed service with wellbeing defaults, used
  by ≥ 15 000 registered young users in ≥ 12 Member States by M24, and a documented pattern
  library that any European operator can adopt.
- **For the decentralised ecosystem:** upstream contributions to ActivityPub/AT Protocol
  implementations, a published moderation and safety playbook, an open design system, and
  evidence on which wellbeing defaults survive contact with real teenage users.
- **For policy and funders:** the *State of Youth-Centred Decentralised Social Media*
  report — opportunities, remaining barriers to scale for EU tech start-ups and non-profits
  in this space, and concrete recommendations for future public funding instruments.
- **For the societal debate:** an evidence-based counter-example to the assumption that
  youth engagement requires attention-extractive design.

### 3.2 Dissemination and outreach

Audience-segmented: (i) **young users** — creator partnerships, campus and youth-club
activations, short-form campaigns in national languages, school and youth-work channels via
P2; (ii) **the FOSS/Fediverse community** — upstream PRs, FOSDEM/ActivityPub-conference
presence, public roadmap; (iii) **stakeholders and multipliers** — media organisations,
educators, digital-rights and mental-health NGOs, funders, through the stakeholder forum
(2 editions); (iv) **policy** — the ecosystem report plus a closing event in Brussels,
strictly informational and outside the excluded category of activities directed at EU
institutions. All publications carry EU emblem and funding statement per Art. 17 MGA; all
code is released under [[EUPL-1.2 / AGPL-3.0]]; research outputs go to an open repository
under CC BY 4.0, with datasets published only where consent and minor-protection allow.

### 3.3 Sustainability

The uptake and sustainability strategy (D5.2) is built in WP5 with the mapped stakeholders
and tested against three candidate models, all non-advertising: a public-interest
foundation with institutional and philanthropic support; a federated model in which
national youth organisations and public media operate instances under a shared governance
charter; and an optional supporter/subscription tier for adults and organisations, never
gating youth safety features. By M20 a legal custodian for the codebase and trademark is
identified, a maintainer commitment of ≥ 24 months post-project is secured in writing, and
follow-on funding applications ([[Digital Europe / national funds / philanthropy]]) are
submitted. Because everything is open source and protocol-based, the exit case is benign:
even if lamb the service were discontinued, its users keep their graph and its components
keep serving other European operators.

---

## 4. Work plan, work packages, activities, resources and timing

### 4.1 Work package overview (24 months)

| WP | Title | Lead | Months | PM | Main outputs |
| --- | --- | --- | --- | --- | --- |
| WP1 | Coordination, management and quality | P1 | M1–M24 | 22 | Governance, reporting, risk, quality |
| WP2 | Youth co-creation and participation (SO1) | P2 | M1–M22 | 48 | 4 waves, Youth Design Charter, Youth Board |
| WP3 | Platform design and development (SO3) | P3 | M3–M22 | 62 | lamb v0.5 → v1.1, open-sourced, upstream PRs |
| WP4 | Testing, refinement and responsible AI (SO4) | P5 | M8–M23 | 28 | Test waves, comparison matrix, AI assessments |
| WP5 | Market analysis, stakeholders, uptake strategy (SO2) | P4 | M2–M20 | 20 | Market study, stakeholder map, uptake strategy |
| WP6 | Roll-out, communication and community (SO5) | P2 | M12–M24 | 20 | Campaign, creator programme, user growth |
| WP7 | Lessons learnt, open sourcing, ecosystem (SO6) | P6 | M6–M24 | 10 | Ecosystem report, open outputs, policy recommendations |

### 4.2 Work package descriptions

**WP1 — Coordination, management and quality (P1).**
Tasks: T1.1 contractual and financial management, Portal reporting, consortium meetings;
T1.2 quality assurance and deliverable review; T1.3 risk and change management; T1.4 data
protection and ethics oversight (DPIA, safeguarding compliance); T1.5 complementarity with
other EU-funded projects.

**WP2 — Youth co-creation and participation (P2).**
T2.1 recruitment and diversity assurance across ≥ 8 MS incl. disabled and neurodivergent
participants; T2.2 co-creation waves *Explore/Shape/Refine/Adopt* (workshops, 2 living labs,
dedicated inclusive focus groups, 2 hackathons); T2.3 Expert Support Pool integration;
T2.4 Youth Board operation; T2.5 synthesis into the Youth Design Charter and traceable
backlog; T2.6 UI look-and-feel and visual identity co-design.

**WP3 — Platform design and development (P3).**
T3.1 architecture and protocol decision record (ActivityPub core, AT bridge, feed-generator
interface); T3.2 core service and federation; T3.3 client and design system (accessibility
built in); T3.4 safety and moderation subsystem; T3.5 AI service layer (moderation support,
verification/context, opt-in explainable feeds) behind a documented interface; T3.6 release
engineering, security, upstream contributions.

**WP4 — Testing, refinement and responsible AI (P5).**
T4.1 test protocol, ethics and instrumentation; T4.2 three test waves (closed beta, public
beta, hardening) with ≥ 900 test users; T4.3 usability-barrier identification; T4.4
feature-comparison matrix vs. ≥ 10 platforms; T4.5 fundamental-rights and performance
assessment of each AI feature, incl. language-coverage and bias testing; T4.6 refinement
backlog handed to WP3.

**WP5 — Market analysis, stakeholders and uptake strategy (P4).**
T5.1 market and competitive analysis, barriers to adoption; T5.2 stakeholder mapping
(≥ 120 actors: creators, media, education, youth organisations, funders, instance
operators); T5.3 governance and operating-model options; T5.4 co-drafting of the uptake and
sustainability strategy with ≥ 25 stakeholders; T5.5 funding pipeline and legal custodian.

**WP6 — Roll-out, communication and community (P2).**
T6.1 brand and campaign production; T6.2 creator and multiplier programme (≥ 40 partners);
T6.3 national activations in ≥ 12 MS; T6.4 community management, moderation staffing and
onboarding support; T6.5 execution and measurement of **the first step of the uptake
strategy**.

**WP7 — Lessons learnt, open sourcing and ecosystem contribution (P6).**
T7.1 continuous documentation of insights; T7.2 open-source releases, licences,
contribution guides, maintainer handover; T7.3 stakeholder forum (2 editions) and
cooperation with the 2025 trustworthy-social-media awardees; T7.4 the *State of
Youth-Centred Decentralised Social Media* report with recommendations for future public
funding; T7.5 final conference and open archive.

### 4.3 Deliverables

| ID | Deliverable | WP | Type | Month |
| --- | --- | --- | --- | --- |
| D1.1 | Project handbook, quality plan, Consortium Agreement summary | 1 | R | M2 |
| D1.2 | DPIA, ethics and safeguarding framework | 1 | R | M3 |
| D1.3 | Interim technical and financial report | 1 | R | M12 |
| D1.4 | Final report | 1 | R | M24 |
| D2.1 | Co-creation methodology, recruitment and inclusion plan | 2 | R | M3 |
| D2.2 | Youth needs and preferences synthesis (waves 1–2) | 2 | R | M9 |
| D2.3 | Youth Design Charter (living document, v2) | 2 | R | M10 |
| D2.4 | Final participation report incl. traceability of youth input | 2 | R | M22 |
| D3.1 | Architecture and protocol decision record | 3 | R | M5 |
| D3.2 | lamb v0.9 closed beta | 3 | DEC/software | M13 |
| D3.3 | lamb v1.0 public release, open-sourced | 3 | DEC/software | M18 |
| D3.4 | lamb v1.1 + upstream contribution record | 3 | DEC/software | M22 |
| D4.1 | Test and evaluation protocol | 4 | R | M9 |
| D4.2 | Usability, safety and wellbeing findings incl. barrier analysis | 4 | R | M16 |
| D4.3 | Feature-comparison matrix vs. ≥ 10 platforms | 4 | R | M20 |
| D4.4 | Responsible-AI assessment report | 4 | R | M23 |
| D5.1 | Market analysis and stakeholder map | 5 | R | M10 |
| D5.2 | Uptake and sustainability strategy | 5 | R | M16 |
| D6.1 | Communication, dissemination and roll-out plan | 6 | R | M12 |
| D6.2 | First-step roll-out execution report | 6 | R | M24 |
| D7.1 | Open-source release and maintainer handover package | 7 | R | M23 |
| D7.2 | *State of Youth-Centred Decentralised Social Media* report | 7 | R | M24 |

### 4.4 Milestones

| MS | Milestone | Month | Means of verification |
| --- | --- | --- | --- |
| MS1 | Project set up, ethics framework approved | M3 | D1.1, D1.2 accepted |
| MS2 | Youth Design Charter adopted by the Youth Board | M10 | Signed Charter, Board minutes |
| MS3 | Closed beta live and federating | M13 | D3.2, federation conformance tests |
| MS4 | Public release v1.0 and open source published | M18 | D3.3, public repository |
| MS5 | Uptake strategy adopted; first step launched | M18 | D5.2 + campaign launch record |
| MS6 | Adoption target met, lessons published | M24 | Analytics report, D7.2 |

### 4.5 Timing (Gantt, quarters)

```
WP1 Coordination        ████████████████████████  M1–M24
WP2 Co-creation         ██████████████████████░░  M1–M22
WP3 Development         ░░████████████████████░░  M3–M22
WP4 Testing & AI        ░░░░░░░██████████████░░░  M8–M23
WP5 Market & uptake     ░██████████████████░░░░░  M2–M20
WP6 Roll-out            ░░░░░░░░░░░████████████░  M12–M24
WP7 Lessons & ecosystem ░░░░░██████████████████░  M6–M24
Waves:  Explore M2–M5 │ Shape M6–M9 │ Refine M12–M15 │ Adopt M18–M21
Releases: v0.5 M9 │ v0.9 M13 │ v1.0 M18 │ v1.1 M22
```

### 4.6 Staff effort and budget summary

Total eligible costs EUR 1 850 000; requested EU contribution EUR 1 480 000 (80 %);
co-financing EUR 370 000 from [[own resources / partner contributions, to be specified per
partner]]. Full breakdown in `proposal/budget.md` and in the detailed budget table annex;
the Part A summarised budget must match it exactly.

---

## 5. Other

### 5.1 Previous projects (last 4 years)

Use the template provided in Part B; list per beneficiary the key projects of the last four
years with funding source, budget, role and relevance. [[TO BE COMPLETED — P1…P6]]

### 5.2 Ethics

lamb works with minors and with disabled and neurodivergent participants, so ethics is a
work-package-level obligation, not a declaration: informed consent in plain language with
parental consent where national law requires it; trained safeguarding leads at every
in-person activity and a named child-protection officer; the right to withdraw data at any
point; pseudonymisation at collection and no transfer of research data outside the EU;
DPIA completed before any beta with real users (D1.2); no experimental manipulation of
participants' wellbeing; independent ethics review by [[ethics board / P6 committee]].
Compliance with the highest ethical standards and applicable EU, international and national
law per Art. 14 MGA.

### 5.3 Security

No EU-classified information is handled (Art. 13 MGA). Product security: threat model
maintained from M4, secure SDLC, dependency scanning, coordinated vulnerability disclosure
policy published with v1.0, independent penetration test before public release, incident
response plan with defined notification paths.

### 5.4 Data management

Open by default, protective by exception: code and documentation open-sourced; research
outputs CC BY 4.0 in an open repository; personal data never published; aggregate,
anonymised datasets released only where consent and minor protection permit. FAIR
principles applied to all published datasets.

### 5.5 Compliance with EU policy interests and values

Non-discrimination and gender balance in participation and staffing; accessibility as an
acceptance criterion; environmental footprint limited by rail-first travel, hybrid formats
and efficiency budgets for infrastructure; no financial support to third parties; no
activities directed at EU institutions.

### 5.6 Declarations

To be completed in the official template (admissibility, eligibility, mandate, DoH,
conflict of interest, double funding).
