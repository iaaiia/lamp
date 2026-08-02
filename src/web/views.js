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
import { orbCss, orbHtml, personOrbCss } from './orb.js';
import {
  iconSearch,
  iconSettings,
  iconShield,
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

export function layout({
  title, viewer, body, prefs, current = null, head = '', bar = null, stage = false, writebar = null,
  schreiben = null,
}) {
  const p = prefs ?? preferencesOf(viewer);
  const classes = [
    p.reducedMotion ? 'reduced-motion' : '',
    p.lowStimulus ? 'low-stimulus' : '',
    p.plainLanguage ? 'plain-language' : '',
  ].filter(Boolean).join(' ');

  /**
   * Die Kopfzeile schwebt über dem Inhalt statt ihn nach unten zu schieben:
   * eine Kapsel aus Milchglas, unter der die Kugeln durchziehen. Links das
   * Zeichen, in der Mitte, wo man ist, rechts zwei Handlungen.
   *
   * Auf dem Weg bleibt die Mitte leer: welche Rubrik gerade dran ist, sagt der
   * Kopf der Bahn — er wandert mit ihr, und damit sagt es die Fläche selbst
   * statt der Server.
   */
  const appbar = bar?.eigene ? '' : `<header class="appbar glas">
     <div class="slot left">${
       viewer
         ? `<a class="brandmark" href="/" aria-label="Startseite">${logo}<span>${escapeHtml(config.instanceName)}</span></a>`
         : `<span class="brandmark">${logo}<span>${escapeHtml(config.instanceName)}</span></span>`
     }</div>
     <h1 class="appbar-title">${escapeHtml(bar?.title ?? title)}</h1>
     <div class="slot right">${
       viewer
         ? `<a class="icon-btn" href="/settings" aria-label="Einstellungen"${
             current === 'settings' ? ' aria-current="page"' : ''
           }>${iconSettings()}</a>`
         : ''
     }</div>
   </header>`;

  /**
   * Unten liegt genau eine feste Leiste: das Schreibfeld. Es fragt nicht mehr,
   * wohin — es schreibt dorthin, wo man gerade steht: in den Kreis, in dem man
   * ist, unter den Beitrag, den man geöffnet hat, sonst öffentlich unter
   * eigenem Namen. Wohin es geht, steht im Feld; gefragt wird nicht mehr.
   *
   * Die Zusicherung aus D16 bleibt damit erhalten — wer schreibt, weiß, wer
   * mitliest —, nur wird sie jetzt gesagt statt erfragt.
   */
  const writeBar = !viewer
    ? ''
    : writebar ?? (schreiben
      ? `<div class="writebar">
           <details class="chat-compose"${schreiben.offen ? ' open' : ''}>
             <summary>${escapeHtml(schreiben.label)}</summary>
             ${composer({ prefs: p, error: schreiben.error, action: schreiben.action, replyTo: schreiben.replyTo })}
           </details>
           <a class="icon-btn" href="/discover" aria-label="Kreise suchen">${iconSearch()}</a>
         </div>`
      : '');

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)} — ${escapeHtml(config.instanceName)}</title>
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/activity+json" href="${config.origin}">
${head}
</head>
<body class="${classes}${viewer ? ' has-writebar' : ''}${stage ? ' on-stage' : ''}">
<a class="skip-link" href="#main">Zum Inhalt springen</a>
${appbar}
<main id="main" tabindex="-1">
${body}
</main>
${writeBar}
${viewer ? '' : `<footer class="site">
  <div class="inner">
    <p>${escapeHtml(config.instanceName)} läuft auf ActivityPub. Dein Konto, deine Beiträge und
    deine Kontakte kannst du jederzeit <a href="/settings/export">mitnehmen</a> — auf einen
    anderen Server, ohne deinen Kreis zu verlieren.</p>
    <p>Keine Werbeprofile. Keine Rangliste. Kein Nachladen beim Scrollen.</p>
  </div>
</footer>`}
</body>
</html>`;
}

/** Eine Beitragskarte für Listen — Hülle plus Inhalt. */
export function postArticle(post, view) {
  return `<article class="post">${postArticleInner(post, view)}</article>`;
}

/**
 * Der Inhalt einer Beitragskarte, ohne die Hülle — damit die Kreisseite die
 * Karte selbst setzen und die Kommentare mit hineinnehmen kann.
 */
function postArticleInner(post, { viewer, showMetrics, supportSentence, supported, replyCount, canReply, replyReason }) {
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
    : '<span class="support-note">Rückhalt bleibt im Kreis</span>';

  const supportButton = viewer
    ? `<form method="post" action="/posts/${post.id}/support">
         <button class="support" type="submit" aria-pressed="${supported ? 'true' : 'false'}">
           ${supportArc}${supported ? 'Du stehst dahinter' : 'Support geben'}
         </button>
       </form>`
    : '';

  // Rückhalt soll in Zuwendung münden, nicht im Klick enden.
  const followUp = supported && post.content_warning && canReply
    ? `<div class="notice ember small">
         <strong>Du stehst hinter ${escapeHtml(post.display_name || post.username)}.</strong>
         Willst du auch etwas schreiben? <a href="/posts/${post.id}#reply">Antworten</a>
       </div>`
    : '';

  // Eine Aktion, nicht zwei, die am selben Ort landen.
  const replyControl = !viewer || canReply
    ? `<a href="/posts/${post.id}" class="small">${
        replyCount === 0 ? 'Mitreden' : `${replyCount} ${replyCount === 1 ? 'Antwort' : 'Antworten'}`
      }</a>`
    : `<span class="meta small">${escapeHtml(replyReason ?? 'Antworten sind hier eingeschränkt.')}</span>`;

  return `
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
  ${followUp}`;
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

export function threadPage({ viewer, prefs, post, replies, replyState, error }) {
  return layout({
    title: 'Beitrag',
    viewer,
    prefs,
    bar: { title: 'Beitrag' },
    // Wer einen Beitrag offen hat, schreibt darunter — die Leiste antwortet.
    schreiben: viewer && replyState.allowed
      ? {
        action: `/posts/${post.id}/reply`,
        replyTo: post.id,
        label: `Antworten an ${post.display_name || post.username} …`,
        error,
        offen: Boolean(error),
      }
      : null,
    body: `
${postArticle(post, post.view)}
<h2>Antworten</h2>
${replies.length ? replies.map((r) => postArticle(r, r.view)).join('') : '<p class="card">Noch keine Antworten.</p>'}
${
  viewer
    ? replyState.allowed ? '' : `<p class="notice" id="reply">${escapeHtml(replyState.reason)}</p>`
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
    ? ''
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
  <fieldset id="sortierung">
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
    bar: { title: 'Kreise finden', back: viewer ? '/' : null },
    // Dieselbe Welt wie auf der Startseite: Wer sucht, fällt nicht in ein
    // anderes Produkt.
    stage: true,
    head: `<style nonce="${escapeHtml(nonce)}">${grid.css}</style>`,
    body: `
<form method="get" action="/discover" role="search" class="stage-search find">
  <label for="q" class="visually-hidden">Kreis suchen</label>
  <input type="text" id="q" name="q" value="${escapeHtml(query ?? '')}" placeholder="Wonach suchst du?" autocomplete="off">
  <button type="submit">Suchen</button>
</form>
<h2 class="on-sky">${query ? `Treffer für „${escapeHtml(query)}“` : 'Kreise zum Beitreten'}</h2>
${list}
<p class="stage-hint centered">Nichts dabei? <a href="${viewer ? '/circles/new' : '/register'}">${
      viewer ? 'Eigenen Kreis öffnen' : 'Konto anlegen und selbst einen öffnen'
    }</a></p>`,
  });
}

/**
 * Eine Nachricht im Gespräch ist eine Kugel mit Text daneben — und die Kugel
 * ist das interaktive Stück: sie öffnet, wer da spricht, wer dahintersteht und
 * wie man antwortet. Die Kugeln liegen nicht in einer Flucht, sondern versetzt
 * und unterschiedlich groß; die Versetzung kommt aus dem Beitrag selbst, ist
 * also zufällig anzusehen und trotzdem jedes Mal dieselbe.
 *
 * Aufklappen ist ein <details> — kein Skript, wie überall sonst auch.
 */
function chatMessage(post, replies, viewer, orbId) {
  const v = post.view;
  const name = post.display_name || post.username;

  const support = v.showMetrics && v.supportSentence
    ? `<p class="orb-note">${escapeHtml(v.supportSentence)}</p>`
    : '<p class="orb-note">Rückhalt bleibt im Kreis</p>';

  const supportButton = viewer
    ? `<form method="post" action="/posts/${post.id}/support">
         <button class="support tiny" type="submit" aria-pressed="${v.supported ? 'true' : 'false'}">
           ${supportArc}<span>${v.supported ? 'Du stehst dahinter' : 'Support'}</span>
         </button>
       </form>`
    : '';

  const body = post.content_warning
    ? `<details><summary>Inhaltshinweis: ${escapeHtml(post.content_warning)}</summary>
         <p class="bubble-text">${escapeHtml(post.content)}</p></details>`
    : `<p class="bubble-text">${escapeHtml(post.content)}</p>`;

  const antworten = replies
    .map(
      (r) => `<div class="reply-line">
    <span class="faces" aria-hidden="true"><span>${escapeHtml(initials(r))}</span></span>
    <p><strong>${escapeHtml(r.display_name || r.username)}</strong>
      <span class="bubble-time">${timeTag(r.created_at)}</span><br>${escapeHtml(r.content)}</p>
  </div>`,
    )
    .join('');

  return `<div class="msg" id="m${post.id}">
  <details class="orb-pop">
    <summary class="msg-orb" aria-label="Was zu dieser Nachricht gehört: ${escapeHtml(name)}, Rückhalt, Antworten">
      ${orbHtml(orbId)}
    </summary>
    <div class="orb-panel">
      <a class="orb-person" href="/@${escapeHtml(post.username)}">
        <span class="faces"><span>${escapeHtml(initials(post))}</span></span>
        <span><strong>${escapeHtml(name)}</strong><span class="p-meta mono">${escapeHtml(handleOf(post))}</span></span>
      </a>
      ${support}
      <div class="orb-actions">
        ${supportButton}
        <a class="button secondary small" href="/posts/${post.id}">${
          v.replyCount === 0 ? 'Antworten' : `${v.replyCount} ${v.replyCount === 1 ? 'Antwort' : 'Antworten'}`
        }</a>
      </div>
    </div>
  </details>
  <div class="bubble">
    <p class="bubble-head">
      <a href="/@${escapeHtml(post.username)}">${escapeHtml(name)}</a>
      <span class="bubble-time">${timeTag(post.created_at)}</span>
    </p>
    ${body}
    ${antworten ? `<div class="replies">${antworten}</div>` : ''}
  </div>
</div>`;
}

/**
 * Eine Zeile im Inhaltsfenster: Kugel links, Text rechts. Dasselbe Bild wie im
 * Gespräch — in jeder Ansicht trägt die Kugel etwas, keine liegt zur Zierde da.
 */
function orbRow(href, orbId, titel, meta, notiz = '') {
  return `<a class="orb-row" href="${href}">
  <span class="orb-row-mark">${orbHtml(orbId)}</span>
  <span class="orb-row-text">
    <strong>${titel}</strong>
    <span class="p-meta mono">${meta}</span>
    ${notiz ? `<span class="orb-row-note">${notiz}</span>` : ''}
  </span>
</a>`;
}

/**
 * Der Weg: vier Rubriken, die der Person gehören. Die Reihenfolge ist die
 * These — man findet Menschen, redet mit ihnen, merkt dabei, wofür man
 * einsteht, und aus manchem davon wird ein geschützter Ort.
 *
 * Gespräch und Themen haben dieselbe Form und unterscheiden sich nur in der
 * Handlung: Kommentar dort, Support hier.
 */
const WEG = [
  ['leute', 'Leute', 1, 'Wem du folgst — und was diese Menschen schreiben.'],
  ['gespraech', 'Gespräch', 2, 'Was du kommentiert hast — und was jemand bei dir kommentiert hat.'],
  ['themen', 'Themen', 3, 'Wofür du eingestanden bist — und wofür jemand bei dir eingestanden ist.'],
  ['rueckhalt', 'Rückhalt', 4, 'Die geschützten Räume, die daraus geworden sind. Nur ihr zwei.'],
];
const WEG_LABEL = Object.fromEntries(WEG.map(([id, label]) => [id, label]));
const WEG_TIEFE = Object.fromEntries(WEG.map(([id, , stufe]) => [id, stufe]));
const WEG_SATZ = Object.fromEntries(WEG.map(([id, , , satz]) => [id, satz]));

/**
 * Die Startseite ist der Weg — und der Weg gehört der Person, nicht einem Raum.
 *
 *   Leute     wem ich folge; darunter, was diese Menschen geschrieben haben
 *   Gespräch  worauf ich reagiert und worauf ich geantwortet habe
 *   Themen    wo sich das häuft: die Räume, in die ich zurückgehe
 *   Rückhalt  die geschützten Räume, die daraus geworden sind
 *
 * Dieselbe Bildsprache wie überall: eine Kugel je Sache, Text daneben, und nach
 * rechts wird es dichter.
 */
export function homePage({
  viewer, prefs, leute = [], feed = [], spur = [], themen = [], raeume = [], moeglich = [],
  sortierung = null, nonce = '',
}) {
  /**
   * Alle vier Bahnen liegen nebeneinander in einer Fläche, die einrastet: man
   * wischt seitlich, und die Rubrik wechselt. Kein Skript — `scroll-snap`
   * macht das Wischen, `#anker` macht dasselbe für Tastatur und Screenreader,
   * und ohne beides bleibt es eine Seite, auf der alles vorhanden ist.
   */
  /**
   * Die Leiste gehört zur Bahn, nicht zur Seite: Zeichen, die vier Wörter, zwei
   * Knöpfe. Weil jede Bahn ihre eigene mitbringt, steht in ihr immer das
   * richtige Wort kräftig — beim Wischen wandert die Leiste mit, und weil
   * Zeichen und Knöpfe in allen vier gleich aussehen, wirkt es wie eine einzige
   * Leiste, in der sich nur die Betonung verschiebt. Genau das ist der Trick,
   * mit dem die Betonung dem Finger folgt, ohne dass ein Skript zusieht.
   *
   * Für Tastatur und Screenreader gibt es Zeichen und Knöpfe genau einmal; in
   * den übrigen drei Bahnen sind sie Dekoration und entsprechend ausgezeichnet.
   */
  const leiste = (aktiv, erste) => {
    const still = erste ? '' : ' aria-hidden="true" tabindex="-1"';
    return `<header class="topbar glas">
    <a class="mark${erste ? '' : ' schatten'}" href="/"${erste ? ' aria-label="Startseite"' : still}>${logo}</a>
    <nav class="pfad" aria-label="Rubrik wechseln">
      ${WEG.map(([id, label]) => `<a class="pfad-wort${id === aktiv ? ' ist-hier' : ''}" href="#${id}"${
        id === aktiv ? ' aria-current="true"' : ''
      }>${label}</a>`).join('')}
    </nav>
    <a class="icon-btn rund${erste ? '' : ' schatten'}" href="/settings"${erste ? ' aria-label="Einstellungen"' : still}>${iconSettings()}</a>
  </header>`;
  };

  const bahn = (id, titel, satz, inhalt, stufe, erste) => `
<section class="bahn tiefe-${stufe}" id="${id}" aria-label="${escapeHtml(titel)}" tabindex="-1">
  ${leiste(id, erste)}
  <div class="bahn-inhalt">
    <p class="bahn-satz">${escapeHtml(satz)}</p>
    ${inhalt}
  </div>
</section>`;

  const leuteAnsicht = `
${leute.length
    ? `<div class="orb-list menschen">${leute
        .map((person, i) => orbRow(
          `/@${escapeHtml(person.username)}`,
          `leuteorb-${i}`,
          escapeHtml(person.display_name || person.username),
          escapeHtml(handleOf(person)),
        ))
        .join('')}</div>`
    : `<p class="chat-start">Du folgst noch niemandem. <a href="/discover">Such jemanden</a>.</p>`}
${feed.length
    ? `<p class="bahn-zwischen">Was sie schreiben</p>
       <p class="feed-satz"><strong>${escapeHtml(sortierung?.name ?? '')}.</strong> ${escapeHtml(sortierung?.explanation ?? '')}
       <a href="/settings#sortierung">ändern</a></p>${feed
        .map((post, i) => chatMessage(post, [], viewer, `feedorb-${i}`))
        .join('')}`
    : ''}`;

  /**
   * Gespräch und Themen sind dieselbe Liste in zwei Achsen: dort Kommentare,
   * hier Support — und beide zeigen beide Richtungen. Die Zeile darunter sagt
   * jedes Mal, welche der beiden Richtungen dieser Eintrag ist.
   */
  const spurListe = (eintraege, praefix, hin, her, leer) => (eintraege.length
    ? `<div class="orb-list">${eintraege
        .map((eintrag, i) => orbRow(
          `/posts/${eintrag.id}`,
          `${praefix}-${i}`,
          escapeHtml(eintrag.content.length > 110 ? `${eintrag.content.slice(0, 110).trimEnd()}…` : eintrag.content),
          `${eintrag.art === 'meine' ? hin : her} · ${escapeHtml(
            eintrag.display_name || eintrag.username,
          )} · ${timeTag(eintrag.wann)}`,
        ))
        .join('')}</div>`
    : `<p class="chat-start">${leer}</p>`);

  const tueren = moeglich.length
    ? `<div class="orb-list rueckhalt">${moeglich
        .map((person, i) => `<div class="orb-row raum-row">
    <span class="orb-row-mark">${orbHtml(`tuerorb-${i}`)}</span>
    <span class="orb-row-text">
      <strong>${escapeHtml(person.display_name || person.username)}</strong>
      <span class="p-meta mono">Ihr steht beide hintereinander · ${escapeHtml(person.circle_name)}</span>
    </span>
    <form method="post" action="/c/${escapeHtml(person.circle_slug)}/rueckhalt">
      <input type="hidden" name="account_id" value="${person.id}">
      <button class="support tiny" type="submit">${supportArc}<span>Raum öffnen</span></button>
    </form>
  </div>`).join('')}</div>`
    : '';

  const rueckhaltAnsicht = raeume.length || moeglich.length
    ? `${tueren}${raeume.length ? `<div class="orb-list">${raeume
        .map((raum, i) => orbRow(
          `/c/${escapeHtml(raum.slug)}`,
          `raumorb-${i}`,
          escapeHtml(raum.gegenueber_name || raum.gegenueber || 'Rückhalt'),
          raum.zuletzt ? `${escapeHtml(raum.letztes.slice(0, 60))}${raum.letztes.length > 60 ? '…' : ''} · ${timeTag(raum.zuletzt)}` : 'Noch nichts gesagt',
        ))
        .join('')}</div>` : ''}`
    : `<p class="chat-start">Noch kein Rückhalt-Raum. Er entsteht, sobald ihr beide in einem Kreis
       hinter etwas vom anderen steht — dann steht die Tür hier.</p>`;

  const bahnen = {
    leute: leuteAnsicht,
    gespraech: spurListe(spur, 'gsporb', 'Du hast kommentiert', 'hat bei dir kommentiert',
      'Noch keine Gespräche. Sie entstehen, sobald du irgendwo antwortest — oder jemand bei dir.'),
    themen: spurListe(themen, 'themaorb', 'Du stehst dahinter', 'steht hinter deinem Beitrag',
      'Noch keine Themen. Sie entstehen, sobald du Support gibst — oder jemand dir.'),
    rueckhalt: rueckhaltAnsicht,
  };

  // Alle Kugeln aller Bahnen — jede Bahn hat ihr eigenes Präfix, damit sich
  // nichts überschreibt, wenn alle vier gleichzeitig auf der Seite liegen.
  const kugeln = [
    ...leute.map((p, i) => personOrbCss(`${p.username}${p.domain ?? ''}`, `l${p.id}`, `leuteorb-${i}`, i)),
    ...feed.map((p, i) => personOrbCss(`${p.username}${p.domain ?? ''}`, String(p.id), `feedorb-${i}`, i)),
    ...spur.map((e, i) => personOrbCss(`${e.username}${e.domain ?? ''}`, `${e.art}${e.id}`, `gsporb-${i}`, i)),
    ...themen.map((e, i) => personOrbCss(`${e.username}${e.domain ?? ''}`, `${e.art}${e.id}`, `themaorb-${i}`, i)),
    ...moeglich.map((m, i) => personOrbCss(`${m.username}${m.domain ?? ''}`, `t${m.id}`, `tuerorb-${i}`, i)),
    ...raeume.map((r, i) => personOrbCss(String(r.gegenueber ?? r.slug), String(r.id), `raumorb-${i}`, i)),
  ];

  return layout({
    title: 'Dein Weg',
    viewer,
    prefs,
    current: 'weg',
    bar: { eigene: true },
    // Auf dem Weg gibt es keinen Raum, in den man schreiben könnte — also
    // schreibt man unter eigenem Namen, für alle.
    schreiben: {
      action: '/posts',
      label: `Etwas sagen … ${viewer?.is_minor ? 'an deine Leute' : 'für alle'}`,
    },
    stage: true,
    head: `<style nonce="${escapeHtml(nonce)}">${kugeln.join('')}</style>`,
    body: `
<h1 class="visually-hidden">Dein Weg</h1>
<div class="weg" role="group" aria-label="Dein Weg: seitlich wischen">
${WEG.map(([id, label, stufe, satz], i) => bahn(id, label, satz, bahnen[id], stufe, i === 0)).join('')}
</div>`,
  });
}

export function circlePage({
  viewer, prefs, circle, isMember, isModerator, posts, nextCursor, people, memberCount,
  pending, error, writeOpen = false, nonce = '',
}) {

  const joinControl = viewer && !isMember
    ? circle.joining === 'invite'
      ? '<p class="stage-hint">Nur auf Einladung.</p>'
      : `<form method="post" action="/c/${escapeHtml(circle.slug)}/join">
           <button type="submit">${circle.joining === 'open' ? 'Beitreten' : 'Beitritt anfragen'}</button>
         </form>`
    : '';

  const leaveControl = isMember
    ? `<form method="post" action="/c/${escapeHtml(circle.slug)}/leave">
         <button class="secondary" type="submit">Verlassen</button>
       </form>`
    : '';

  const requests = isModerator && pending.length
    ? `<section class="card">
         <h3 class="flush">Beitrittsanfragen</h3>
         ${pending
           .map(
             (person) => `<form class="request-row" method="post" action="/c/${escapeHtml(circle.slug)}/admit">
               <input type="hidden" name="account_id" value="${person.id}">
               <span>${escapeHtml(person.display_name || person.username)}</span>
               <button class="secondary" type="submit">Aufnehmen</button>
             </form>`,
           )
           .join('')}
       </section>`
    : '';

  /* --------------------------------------------------------- die Ansichten */

  const gespraech = `
${nextCursor
    ? `<p class="pager top"><a class="button secondary" href="/c/${escapeHtml(circle.slug)}?before=${encodeURIComponent(nextCursor)}">Ältere Nachrichten zeigen</a></p>`
    : '<p class="chat-start">Hier beginnt das Gespräch.</p>'}
${posts.length
    ? posts.map((p, i) => chatMessage(p, p.replies ?? [], viewer, `msgorb-${i}`)).join('')
    : '<p class="chat-start">Noch nichts gesagt. Fang an.</p>'}`;


  const gastHinweis = !viewer
    ? `<p class="stage-hint">Mitlesen geht ohne Konto. Zum Mitreden und Support geben brauchst du eins —
       <a href="/register">anlegen</a> oder <a href="/login">anmelden</a>.</p>`
    : '';

  return layout({
    title: circle.name,
    viewer,
    prefs,
    bar: { title: circle.name },
    stage: true,
    schreiben: isMember
      ? {
        action: `/c/${encodeURIComponent(circle.slug)}/posts`,
        label: `Etwas sagen … in ${circle.name}`,
        error,
        offen: Boolean(error || writeOpen),
      }
      : null,
    // Nur Kugeln, die etwas tragen: eine je Nachricht. Deko-Kugeln gibt es
    // nicht mehr — sie standen vor den Inhalten und sagten nichts.
    head: `<style nonce="${escapeHtml(nonce)}">${posts
      .map((p, i) => personOrbCss(`${p.username}${p.domain ?? ''}`, String(p.id), `msgorb-${i}`, i))
      .join('')}</style>`,
    body: `
<header class="space-head">
  <p class="space-meta mono">${escapeHtml(KIND_LABELS[circle.kind] ?? circle.kind)}${
    circle.place ? ` · ${escapeHtml(circle.place)}` : ''
  } · ${memberCount} ${memberCount === 1 ? 'Mitglied' : 'Mitglieder'}</p>
  ${circle.purpose ? `<p class="space-purpose">${escapeHtml(circle.purpose)}</p>` : ''}
  <div class="space-actions">${faces(people, memberCount)}${joinControl}${leaveControl}</div>
  ${gastHinweis}
</header>

${requests}

<section class="chat-window is-chat tiefe-2" aria-label="Gespräch">
${gespraech}
</section>`,
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
