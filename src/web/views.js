/**
 * Server-rendered, script-free HTML.
 *
 * The whole product works without JavaScript. That is a deliberate
 * accessibility and safety property: nothing can autoplay, re-order under the
 * reader, or load more content than the user asked for, because there is no
 * client-side code to do it.
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

/** Relative time with an exact machine-readable value for screen readers. */
function timeTag(iso) {
  const delta = (Date.now() - Date.parse(iso)) / 1000;
  const label =
    delta < 60 ? 'just now'
    : delta < 3600 ? `${Math.floor(delta / 60)} min ago`
    : delta < 86400 ? `${Math.floor(delta / 3600)} h ago`
    : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
    ? `<li><a href="/">Home</a></li>
       <li><a href="/@${escapeHtml(viewer.username)}">Your profile</a></li>
       <li><a href="/settings">Settings</a></li>
       <li><a href="/moderation">Moderation</a></li>
       <li><form method="post" action="/logout"><button class="secondary" type="submit">Sign out</button></form></li>`
    : `<li><a href="/login">Sign in</a></li><li><a href="/register">Create account</a></li>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(config.instanceName)}</title>
<link rel="stylesheet" href="/style.css">
<link rel="alternate" type="application/activity+json" href="${config.origin}">
</head>
<body class="${classes}">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site">
  <div class="inner">
    <a class="brand" href="/">${escapeHtml(config.instanceName)}</a>
    <nav class="site" aria-label="Main"><ul>${nav}</ul></nav>
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="site">
  <div class="inner">
    <p>${escapeHtml(config.instanceName)} runs on ActivityPub. Your account, posts and follows can be
    <a href="/settings/export">exported</a> at any time and taken to another server.</p>
    <p>No behavioural advertising. No engagement ranking by default. No infinite scroll.</p>
  </div>
</footer>
</body>
</html>`;
}

export function postArticle(post, { viewer, showMetrics, likeCount, replyCount, canReply, replyReason }) {
  const media = JSON.parse(post.media || '[]')
    .map((item) => `<figure><img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt)}"><figcaption class="muted">${escapeHtml(item.alt)}</figcaption></figure>`)
    .join('');

  const body = post.content_warning
    ? `<details><summary>${escapeHtml(post.content_warning)}</summary><div class="body">${escapeHtml(post.content)}</div>${media}</details>`
    : `<div class="body">${escapeHtml(post.content)}</div>${media}`;

  const metrics = showMetrics
    ? `<span class="meta">${likeCount} like${likeCount === 1 ? '' : 's'}</span>`
    : `<span class="meta">Counts are private</span>`;

  const replyControl = viewer
    ? canReply
      ? `<a href="/posts/${post.id}#reply">Reply</a>`
      : `<span class="meta">${escapeHtml(replyReason ?? 'Replies are limited.')}</span>`
    : '';

  const likeControl = viewer
    ? `<form method="post" action="/posts/${post.id}/like"><button class="secondary" type="submit">Like</button></form>`
    : '';

  return `<article class="post">
  <header>
    <strong>${escapeHtml(post.display_name || post.username)}</strong>
    <span class="handle">${escapeHtml(handleOf(post))}</span>
    <span class="handle">${timeTag(post.created_at)}</span>
  </header>
  ${body}
  <footer>
    <a href="/posts/${post.id}">${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}</a>
    ${replyControl}
    ${likeControl}
    ${metrics}
  </footer>
</article>`;
}

export function composer({ prefs, replyTo = null, error = null }) {
  const policies = ['everyone', 'followers', 'mentioned', 'nobody'];
  const options = policies
    .map((value) => `<option value="${value}"${value === prefs.replyPolicy ? ' selected' : ''}>${
      { everyone: 'Anyone can reply', followers: 'Only people I follow back can reply', mentioned: 'Only people I mention can reply', nobody: 'No replies' }[value]
    }</option>`)
    .join('');

  return `<form class="card" method="post" action="${replyTo ? `/posts/${replyTo}/reply` : '/posts'}" id="reply">
  <h2>${replyTo ? 'Write a reply' : 'Write a post'}</h2>
  ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
  <label for="content">What do you want to say?</label>
  <textarea id="content" name="content" maxlength="${config.limits.postLength}" required></textarea>
  <label for="content_warning">Content note (optional)</label>
  <input type="text" id="content_warning" name="content_warning" maxlength="140">
  <p class="hint">A content note hides the post behind a heading until someone chooses to open it.</p>
  ${replyTo ? '' : `
  <label for="reply_policy">Who can reply?</label>
  <select id="reply_policy" name="reply_policy">${options}</select>
  <label for="visibility">Who can see this?</label>
  <select id="visibility" name="visibility">
    <option value="public">Anyone</option>
    <option value="followers">Followers only</option>
  </select>`}
  <p><button type="submit">${replyTo ? 'Post reply' : 'Post'}</button></p>
</form>`;
}

export function timelinePage({ viewer, prefs, feed, feeds, posts, nextCursor, error }) {
  const picker = feeds
    .map((f) => `<option value="${escapeHtml(f.id)}"${f.id === feed.id ? ' selected' : ''}>${escapeHtml(f.name)}</option>`)
    .join('');

  const list = posts.length
    ? posts.map((p) => postArticle(p, p.view)).join('')
    : `<p class="card">Nothing here yet. Follow someone, or write the first post.</p>`;

  // Paging is a link the user chooses to follow. No scroll handler exists.
  const pager = nextCursor
    ? `<p class="pager"><a class="button secondary" href="/?feed=${encodeURIComponent(feed.id)}&amp;before=${encodeURIComponent(nextCursor)}">Show older posts</a></p>`
    : `<p class="pager end">That is everything for now. Nothing more will load on its own.</p>`;

  return layout({
    title: 'Home',
    viewer,
    prefs,
    body: `
<h1>Home</h1>
<div class="feed-explainer">
  <p><strong>${escapeHtml(feed.name)}.</strong> ${escapeHtml(feed.explanation)}</p>
  <form method="get" action="/">
    <label for="feed">Choose how this feed is built</label>
    <select id="feed" name="feed">${picker}</select>
    <p><button class="secondary" type="submit">Use this feed</button></p>
  </form>
</div>
${composer({ prefs, error })}
<h2>Posts</h2>
${list}
${pager}`,
  });
}

export function threadPage({ viewer, prefs, post, replies, replyState, error }) {
  return layout({
    title: 'Post',
    viewer,
    prefs,
    body: `
<h1>Post</h1>
${postArticle(post, post.view)}
<h2>Replies</h2>
${replies.length ? replies.map((r) => postArticle(r, r.view)).join('') : '<p class="card">No replies yet.</p>'}
${
  viewer
    ? replyState.allowed
      ? composer({ prefs, replyTo: post.id, error })
      : `<p class="notice" id="reply">${escapeHtml(replyState.reason)}</p>`
    : '<p class="notice"><a href="/login">Sign in</a> to reply.</p>'
}`,
  });
}

export function profilePage({ viewer, prefs, account, accountPrefs, posts, nextCursor, counts, isSelf, following, paused }) {
  const followForm = viewer && !isSelf
    ? `<form method="post" action="/@${escapeHtml(account.username)}/${following ? 'unfollow' : 'follow'}">
         <button type="submit" class="${following ? 'secondary' : ''}">${following ? 'Unfollow' : 'Follow'}</button>
       </form>`
    : '';

  const countsBlock = accountPrefs.showMetrics || isSelf
    ? `<p class="meta">${counts.followers} followers · ${counts.following} following</p>`
    : `<p class="meta">This account keeps its follower counts private.</p>`;

  if (paused) {
    return layout({
      title: `@${account.username}`,
      viewer,
      prefs,
      body: `<h1>@${escapeHtml(account.username)}</h1>
      <p class="notice">This account is paused. The posts are not deleted — they are simply not shown while the account is on a break.</p>`,
    });
  }

  return layout({
    title: `@${account.username}`,
    viewer,
    prefs,
    body: `
<div class="card">
  <h1>${escapeHtml(account.display_name || account.username)}</h1>
  <p class="handle meta">${escapeHtml(handleOf(account))}</p>
  ${account.bio ? `<p>${escapeHtml(account.bio)}</p>` : ''}
  ${countsBlock}
  ${followForm}
</div>
<h2>Posts</h2>
${posts.length ? posts.map((p) => postArticle(p, p.view)).join('') : '<p class="card">No posts yet.</p>'}
${
  nextCursor
    ? `<p class="pager"><a class="button secondary" href="/@${escapeHtml(account.username)}?before=${encodeURIComponent(nextCursor)}">Show older posts</a></p>`
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
    title: 'Settings',
    viewer,
    prefs,
    body: `
<h1>Settings</h1>
${saved ? '<p class="notice" role="status">Saved.</p>' : ''}
${viewer.is_minor ? '<p class="notice">This account is registered as under 18. Some protections cannot be switched off: replies stay limited to people you follow back, direct messages are off, and the account is not listed in discovery.</p>' : ''}
<form method="post" action="/settings">
  <fieldset>
    <legend>Your feed</legend>
    <label for="feed">How your home feed is built</label>
    <select id="feed" name="feed">${feedOptions}</select>
    <p class="hint">Feeds are interchangeable. Whichever you choose, it explains itself at the top of your home page, and no feed uses engagement data.</p>
  </fieldset>
  <fieldset>
    <legend>Attention and privacy</legend>
    ${checkbox('showMetrics', 'Show my like counts publicly', 'Off by default. When off, only you can see how many likes your posts got.')}
    ${checkbox('discoverable', 'List my account in discovery', 'Off means people can still find you by your exact handle.')}
    <label for="sessionLimitMinutes">Session reminder after (minutes, 0 = off)</label>
    <input type="text" id="sessionLimitMinutes" name="sessionLimitMinutes" value="${escapeHtml(prefs.sessionLimitMinutes)}" inputmode="numeric">
    <p class="hint">You decide the shape of your session. LAMP never nudges you to stay longer.</p>
  </fieldset>
  <fieldset>
    <legend>Reading comfort</legend>
    ${checkbox('reducedMotion', 'Reduce motion', 'Turns off every transition and animation.')}
    ${checkbox('lowStimulus', 'Low-stimulus colours', 'A muted palette with no colour accents competing for attention.')}
    ${checkbox('plainLanguage', 'Plain language and more spacing', 'Wider line spacing and a shorter line length.')}
  </fieldset>
  <fieldset>
    <legend>Replies and messages</legend>
    <label for="replyPolicy">Default reply setting for new posts</label>
    <select id="replyPolicy" name="replyPolicy">
      <option value="everyone"${prefs.replyPolicy === 'everyone' ? ' selected' : ''}>Anyone can reply</option>
      <option value="followers"${prefs.replyPolicy === 'followers' ? ' selected' : ''}>Only people I follow back</option>
      <option value="mentioned"${prefs.replyPolicy === 'mentioned' ? ' selected' : ''}>Only people I mention</option>
      <option value="nobody"${prefs.replyPolicy === 'nobody' ? ' selected' : ''}>No replies</option>
    </select>
  </fieldset>
  <p><button type="submit">Save settings</button></p>
</form>

<h2>Take a break</h2>
<div class="card">
  <p>Pausing hides your profile and posts and stops your account federating. Nothing is deleted, your
  followers stay, and you can come back in one step.</p>
  <form method="post" action="/settings/${viewer.paused_at ? 'resume' : 'pause'}">
    <button class="secondary" type="submit">${viewer.paused_at ? 'Resume my account' : 'Pause my account'}</button>
  </form>
</div>

<h2>Take your account elsewhere</h2>
<div class="card">
  <p>Download your profile, posts and social graph as JSON. Any ActivityPub server can take it —
  leaving is a supported action, not a punishment.</p>
  <p><a class="button secondary" href="/settings/export">Download my data</a></p>
</div>`,
  });
}

export function moderationPage({ viewer, prefs, reports, stats }) {
  const rows = reports.length
    ? reports
        .map(
          (r) => `<tr>
  <td>${escapeHtml(r.severity)}<br><small>${escapeHtml(r.source)}</small></td>
  <td>${escapeHtml(r.reason)}<br><small>${escapeHtml((r.content ?? '').slice(0, 160))}</small></td>
  <td>${escapeHtml(r.language ?? '—')}</td>
  <td>
    <form method="post" action="/moderation/${r.id}">
      <label class="inline" for="note-${r.id}">Note</label>
      <input type="text" id="note-${r.id}" name="note" maxlength="500">
      <button name="decision" value="actioned" type="submit">Remove post</button>
      <button class="secondary" name="decision" value="dismissed" type="submit">Dismiss</button>
    </form>
  </td>
</tr>`,
        )
        .join('')
    : '<tr><td colspan="4">The queue is empty.</td></tr>';

  const statRows = Object.entries(stats)
    .map(([language, s]) => `<tr><td>${escapeHtml(language)}</td><td>${s.decided}</td><td>${s.actioned}</td><td>${s.precision === null ? '—' : (s.precision * 100).toFixed(0) + '%'}</td></tr>`)
    .join('') || '<tr><td colspan="4">No decided triage items yet.</td></tr>';

  return layout({
    title: 'Moderation',
    viewer,
    prefs,
    body: `
<h1>Moderation queue</h1>
<p class="notice">Automated triage only sorts this queue. It cannot remove or hide anything —
every decision below is made by a person, and is recorded with who made it.</p>
<table>
  <caption>Open reports, most severe first</caption>
  <thead><tr><th scope="col">Severity</th><th scope="col">Reason</th><th scope="col">Language</th><th scope="col">Decision</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<h2>Triage agreement by language</h2>
<p>How often a machine-flagged item was actually actioned by a human. A low or missing number for a
language is a signal that the classifier should not be trusted there.</p>
<table>
  <thead><tr><th scope="col">Language</th><th scope="col">Decided</th><th scope="col">Actioned</th><th scope="col">Agreement</th></tr></thead>
  <tbody>${statRows}</tbody>
</table>`,
  });
}

export function formPage({ viewer, prefs, title, intro, action, fields, submitLabel, error, footer = '' }) {
  return layout({
    title,
    viewer,
    prefs,
    body: `
<h1>${escapeHtml(title)}</h1>
${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
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
    title: `Error ${status}`,
    viewer,
    prefs,
    body: `<h1>${status}</h1><p class="notice">${escapeHtml(message)}</p><p><a href="/">Back to home</a></p>`,
  });
}
