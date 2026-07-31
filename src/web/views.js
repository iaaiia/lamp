/**
 * Huddle — servergerendertes HTML, ohne Client-JavaScript.
 *
 * Das ganze Produkt funktioniert ohne JavaScript. Das ist eine bewusste
 * Zugänglichkeits- und Sicherheitseigenschaft: nichts kann automatisch
 * abspielen, sich unter der lesenden Person umsortieren oder mehr nachladen,
 * als angefordert wurde — weil es keinen Client-Code gibt, der das täte.
 */

import config from '../config.js';
import { preferencesOf } from '../domain/accounts.js';

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const handleOf = (row) => (row.domain ? `@${row.username}@${row.domain}` : `@${row.username}`);

/** Initialen für den Presence-Ring. */
const initials = (row) =>
  (row.display_name || row.username || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

/** Das Logo: die Gruppe außen, die Person innen. */
const logo = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--blue)" stroke-width="2"></circle>
  <circle cx="12" cy="12" r="3.6" fill="var(--ember)"></circle>
</svg>`;

/** Der Support-Bogen: ein Kreis, der sich über eine Person legt. */
const supportArc = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M3.5 15a9 9 0 0 1 17 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>
  <circle cx="12" cy="19" r="2.4" fill="currentColor"></circle>
</svg>`;

/** Relative Zeit mit maschinenlesbarem Wert für Screenreader. */
function timeTag(iso) {
  const delta = (Date.now() - Date.parse(iso)) / 1000;
  const label =
    delta < 60 ? 'gerade eben'
    : delta < 3600 ? `vor ${Math.floor(delta / 60)} Min`
    : delta < 86400 ? `vor ${Math.floor(delta / 3600)} Std`
    : new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  return `<time datetime="${escapeHtml(iso)}">${escapeHtml(label)}</time>`;
}

export function layout({ title, viewer, body, prefs }) {
  const p = prefs ?? preferencesOf(viewer);
  const classes = [
    p.reducedMotion ? 'reduced-motion' : '',
    p.lowStimulus ? 'low-stimulus' : '',
    p.plainLanguage ? 'plain-language' : '',
  ].filter(Boolean).join(' ');

  const nav = viewer
    ? `<li><a href="/">Start</a></li>
       <li><a href="/@${escapeHtml(viewer.username)}">Dein Profil</a></li>
       <li><a href="/settings">Einstellungen</a></li>
       <li><a href="/moderation">Moderation</a></li>
       <li><form method="post" action="/logout"><button class="quiet" type="submit">Abmelden</button></form></li>`
    : `<li><a href="/login">Anmelden</a></li><li><a href="/register">Konto anlegen</a></li>`;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(config.instanceName)}</title>
<link rel="stylesheet" href="/style.css">
<link rel="alternate" type="application/activity+json" href="${config.origin}">
</head>
<body class="${classes}">
<a class="skip-link" href="#main">Zum Inhalt springen</a>
<header class="site">
  <div class="inner">
    <a class="brandmark" href="/">${logo}${escapeHtml(config.instanceName)}</a>
    <nav class="site" aria-label="Hauptnavigation"><ul>${nav}</ul></nav>
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="site">
  <div class="inner">
    <p>${escapeHtml(config.instanceName)} läuft auf ActivityPub. Dein Konto, deine Beiträge und
    deine Kontakte kannst du jederzeit <a href="/settings/export">mitnehmen</a> — auf einen
    anderen Server, ohne deinen Kreis zu verlieren.</p>
    <p>Keine Werbeprofile. Keine Rangliste. Kein Nachladen beim Scrollen.</p>
  </div>
</footer>
</body>
</html>`;
}

export function postArticle(post, { viewer, showMetrics, supportSentence, supported, replyCount, canReply, replyReason }) {
  const media = JSON.parse(post.media || '[]')
    .map((item) => `<figure><img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt)}"><figcaption>${escapeHtml(item.alt)}</figcaption></figure>`)
    .join('');

  const body = post.content_warning
    ? `<details><summary>Inhaltshinweis: ${escapeHtml(post.content_warning)}</summary><div class="body">${escapeHtml(post.content)}</div>${media}</details>`
    : `<div class="body">${escapeHtml(post.content)}</div>${media}`;

  // Nie eine nackte Zahl: entweder Menschen, oder der Hinweis, dass der
  // Rückhalt im Kreis bleibt.
  const support = showMetrics
    ? supportSentence
      ? `<span class="support-note">${escapeHtml(supportSentence)}</span>`
      : ''
    : `<span class="support-note">Rückhalt bleibt im Kreis</span>`;

  const supportButton = viewer
    ? `<form method="post" action="/posts/${post.id}/support">
         <button class="support" type="submit" aria-pressed="${supported ? 'true' : 'false'}">
           ${supportArc}${supported ? 'Du stehst dahinter' : 'Support geben'}
         </button>
       </form>`
    : '';

  // Rückhalt soll in Zuwendung münden, nicht im Klick enden: Wer einen schweren
  // Beitrag unterstützt, bekommt den nächsten Schritt angeboten.
  const followUp = supported && post.content_warning && canReply
    ? `<div class="notice ember small">
         <strong>Du stehst hinter ${escapeHtml(post.display_name || post.username)}.</strong>
         Willst du auch etwas schreiben? <a href="/posts/${post.id}#reply">Antworten</a>
       </div>`
    : '';

  const replyControl = viewer
    ? canReply
      ? `<a href="/posts/${post.id}#reply">Mitreden</a>`
      : `<span class="meta small">${escapeHtml(replyReason ?? 'Antworten sind hier eingeschränkt.')}</span>`
    : '';

  return `<article class="post">
  <div class="who">
    <span class="faces" aria-hidden="true"><span>${escapeHtml(initials(post))}</span></span>
    <span class="name">${escapeHtml(post.display_name || post.username)}</span>
    <span class="handle">${escapeHtml(handleOf(post))}</span>
    ${timeTag(post.created_at)}
  </div>
  ${body}
  <div class="actions">
    ${supportButton}
    ${support}
    <a href="/posts/${post.id}" class="small">${replyCount} ${replyCount === 1 ? 'Antwort' : 'Antworten'}</a>
    ${replyControl}
  </div>
  ${followUp}
</article>`;
}

export function composer({ prefs, replyTo = null, error = null }) {
  const labels = {
    everyone: 'Alle können antworten',
    followers: 'Nur Leute, denen ich folge',
    mentioned: 'Nur Leute, die ich nenne',
    nobody: 'Keine Antworten',
  };
  const options = Object.entries(labels)
    .map(([value, label]) => `<option value="${value}"${value === prefs.replyPolicy ? ' selected' : ''}>${label}</option>`)
    .join('');

  return `<form class="card" method="post" action="${replyTo ? `/posts/${replyTo}/reply` : '/posts'}" id="reply">
  <h2 style="margin-top:0">${replyTo ? 'Antwort schreiben' : 'Was willst du sagen?'}</h2>
  ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
  <label for="content">Dein Beitrag</label>
  <textarea id="content" name="content" maxlength="${config.limits.postLength}" required></textarea>
  <label for="content_warning">Inhaltshinweis (optional)</label>
  <input type="text" id="content_warning" name="content_warning" maxlength="140">
  <p class="hint">Ein Inhaltshinweis blendet den Beitrag hinter einer Überschrift aus, bis jemand ihn öffnet.</p>
  ${replyTo ? '' : `
  <label for="reply_policy">Wer darf antworten?</label>
  <select id="reply_policy" name="reply_policy">${options}</select>
  <label for="visibility">Wer sieht das?</label>
  <select id="visibility" name="visibility">
    <option value="public">Alle</option>
    <option value="followers">Nur mein Kreis</option>
  </select>`}
  <p><button type="submit">${replyTo ? 'Antwort abschicken' : 'Beitrag veröffentlichen'}</button></p>
</form>`;
}

export function timelinePage({ viewer, prefs, feed, feeds, posts, nextCursor, error }) {
  const picker = feeds
    .map((f) => `<option value="${escapeHtml(f.id)}"${f.id === feed.id ? ' selected' : ''}>${escapeHtml(f.name)}</option>`)
    .join('');

  const list = posts.length
    ? posts.map((p) => postArticle(p, p.view)).join('')
    : `<p class="card">Hier ist noch nichts. Folge jemandem, oder schreib den ersten Beitrag.</p>`;

  // Weiterblättern ist ein Link, den man bewusst anklickt.
  const pager = nextCursor
    ? `<p class="pager"><a class="button secondary" href="/?feed=${encodeURIComponent(feed.id)}&amp;before=${encodeURIComponent(nextCursor)}">Ältere Beiträge zeigen</a></p>`
    : `<p class="pager end">Das war alles. Es lädt nichts von allein nach.</p>`;

  return layout({
    title: 'Start',
    viewer,
    prefs,
    body: `
<h1>Dein Kreis</h1>
<div class="feed-explainer">
  <p><strong>${escapeHtml(feed.name)}.</strong> ${escapeHtml(feed.explanation)}</p>
  <form method="get" action="/">
    <label for="feed" class="small">Wie dieser Kreis sortiert wird</label>
    <select id="feed" name="feed">${picker}</select>
    <p style="margin:.7rem 0 0"><button class="secondary" type="submit">Sortierung übernehmen</button></p>
  </form>
</div>
${composer({ prefs, error })}
<h2>Beiträge</h2>
${list}
${pager}`,
  });
}

export function threadPage({ viewer, prefs, post, replies, replyState, error }) {
  return layout({
    title: 'Beitrag',
    viewer,
    prefs,
    body: `
<h1>Beitrag</h1>
${postArticle(post, post.view)}
<h2>Antworten</h2>
${replies.length ? replies.map((r) => postArticle(r, r.view)).join('') : '<p class="card">Noch keine Antworten.</p>'}
${
  viewer
    ? replyState.allowed
      ? composer({ prefs, replyTo: post.id, error })
      : `<p class="notice" id="reply">${escapeHtml(replyState.reason)}</p>`
    : '<p class="notice"><a href="/login">Melde dich an</a>, um mitzureden.</p>'
}`,
  });
}

export function profilePage({ viewer, prefs, account, accountPrefs, posts, nextCursor, counts, isSelf, following, paused }) {
  const followForm = viewer && !isSelf
    ? `<form method="post" action="/@${escapeHtml(account.username)}/${following ? 'unfollow' : 'follow'}">
         <button type="submit" class="${following ? 'secondary' : ''}">${following ? 'Nicht mehr folgen' : 'In meinen Kreis holen'}</button>
       </form>`
    : '';

  const countsBlock = accountPrefs.showMetrics || isSelf
    ? `<p class="meta small mono">${counts.followers} im Kreis · folgt ${counts.following}</p>`
    : `<p class="meta small">Dieses Konto hält seinen Kreis privat.</p>`;

  if (paused) {
    return layout({
      title: `@${account.username}`,
      viewer,
      prefs,
      body: `<h1>@${escapeHtml(account.username)}</h1>
      <p class="notice">Dieses Konto lässt seinen Kreis gerade ruhen. Die Beiträge sind nicht
      gelöscht — sie werden nur nicht gezeigt, solange die Pause läuft.</p>`,
    });
  }

  return layout({
    title: `@${account.username}`,
    viewer,
    prefs,
    body: `
<div class="card">
  <div class="who" style="display:flex;gap:.6rem;align-items:center;margin-bottom:.6rem">
    <span class="faces" aria-hidden="true"><span>${escapeHtml(initials(account))}</span></span>
    <h1 style="margin:0">${escapeHtml(account.display_name || account.username)}</h1>
  </div>
  <p class="meta mono small">${escapeHtml(handleOf(account))}</p>
  ${account.bio ? `<p>${escapeHtml(account.bio)}</p>` : ''}
  ${countsBlock}
  ${followForm}
</div>
<h2>Beiträge</h2>
${posts.length ? posts.map((p) => postArticle(p, p.view)).join('') : '<p class="card">Noch keine Beiträge.</p>'}
${
  nextCursor
    ? `<p class="pager"><a class="button secondary" href="/@${escapeHtml(account.username)}?before=${encodeURIComponent(nextCursor)}">Ältere Beiträge zeigen</a></p>`
    : ''
}`,
  });
}

export function settingsPage({ viewer, prefs, feeds, saved }) {
  const checkbox = (name, label, hint) => `
  <label class="inline"><input type="checkbox" name="${name}" value="1"${prefs[name] ? ' checked' : ''}>
    <span>${escapeHtml(label)}<span class="hint">${escapeHtml(hint)}</span></span></label>`;

  const feedOptions = feeds
    .map((f) => `<option value="${escapeHtml(f.id)}"${f.id === prefs.feed ? ' selected' : ''}>${escapeHtml(f.name)}</option>`)
    .join('');

  return layout({
    title: 'Einstellungen',
    viewer,
    prefs,
    body: `
<h1>Einstellungen</h1>
${saved ? '<p class="notice" role="status">Gespeichert.</p>' : ''}
${viewer.is_minor ? `<p class="notice">Dieses Konto ist als unter 18 angemeldet. Ein paar Schutzeinstellungen
lassen sich deshalb nicht abschalten: Antworten bleiben auf Leute beschränkt, denen du folgst,
Direktnachrichten sind aus, und das Konto taucht nicht in Vorschlägen auf.</p>` : ''}
<form method="post" action="/settings">
  <fieldset>
    <legend>Dein Kreis</legend>
    <label for="feed">Wie dein Start sortiert wird</label>
    <select id="feed" name="feed">${feedOptions}</select>
    <p class="hint">Sortierungen sind austauschbar. Welche du auch wählst — sie erklärt sich oben
    auf deiner Startseite, und keine nutzt Verweildauer oder abgeleitete Interessen.</p>
  </fieldset>
  <fieldset>
    <legend>Aufmerksamkeit und Privatsphäre</legend>
    ${checkbox('showMetrics', 'Zeigen, wer hinter meinen Beiträgen steht', 'Standardmäßig aus. Solange es aus ist, siehst nur du, wer dir Support gegeben hat.')}
    ${checkbox('discoverable', 'Mein Konto in Vorschlägen zeigen', 'Aus heißt: Leute finden dich weiterhin über deinen genauen Namen.')}
    <label for="sessionLimitMinutes">Erinnerung nach (Minuten, 0 = aus)</label>
    <input type="text" id="sessionLimitMinutes" name="sessionLimitMinutes" value="${escapeHtml(prefs.sessionLimitMinutes)}" inputmode="numeric">
    <p class="hint">Du bestimmst, wie lange eine Sitzung dauert. Wir stupsen dich nie, länger zu bleiben.</p>
  </fieldset>
  <fieldset>
    <legend>Lesekomfort</legend>
    ${checkbox('reducedMotion', 'Bewegung reduzieren', 'Schaltet alle Übergänge und Animationen ab.')}
    ${checkbox('lowStimulus', 'Reizarme Farben', 'Entsättigte Palette ohne Akzentfarben, die um Aufmerksamkeit konkurrieren.')}
    ${checkbox('plainLanguage', 'Einfache Sprache und mehr Abstand', 'Größerer Zeilenabstand und kürzere Zeilen.')}
  </fieldset>
  <fieldset>
    <legend>Antworten</legend>
    <label for="replyPolicy">Voreinstellung für neue Beiträge</label>
    <select id="replyPolicy" name="replyPolicy">
      <option value="everyone"${prefs.replyPolicy === 'everyone' ? ' selected' : ''}>Alle können antworten</option>
      <option value="followers"${prefs.replyPolicy === 'followers' ? ' selected' : ''}>Nur Leute, denen ich folge</option>
      <option value="mentioned"${prefs.replyPolicy === 'mentioned' ? ' selected' : ''}>Nur Leute, die ich nenne</option>
      <option value="nobody"${prefs.replyPolicy === 'nobody' ? ' selected' : ''}>Keine Antworten</option>
    </select>
  </fieldset>
  <p><button type="submit">Einstellungen speichern</button></p>
</form>

<h2>Kreis ruhen lassen</h2>
<div class="card">
  <p>Eine Pause blendet dein Profil und deine Beiträge aus und stoppt die Verbindung zu anderen
  Servern. Nichts wird gelöscht, dein Kreis bleibt bestehen, und du kommst mit einem Klick zurück.</p>
  <form method="post" action="/settings/${viewer.paused_at ? 'resume' : 'pause'}">
    <button class="secondary" type="submit">${viewer.paused_at ? 'Kreis wieder öffnen' : 'Kreis ruhen lassen'}</button>
  </form>
</div>

<h2>Konto mitnehmen</h2>
<div class="card">
  <p>Lade Profil, Beiträge und deinen Kreis als JSON herunter. Jeder ActivityPub-Server kann das
  einlesen — weggehen ist hier eine unterstützte Handlung, keine Strafe.</p>
  <p><a class="button secondary" href="/settings/export">Meine Daten herunterladen</a></p>
</div>`,
  });
}

export function moderationPage({ viewer, prefs, reports, stats }) {
  const rows = reports.length
    ? reports
        .map(
          (r) => `<tr>
  <td><span class="chip">${escapeHtml(r.severity)}</span><br><small class="muted">${escapeHtml(r.source === 'user' ? 'gemeldet' : 'automatisch erkannt')}</small></td>
  <td>${escapeHtml(r.reason)}<br><small class="muted">${escapeHtml((r.content ?? '').slice(0, 160))}</small></td>
  <td class="mono">${escapeHtml(r.language ?? '—')}</td>
  <td>
    <form method="post" action="/moderation/${r.id}">
      <label for="note-${r.id}" class="small">Begründung</label>
      <input type="text" id="note-${r.id}" name="note" maxlength="500">
      <p style="margin:.6rem 0 0">
        <button name="decision" value="actioned" type="submit">Beitrag entfernen</button>
        <button class="secondary" name="decision" value="dismissed" type="submit">Verwerfen</button>
      </p>
    </form>
  </td>
</tr>`,
        )
        .join('')
    : '<tr><td colspan="4">Die Liste ist leer.</td></tr>';

  const statRows = Object.entries(stats)
    .map(([language, s]) => `<tr><td class="mono">${escapeHtml(language)}</td><td class="mono">${s.decided}</td><td class="mono">${s.actioned}</td><td class="mono">${s.precision === null ? '—' : (s.precision * 100).toFixed(0) + ' %'}</td></tr>`)
    .join('') || '<tr><td colspan="4">Noch keine entschiedenen Fälle.</td></tr>';

  return layout({
    title: 'Moderation',
    viewer,
    prefs,
    body: `
<h1>Moderation</h1>
<p class="notice">Die automatische Erkennung sortiert diese Liste nur. Sie kann nichts entfernen
oder ausblenden — jede Entscheidung hier trifft ein Mensch, und sie wird mit Namen festgehalten.</p>
<div class="table-scroll">
<table>
  <caption>Offene Fälle, dringendste zuerst</caption>
  <thead><tr><th scope="col">Einstufung</th><th scope="col">Grund</th><th scope="col">Sprache</th><th scope="col">Entscheidung</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</div>

<h2>Trefferquote nach Sprache</h2>
<p>Wie oft ein automatisch markierter Fall von einem Menschen tatsächlich bestätigt wurde. Ein
niedriger oder fehlender Wert heißt: Der Erkennung ist in dieser Sprache nicht zu trauen.</p>
<div class="table-scroll">
<table>
  <thead><tr><th scope="col">Sprache</th><th scope="col">Entschieden</th><th scope="col">Bestätigt</th><th scope="col">Übereinstimmung</th></tr></thead>
  <tbody>${statRows}</tbody>
</table>
</div>`,
  });
}

export function formPage({ viewer, prefs, title, intro, action, fields, submitLabel, error, footer = '' }) {
  return layout({
    title,
    viewer,
    prefs,
    body: `
<h1>${escapeHtml(title)}</h1>
${intro ? `<p class="muted">${escapeHtml(intro)}</p>` : ''}
${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
<form class="card" method="post" action="${action}">
  ${fields}
  <p><button type="submit">${escapeHtml(submitLabel)}</button></p>
</form>
${footer}`,
  });
}

export function errorPage({ viewer, prefs, status, message }) {
  return layout({
    title: `Fehler ${status}`,
    viewer,
    prefs,
    body: `<h1>${status}</h1><p class="notice">${escapeHtml(message)}</p><p><a href="/">Zurück zum Start</a></p>`,
  });
}
