/**
 * Moderation: reports, machine triage, human decisions.
 *
 * The design rule that the whole module exists to enforce:
 *
 *   Automated classification may only ROUTE and RANK work for humans.
 *   It never removes, hides or restricts legal speech on its own.
 *
 * `triage()` therefore returns a severity hint plus its reasons and a
 * confidence, and always produces a queue item for a human. The classifier is
 * pluggable (`setClassifier`) so WP4 can swap the heuristic baseline for a
 * model and compare both against the same fundamental-rights protocol —
 * including per-language quality, which is why `language` is carried through
 * and reported: a model that only works in English must not silently become
 * the moderation system for Estonian.
 */

import { all, get, now, run } from '../db.js';

/** Baseline heuristic classifier — deliberately simple and auditable. */
const patterns = [
  { severity: 'high', label: 'threat', re: /\b(kill|hurt|find) (you|yourself|him|her|them)\b/i },
  { severity: 'high', label: 'self-harm', re: /\b(kill myself|end it all|self-harm)\b/i },
  { severity: 'medium', label: 'targeted-insult', re: /\b(you are|you're) (an? )?(idiot|stupid|worthless|ugly)\b/i },
  { severity: 'medium', label: 'doxxing-shape', re: /\b\d{1,3} [A-Z][a-z]+ (Street|Straße|Rue|Via)\b/ },
  { severity: 'low', label: 'link-spam', re: /(https?:\/\/\S+){4,}/ },
];

let classifier = defaultClassifier;

/**
 * @returns {{severity: 'none'|'low'|'medium'|'high', labels: string[], confidence: number, model: string, languageSupported: boolean}}
 */
function defaultClassifier({ content, language = 'en' }) {
  const labels = [];
  let severity = 'none';
  const rank = { none: 0, low: 1, medium: 2, high: 3 };

  for (const pattern of patterns) {
    if (pattern.re.test(content)) {
      labels.push(pattern.label);
      if (rank[pattern.severity] > rank[severity]) severity = pattern.severity;
    }
  }
  // Honest about its own limits: the baseline is English/German-shaped only.
  const languageSupported = ['en', 'de'].includes(language);
  return {
    severity,
    labels,
    confidence: languageSupported ? (labels.length ? 0.6 : 0.5) : 0.2,
    model: 'heuristic-baseline-v1',
    languageSupported,
  };
}

/** WP4 hook: swap in a model implementation for evaluation. */
export function setClassifier(fn) {
  classifier = fn ?? defaultClassifier;
}

export const resetClassifier = () => setClassifier(defaultClassifier);

/**
 * Classify a post. Returns the triage hint and, when the hint is non-trivial,
 * opens a queue item for a human moderator. Returns `{ triage, reportId }`.
 */
export function triage(post) {
  const result = classifier({ content: post.content, language: post.language ?? 'en' });
  if (result.severity === 'none') return { triage: result, reportId: null };

  const reportId = run(
    `INSERT INTO reports (reporter_id, post_id, account_id, reason, source, severity, triage, state, created_at)
     VALUES (NULL, ?, ?, ?, 'triage', ?, ?, 'open', ?)`,
    post.id,
    post.account_id,
    `automatic triage: ${result.labels.join(', ')}`,
    result.severity,
    JSON.stringify(result),
    now(),
  );
  return { triage: result, reportId };
}

export function reportPost({ reporterId, postId, accountId, reason }) {
  return run(
    `INSERT INTO reports (reporter_id, post_id, account_id, reason, source, severity, state, created_at)
     VALUES (?, ?, ?, ?, 'user', 'unknown', 'open', ?)`,
    reporterId ?? null,
    postId ?? null,
    accountId ?? null,
    String(reason ?? '').slice(0, 1000),
    now(),
  );
}

/** Open queue, worst first, user reports ahead of machine hints at equal severity. */
export function openReports() {
  return all(
    `SELECT r.*, p.content, p.language, a.username AS subject_username
     FROM reports r
     LEFT JOIN posts p ON p.id = r.post_id
     LEFT JOIN accounts a ON a.id = r.account_id
     WHERE r.state = 'open'
     ORDER BY CASE r.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 1 END,
              CASE r.source WHEN 'user' THEN 0 ELSE 1 END,
              r.created_at ASC`,
  );
}

/**
 * A human decides. This is the only path that can restrict content — there is
 * no code path in LAMP where a classifier's output reaches `deleted_at`.
 */
export function decideReport({ reportId, moderatorId, decision, note = '' }) {
  const report = get('SELECT * FROM reports WHERE id = ?', reportId);
  if (!report) return null;
  if (!['actioned', 'dismissed'].includes(decision)) {
    throw new Error(`Unknown moderation decision: ${decision}`);
  }
  if (decision === 'actioned' && report.post_id) {
    run('UPDATE posts SET deleted_at = ? WHERE id = ?', now(), report.post_id);
  }
  run(
    'UPDATE reports SET state = ?, decided_by = ?, decision_note = ?, decided_at = ? WHERE id = ?',
    decision,
    moderatorId,
    note,
    now(),
    reportId,
  );
  return get('SELECT * FROM reports WHERE id = ?', reportId);
}

/**
 * Aggregate stats for the WP4 responsible-AI assessment: how often the machine
 * hint agreed with the human decision, broken down by language.
 */
export function triageAgreementStats() {
  const rows = all(
    `SELECT severity, state, COALESCE(p.language, 'unknown') AS language
     FROM reports r LEFT JOIN posts p ON p.id = r.post_id
     WHERE r.source = 'triage' AND r.state != 'open'`,
  );
  const byLanguage = {};
  for (const row of rows) {
    const bucket = (byLanguage[row.language] ??= { decided: 0, actioned: 0, dismissed: 0 });
    bucket.decided += 1;
    bucket[row.state] += 1;
  }
  for (const bucket of Object.values(byLanguage)) {
    bucket.precision = bucket.decided ? bucket.actioned / bucket.decided : null;
  }
  return byLanguage;
}
