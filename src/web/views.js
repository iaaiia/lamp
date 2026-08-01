/**
 * lamb — servergerendertes HTML, ohne Client-JavaScript.
 *
 * Das ganze Produkt funktioniert ohne JavaScript. Das ist eine bewusste
 * Zugänglichkeits- und Sicherheitseigenschaft: nichts kann automatisch
 * abspielen, sich unter der lesenden Person umsortieren oder mehr nachladen,
 * als angefordert wurde — weil es keinen Client-Code gibt, der das täte.
 */

import config from '../config.js';
import { preferencesOf } from '../domain/accounts.js';
import { KIND_LABELS } from '../domain/circles.js';
import { circleSigil } from './sigil.js';
import { layoutSky } from './sky.js';
import { orbCss, orbHtml } from './orb.js';
import {
  iconBack,
  iconPlus,
  iconProfile,
  iconSearch,
  iconSettings,
  iconShield,
  iconSky,
  iconStream,
  iconSupport,
  iconWrite,
} from './icons.js';

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

export function layout({ title, viewer, body, prefs, current = null, head = '', bar = null }) {
  const p = prefs ?? preferencesOf(viewer);
  const classes = [
    p.reducedMotion ? 'reduced-motion' : '',
    p.lowStimulus ? 'low-stimulus' : '',
    p.plainLanguage ? 'plain-language' : '',
  ].filter(Boolean).join(' ');

  /**
   * Die Kopfzeile ist eine App-Leiste: links der Weg zurück, in der Mitte, wo
   * man ist, rechts eine einzige Handlung. Vorher stand hier eine Linkliste,
   * die auf dem Handy drei Zeilen fraß und trotzdem nicht sagte, wo man ist.
   */
  const appbar = viewer
    ? `<header class="appbar">
         <div class="slot left">${
           bar?.back
             ? `<a class="icon-btn" href="${bar.back}" aria-label="Zurück">${iconBack()}</a>`
             : `<span class="brandmark">${logo}</span>`
         }</div>
         <h1 class="appbar-title">${escapeHtml(bar?.title ?? title)}</h1>
         <div class="slot right">${
           bar?.action ??
           `<a class="icon-btn" href="/settings" aria-label="Einstellungen">${iconSettings()}</a>`
         }</div>
       </header>`
    : `<header class="appbar">
         <div class="slot left"><span class="brandmark">${logo}</span></div>
         <h1 class="appbar-title">${escapeHtml(config.instanceName)}</h1>
         <div class="slot right"></div>
       </header>`;

  const tab = (href, label, icon, key) =>
    `<a class="tab${current === key ? ' is-active' : ''}" href="${href}"${
      current === key ? ' aria-current="page"' : ''
    }>${icon}<span>${label}</span></a>`;

  // Vier Ziele plus die eine Handlung in der Mitte. Icons stehen nie allein —
  // unter jedem steht ein Wort.
  const dock = viewer
    ? `<nav class="dock" aria-label="Hauptnavigation">
         ${tab('/', 'Himmel', iconSky({ size: 22 }), 'sky')}
         ${tab('/discover', 'Suchen', iconSearch({ size: 22 }), 'discover')}
         <a class="compose" href="/compose" aria-label="Etwas schreiben">${iconPlus({ size: 26 })}</a>
         ${tab('/stream', 'Strom', iconStream({ size: 22 }), 'stream')}
         ${tab(`/@${escapeHtml(viewer.username)}`, 'Profil', iconProfile({ size: 22 }), 'profile')}
       </nav>`
    : '';

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(config.instanceName)}</title>
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/activity+json" href="${config.origin}">
${head}
</head>
<body class="${classes}${viewer ? ' has-dock' : ''}">
<a class="skip-link" href="#main">Zum Inhalt springen</a>
${appbar}
<main id="main" tabindex="-1">
${body}
</main>
${dock}
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

  // Eine Aktion, nicht zwei, die am selben Ort landen: Der Antwort-Link trägt
  // die Zahl, und wo nicht geantwortet werden darf, steht der Grund.
  const replyControl = !viewer || canReply
    ? `<a href="/posts/${post.id}" class="small">${
        replyCount === 0 ? 'Mitreden' : `${replyCount} ${replyCount === 1 ? 'Antwort' : 'Antworten'}`
      }</a>`
    : `<span class="meta small">${escapeHtml(replyReason ?? 'Antworten sind hier eingeschränkt.')}</span>`;

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
    ${replyControl}
  </div>
  ${followUp}
</article>`;
}

export function composer({ prefs, replyTo = null, error = null, action = null }) {
  const labels = {
    everyone: 'Alle können antworten',
    followers: 'Nur Leute, denen ich folge',
    mentioned: 'Nur Leute, die ich nenne',
    nobody: 'Keine Antworten',
  };
  const options = Object.entries(labels)
    .map(([value, label]) => `<option value="${value}"${value === prefs.replyPolicy ? ' selected' : ''}>${label}</option>`)
    .join('');

  const target = action ?? (replyTo ? `/posts/${replyTo}/reply` : '/posts');
  return `<form class="card" method="post" action="${target}" id="reply">
  <h2 class="flush">${replyTo ? 'Antwort schreiben' : 'Was willst du sagen?'}</h2>
  ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
  <label for="content">Dein Beitrag</label>
  <textarea id="content" name="content" maxlength="${config.limits.postLength}" required></textarea>
  <label for="content_warning">Inhaltshinweis (optional)</label>
  <input type="text" id="content_warning" name="content_warning" maxlength="140">
  <p class="hint">Ein Inhaltshinweis blendet den Beitrag hinter einer Überschrift aus, bis jemand ihn öffnet.</p>
  ${replyTo ? '' : `
  <label for="reply_policy">Wer darf antworten?</label>
  <select id="reply_policy" name="reply_policy">${options}</select>
  ${action ? '' : `
  <label for="visibility">Wer sieht das?</label>
  <select id="visibility" name="visibility">
    <option value="public">Alle</option>
    <option value="followers">Nur wer mir folgt</option>
  </select>`}`}
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
    title: 'Strom',
    viewer,
    prefs,
    current: 'stream',
    bar: { title: 'Strom' },
    body: `
<p class="muted">Was Menschen, denen du folgst, öffentlich unter eigenem Namen schreiben.
Beiträge aus Kreisen stehen in ihrem Kreis.</p>
<div class="feed-explainer">
  <p><strong>${escapeHtml(feed.name)}.</strong> ${escapeHtml(feed.explanation)}</p>
  <form method="get" action="/">
    <label for="feed" class="small">Wie dieser Kreis sortiert wird</label>
    <select id="feed" name="feed">${picker}</select>
    <p class="tight"><button class="secondary" type="submit">Sortierung übernehmen</button></p>
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
    bar: { title: 'Beitrag', back: '/' },
    body: `
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
  if (paused) {
    return layout({
      title: `@${account.username}`,
      viewer,
      prefs,
      bar: { title: `@${account.username}`, back: '/' },
      body: `<p class="notice">Dieses Konto lässt seinen Kreis gerade ruhen. Die Beiträge sind nicht
      gelöscht — sie werden nur nicht gezeigt, solange die Pause läuft.</p>`,
    });
  }

  const primary = isSelf
    ? `<a class="button grow" href="/compose">${iconWrite({ size: 20 })}Etwas schreiben</a>`
    : `<form method="post" action="/@${escapeHtml(account.username)}/${following ? 'unfollow' : 'follow'}" class="grow">
         <button type="submit" class="${following ? 'secondary' : ''}">${
           following ? 'Folgst du' : 'In meinen Kreis holen'
         }</button>
       </form>`;

  const secondary = isSelf
    ? `<a class="icon-btn" href="/settings" aria-label="Einstellungen">${iconSettings()}</a>`
    : '';

  /**
   * Die Zahlenzeile zeigt, was dieses Konto freigegeben hat — und sonst sagt sie
   * das offen, statt eine Null zu behaupten. Rückhalt und Kreisgröße sind
   * standardmäßig privat; daran ändert ein hübsches Layout nichts.
   */
  const stat = (value, label) => `<div class="stat"><span class="num">${value}</span><span class="lbl">${label}</span></div>`;
  const statsRow = accountPrefs.showMetrics || isSelf
    ? `<div class="stats">
         ${stat(counts.followers, 'im Kreis')}
         ${stat(counts.following, 'folgt')}
         ${stat(counts.posts, counts.posts === 1 ? 'Beitrag' : 'Beiträge')}
       </div>`
    : `<p class="meta small stats-private">Dieses Konto hält seinen Kreis privat.</p>`;

  return layout({
    title: `@${account.username}`,
    viewer,
    prefs,
    current: isSelf ? 'profile' : null,
    bar: {
      title: escapeHtml(account.display_name || account.username),
      back: '/',
      action: secondary,
    },
    body: `
<section class="profile">
  <span class="avatar">${circleSigil({ slug: account.username, kind: 'topic', member_count: counts.followers + 1 }, { size: 96, id: 'me' })}</span>
  <h2 class="profile-name">${escapeHtml(account.display_name || account.username)}</h2>
  <p class="profile-handle mono">${escapeHtml(handleOf(account))}</p>
  ${account.bio ? `<p class="profile-bio">${escapeHtml(account.bio)}</p>` : ''}
  ${statsRow}
  <div class="actions-row profile-actions">${primary}</div>
</section>

<div class="tabs" role="tablist" aria-label="Was von diesem Konto">
  <span class="tab-item is-active" role="tab" aria-selected="true">Beiträge</span>
  <a class="tab-item" role="tab" aria-selected="false" href="/stream">Strom</a>
</div>

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
    bar: { title: 'Einstellungen', back: '/' },
    body: `
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
      <p class="tight">
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
    bar: { title: 'Moderation', back: '/' },
    body: `
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

export function formPage({ viewer, prefs, title, intro, action, fields, submitLabel, error, footer = '', back = null }) {
  return layout({
    title,
    viewer,
    prefs,
    bar: { title, back },
    body: `
${intro ? `<p class="muted lede">${escapeHtml(intro)}</p>` : ''}
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
    bar: { title: `Fehler ${status}`, back: '/' },
    body: `<p class="notice">${escapeHtml(message)}</p><p><a href="/">Zurück zum Start</a></p>`,
  });
}

/* ============================================================ Kreise */

const kindChip = (circle) => {
  const cls = circle.kind === 'panel' ? 'chip forum' : circle.kind === 'local' ? 'chip blue' : 'chip';
  return `<span class="${cls}"><span class="dot"></span>${escapeHtml(KIND_LABELS[circle.kind] ?? circle.kind)}</span>`;
};

/** Presence: Menschen als Ringe, Gruppe vor Zahl. */
function faces(people, total) {
  const shown = people
    .slice(0, 3)
    .map((person) => `<span>${escapeHtml(initials(person))}</span>`)
    .join('');
  const rest = total - Math.min(people.length, 3);
  return `<span class="faces" aria-label="${total} ${total === 1 ? 'Mitglied' : 'Mitglieder'}">${shown}${
    rest > 0 ? `<span class="more">+${rest}</span>` : ''
  }</span>`;
}

/**
 * Eine Kachel. Statt eines Dauerbadges nur ein Punkt, wenn seit dem letzten
 * Öffnen etwas dazukam — und sonst schlicht, wann zuletzt geschrieben wurde.
 */
/* ============================================================ Himmel */

/**
 * Eine Wolke. Sie zeigt von sich aus Namen und Zustand; sobald der Zeiger oder
 * der Tastaturfokus sie erreicht, klappt die Vorschau auf — ohne Klick. Der
 * Klick ist erst nötig, wenn man wirklich hinein will.
 */
function cloud(entry, index, viewerCircles) {
  const { circle, near } = entry;
  const fresh = Number(circle.fresh_count ?? 0);
  const members = Number(circle.member_count ?? 0);
  const isMember = viewerCircles.has(circle.id);
  const href = `/c/${encodeURIComponent(circle.slug)}`;

  const state = fresh > 0
    ? `<span class="fresh">${fresh} neu</span>`
    : circle.last_post_at
      ? `<span class="when">${timeTag(circle.last_post_at)}</span>`
      : '<span class="when">noch still</span>';

  // Für Mitglieder führt ein zweiter Weg direkt ins Schreibfeld, für alle
  // anderen ins Beitreten — beides ein Klick, nicht drei.
  //
  // Die Wolke ist deshalb kein <a>: ein Link im Link ist ungültiges HTML, und
  // der Browser hebt die inneren Links dann aus dem Element heraus. Stattdessen
  // deckt der Namenslink über ::after die ganze Wolke ab, und die Aktion liegt
  // als eigener Link darüber.
  const action = isMember
    ? `<span class="act"><a class="over" href="${href}?write=1">Etwas schreiben</a></span>`
    : circle.joining === 'invite'
      ? '<span class="act muted">Nur auf Einladung</span>'
      : `<span class="act"><a class="over" href="${href}">Reinschauen und beitreten</a></span>`;

  return `<div class="cloud${near ? '' : ' far'}${circle.kind === 'private' ? ' closed' : ''}" id="cloud-${index}">
  <span class="orb" aria-hidden="true"><span class="body"></span></span>
  <span class="tag">
    <a class="name" href="${href}">${escapeHtml(circle.name)}</a>
    <span class="line">${escapeHtml(KIND_LABELS[circle.kind] ?? circle.kind)} · ${members} ${
      members === 1 ? 'Mitglied' : 'Mitglieder'
    }</span>
    ${state}
    <span class="peek"><span class="peek-inner">
      ${circle.purpose ? `<span class="purpose">${escapeHtml(circle.purpose)}</span>` : ''}
      ${circle.last_post_content
        ? `<span class="quote"><strong>${escapeHtml(circle.last_post_author)}:</strong> ${escapeHtml(
            circle.last_post_content.length > 100
              ? `${circle.last_post_content.slice(0, 100).trimEnd()}…`
              : circle.last_post_content,
          )}</span>`
        : ''}
      ${action}
    </span></span>
  </span>
</div>`;
}

export function skyPage({ viewer, prefs, near, far, nonce }) {
  const { clouds, css } = layoutSky(near, far);
  const mine = new Set(near.map((circle) => circle.id));

  // Derselbe Bestand noch einmal als schlichte Liste — für Tastatur, Screenreader
  // und für alle, denen eine Fläche zum Schieben gerade zu viel ist.
  const list = [...near, ...far]
    .map(
      (circle) => `<li><a href="/c/${encodeURIComponent(circle.slug)}">${escapeHtml(circle.name)}</a>
        <span class="muted small">${escapeHtml(KIND_LABELS[circle.kind] ?? circle.kind)} ·
        ${Number(circle.member_count ?? 0)} Mitglieder${
          Number(circle.fresh_count ?? 0) > 0 ? ` · ${circle.fresh_count} neu` : ''
        }</span></li>`,
    )
    .join('');

  return layout({
    title: 'Himmel',
    viewer,
    prefs,
    current: 'sky',
    bar: { title: 'Dein Himmel' },
    head: `<style nonce="${escapeHtml(nonce)}">${css}</style>`,
    body: `
<div class="sky-intro">
  <p class="muted">Schieb ihn hin und her. Innen liegen deine Kreise, weiter außen
  welche, die du noch nicht kennst.</p>
</div>
<div class="sky" tabindex="0" role="region" aria-label="Kreise als Fläche — mit Finger, Trackpad oder Pfeiltasten verschiebbar">
  <div class="field">
    ${clouds.map((entry, i) => cloud(entry, i, mine)).join('')}
  </div>
</div>
<details class="sky-list">
  <summary>Alle Kreise als Liste</summary>
  <ul>${list}</ul>
</details>`,
  });
}

/**
 * Eine Kachel. Die Kugel oben ist dieselbe wie im Himmel, nur in Kachelgröße —
 * ein Kreis sieht überall gleich aus, sonst muss man ihn zweimal lernen.
 */
export function circleTile(circle, { hero = false, index = 0 } = {}) {
  const fresh = Number(circle.fresh_count ?? 0);
  const members = Number(circle.member_count ?? 0);

  const status = fresh > 0
    ? `<span class="fresh">${fresh} neu</span>`
    : circle.last_post_at
      ? `<span class="sub">${timeTag(circle.last_post_at)}</span>`
      : '<span class="sub">noch still</span>';

  return `<a class="tile${hero ? ' hero' : ''}${circle.kind === 'private' ? ' closed' : ''}"
   href="/c/${encodeURIComponent(circle.slug)}">
  <span class="kind">${escapeHtml(KIND_LABELS[circle.kind] ?? circle.kind)}</span>
  <span class="tile-orb">${orbHtml(`orb-${index}`)}</span>
  <span class="tile-text">
    <span class="label">${escapeHtml(circle.name)}</span>
    ${hero && circle.purpose ? `<span class="why">${escapeHtml(circle.purpose)}</span>` : ''}
    ${hero && circle.last_post_content
      ? `<span class="preview"><strong>${escapeHtml(circle.last_post_author)}:</strong> ${escapeHtml(
          circle.last_post_content.length > 110
            ? `${circle.last_post_content.slice(0, 110).trimEnd()}…`
            : circle.last_post_content,
        )}</span>`
      : ''}
  </span>
  <span class="foot-line">
    <span class="sub">${members} ${members === 1 ? 'Mitglied' : 'Mitglieder'}</span>
    ${status}
  </span>
</a>`;
}

/**
 * Ein Kachelraster mit den zugehörigen Kugelfarben.
 * Die erste Kachel darf groß sein, wenn sie etwas zu zeigen hat.
 * @returns {{html: string, css: string}}
 */
export function tileGrid(circles, { heroFirst = false, offset = 0 } = {}) {
  const html = circles
    .map((circle, i) => circleTile(circle, { index: offset + i, hero: heroFirst && i === 0 }))
    .join('');
  const css = circles.map((circle, i) => orbCss(circle, `orb-${offset + i}`)).join('\n');
  return { html: `<div class="cluster">${html}</div>`, css };
}

export function discoverPage({ viewer, prefs, query, results, nonce }) {
  // Wenn der erste Treffer etwas zu zeigen hat, bekommt er die große Kachel.
  const grid = tileGrid(results, { heroFirst: Boolean(results[0]?.last_post_content) });

  const list = results.length
    ? grid.html
    : query
      ? `<p class="card">Nichts gefunden für „${escapeHtml(query)}“. Vielleicht ist es Zeit, diesen Kreis zu öffnen.</p>`
      : '<p class="card">Noch keine offenen Kreise. Öffne den ersten.</p>';

  return layout({
    title: 'Kreise finden',
    viewer,
    prefs,
    current: 'discover',
    bar: { title: 'Kreise finden' },
    head: `<style nonce="${escapeHtml(nonce)}">${grid.css}</style>`,
    body: `
<form method="get" action="/discover" role="search" class="card search-card">
  <label for="q">Wonach suchst du?</label>
  <input type="text" id="q" name="q" value="${escapeHtml(query ?? '')}" placeholder="Schule, Leipzig, Gaming …">
  <div class="actions-row">
    <button type="submit">Suchen</button>
    <a class="button secondary" href="/circles/new">Kreis öffnen</a>
  </div>
  <p class="hint">Durchsucht Namen und Zweck offener Kreise. Private Kreise erscheinen hier nie.</p>
</form>
<h2>${query ? `Treffer für „${escapeHtml(query)}“` : 'Kreise zum Beitreten'}</h2>
${list}`,
  });
}

export function composePage({ viewer, prefs, circles, nonce }) {
  const grid = tileGrid(circles);

  return layout({
    title: 'Neuer Beitrag',
    viewer,
    prefs,
    bar: { title: 'Wo willst du das sagen?', back: '/' },
    head: `<style nonce="${escapeHtml(nonce)}">${grid.css}</style>`,
    body: `
<p class="muted lede">Bei lamb schreibt man immer in einen bestimmten Kreis. Deshalb steht
diese Frage vor dem Textfeld und nicht danach — du weißt, wer mitliest, bevor du anfängst.</p>
${circles.length ? grid.html : '<p class="card">Du bist noch in keinem Kreis.</p>'}
<h2>Oder öffentlich unter deinem Namen</h2>
<div class="card">
  <p>Ein Beitrag auf deinem Profil ist für alle sichtbar, die dir folgen — auch auf anderen
  Servern.</p>
  <p><a class="button secondary" href="/stream">Auf dem Profil schreiben</a></p>
</div>`,
  });
}

export function circlePage({ viewer, prefs, circle, isMember, isModerator, posts, nextCursor, people, memberCount, pending, error, writeOpen = false }) {
  const joinControl = viewer && !isMember
    ? circle.joining === 'invite'
      ? '<p class="notice">Dieser Kreis ist nur auf Einladung offen.</p>'
      : `<form method="post" action="/c/${escapeHtml(circle.slug)}/join">
           <button type="submit">${circle.joining === 'open' ? 'Beitreten' : 'Beitritt anfragen'}</button>
         </form>`
    : '';

  const leaveControl = isMember
    ? `<form method="post" action="/c/${escapeHtml(circle.slug)}/leave">
         <button class="quiet" type="submit">Verlassen</button>
       </form>`
    : '';

  const requests = isModerator && pending.length
    ? `<h2>Beitrittsanfragen</h2>
       <div class="card">${pending
         .map(
           (person) => `<form class="request-row" method="post" action="/c/${escapeHtml(circle.slug)}/admit">
             <input type="hidden" name="account_id" value="${person.id}">
             <span>${escapeHtml(person.display_name || person.username)}</span>
             <button class="secondary" type="submit">Aufnehmen</button>
           </form>`,
         )
         .join('')}</div>`
    : '';

  const list = posts.length
    ? posts.map((p) => postArticle(p, p.view)).join('')
    : '<p class="card">Noch nichts geschrieben. Fang an.</p>';

  const pager = nextCursor
    ? `<p class="pager"><a class="button secondary" href="/c/${escapeHtml(circle.slug)}?before=${encodeURIComponent(nextCursor)}">Ältere Beiträge zeigen</a></p>`
    : `<p class="pager end">Das war alles. Es lädt nichts von allein nach.</p>`;

  const privacyLine = {
    private: 'Privater Kreis. Nur Mitglieder lesen mit, und nichts davon verlässt diesen Server.',
    topic: 'Offener Themenkreis. Beiträge sind öffentlich und erreichen auch andere Server.',
    local: 'Lokaler Kreis. Beiträge sind öffentlich und erreichen auch andere Server.',
    panel: 'Youth Panel. Moderierte Debatte mit festem Ablauf; das Ergebnis wird veröffentlicht.',
  }[circle.kind];

  // Das Schreibfeld ist eingeklappt, damit der Kreis mit dem beginnt, was
  // andere gesagt haben — nicht mit einem leeren Feld, das zum Senden auffordert.
  // <details> kann das nativ; es braucht dafür kein JavaScript.
  const composeBlock = isMember
    ? `<details class="compose-slot"${error || writeOpen ? ' open' : ''}>
         <summary>Etwas in diesen Kreis schreiben</summary>
         ${composer({ prefs, error, action: `/c/${encodeURIComponent(circle.slug)}/posts` })}
       </details>`
    : '';

  return layout({
    title: circle.name,
    viewer,
    prefs,
    bar: { title: circle.name, back: '/' },
    body: `
<div class="circle-head">
  ${circleSigil(circle, { size: 60, id: 'head' })}
  <div class="circle-head-text">
    <p class="meta small mono">${escapeHtml(KIND_LABELS[circle.kind] ?? circle.kind)}${
      circle.place ? ` · ${escapeHtml(circle.place)}` : ''
    } · ${memberCount} ${memberCount === 1 ? 'Mitglied' : 'Mitglieder'}</p>
    ${circle.purpose ? `<p>${escapeHtml(circle.purpose)}</p>` : ''}
    <p class="meta small">${escapeHtml(privacyLine)}</p>
    <div class="circle-actions">
      ${faces(people, memberCount)}
      ${joinControl}
      ${leaveControl}
    </div>
  </div>
</div>
${requests}
${composeBlock}
<h2>Beiträge</h2>
${list}
${pager}`,
  });
}

export function newCirclePage({ viewer, prefs, error }) {
  return layout({
    title: 'Kreis öffnen',
    viewer,
    prefs,
    bar: { title: 'Kreis öffnen', back: '/discover' },
    body: `
<p class="muted">Du moderierst den Kreis, den du öffnest. Moderation ist bei lamb immer benannt.</p>
${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
<form class="card" method="post" action="/circles">
  <label for="name">Name</label>
  <input type="text" id="name" name="name" maxlength="60" required>
  <label for="purpose">Wofür ist dieser Kreis?</label>
  <input type="text" id="purpose" name="purpose" maxlength="280">
  <p class="hint">Ein Satz. Steht auf der Karte, damit Leute wissen, worauf sie sich einlassen.</p>
  <fieldset class="spaced">
    <legend>Art</legend>
    <label class="inline"><input type="radio" name="kind" value="private" checked>
      <span>Privater Kreis<span class="hint">Freund:innen oder Familie. Nur Mitglieder lesen mit, nichts verlässt diesen Server, Beitritt nur auf Einladung.</span></span></label>
    <label class="inline"><input type="radio" name="kind" value="topic">
      <span>Themenkreis<span class="hint">Öffentlich lesbar und über ActivityPub erreichbar.</span></span></label>
    <label class="inline"><input type="radio" name="kind" value="local">
      <span>Lokaler Kreis<span class="hint">An einen Ort gebunden, sonst wie ein Themenkreis.</span></span></label>
  </fieldset>
  <label for="place">Ort (nur bei lokalen Kreisen)</label>
  <input type="text" id="place" name="place" maxlength="60">
  <label for="joining">Beitritt</label>
  <select id="joining" name="joining">
    <option value="open">Offen für alle</option>
    <option value="request">Auf Anfrage</option>
  </select>
  <p class="hint">Private Kreise sind immer auf Einladung — sonst wären sie nicht privat.</p>
  <p><button type="submit">Kreis öffnen</button></p>
</form>`,
  });
}
