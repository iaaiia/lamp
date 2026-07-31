/** HTTP server: web UI, JSON API surface and ActivityPub endpoints. */

import { createServer } from 'node:http';
import config from './config.js';
import { openDatabase } from './db.js';
import {
  DomainError,
  accountForSession,
  authenticate,
  createLocalAccount,
  createSession,
  destroySession,
  exportAccount,
  findLocalByUsername,
  isPaused,
  pauseAccount,
  preferencesOf,
  resumeAccount,
  updatePreferences,
} from './domain/accounts.js';
import {
  countReactions,
  createPost,
  findPostById,
  hasReacted,
  isVisibleTo,
  metricsVisible,
  react,
  repliesTo,
  unreact,
} from './domain/posts.js';
import { accountTimeline, listFeeds, timeline } from './domain/feeds.js';
import {
  canReply,
  countFollowers,
  countFollowing,
  followerAccounts,
  followingAccounts,
  isFollowing,
  requestFollow,
  unfollow,
} from './domain/safety.js';
import { decideReport, openReports, triage, triageAgreementStats } from './domain/moderation.js';
import {
  actorDocument,
  collection,
  createActivity,
  followActivity,
  nodeInfo,
  noteDocument,
  undoActivity,
  webfingerDocument,
  actorUrl,
} from './federation/activitypub.js';
import { enqueue, flushQueue, inboxesFor } from './federation/delivery.js';
import { authenticateRequest, handleActivity } from './federation/inbox.js';
import {
  clearSessionCookie,
  createRouter,
  parseCookies,
  parseForm,
  readBody,
  redirect,
  sendActivityJson,
  sendHtml,
  sendJson,
  sessionCookie,
  wantsActivityJson,
} from './lib/http.js';
import { STYLESHEET } from './web/style.js';
import {
  errorPage,
  formPage,
  moderationPage,
  profilePage,
  settingsPage,
  threadPage,
  timelinePage,
} from './web/views.js';

const router = createRouter();

/* ------------------------------------------------------------------ helpers */

/** Attach the per-viewer view model a post needs to render. */
function decorate(post, viewer) {
  const replyState = canReply(post, viewer);
  return {
    ...post,
    view: {
      viewer,
      showMetrics: metricsVisible(post, viewer),
      likeCount: countReactions(post.id),
      replyCount: repliesTo(post.id).length,
      canReply: replyState.allowed,
      replyReason: replyState.reason,
      liked: viewer ? hasReacted(viewer.id, post.id) : false,
    },
  };
}

/** Deliver an activity to a local author's remote followers. */
function fanOut(author, activity) {
  const inboxes = inboxesFor(followerAccounts(author.id));
  if (inboxes.length) enqueue(author, inboxes, activity);
}

const requireViewer = (ctx, res) => {
  if (!ctx.viewer) {
    redirect(res, '/login');
    return false;
  }
  return true;
};

/* -------------------------------------------------------------------- static */

router.get('/style.css', (ctx, res) => {
  res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=3600' });
  res.end(STYLESHEET);
});

/* ------------------------------------------------------------------ timeline */

router.get('/', (ctx, res) => {
  if (!ctx.viewer) {
    return sendHtml(res, 200, formPage({
      viewer: null,
      prefs: preferencesOf(null),
      title: config.instanceName,
      intro:
        'A social network built with young people, on open protocols. Newest-first by default, no engagement ranking, no infinite scroll, and your account can leave with you.',
      action: '/login',
      fields: `
        <label for="username">Username</label>
        <input type="text" id="username" name="username" autocomplete="username" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>`,
      submitLabel: 'Sign in',
      footer: '<p><a href="/register">Create an account</a></p>',
    }));
  }

  const prefs = preferencesOf(ctx.viewer);
  const feedId = ctx.url.searchParams.get('feed') ?? prefs.feed;
  const before = ctx.url.searchParams.get('before');
  const result = timeline(ctx.viewer, { feedId, before });

  sendHtml(res, 200, timelinePage({
    viewer: ctx.viewer,
    prefs,
    feed: result.feed,
    feeds: listFeeds(),
    posts: result.posts.map((p) => decorate(p, ctx.viewer)),
    nextCursor: result.nextCursor,
    error: ctx.url.searchParams.get('error'),
  }));
});

/* ------------------------------------------------------------------ accounts */

router.get('/register', (ctx, res) =>
  sendHtml(res, 200, formPage({
    viewer: null,
    prefs: preferencesOf(null),
    title: 'Create an account',
    intro: 'Your settings start at the protective end. You can loosen them later — nothing loosens itself.',
    action: '/register',
    fields: `
      <label for="username">Username</label>
      <input type="text" id="username" name="username" autocomplete="username" required>
      <p class="hint">3–30 lowercase letters, numbers or underscores.</p>
      <label for="display_name">Display name (optional)</label>
      <input type="text" id="display_name" name="display_name">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autocomplete="new-password" required>
      <p class="hint">At least 10 characters.</p>
      <label class="inline"><input type="checkbox" name="is_minor" value="1">
        <span>I am under 18<span class="hint">Turns on extra protections that cannot be switched off.</span></span></label>`,
    submitLabel: 'Create account',
    error: ctx.error,
  })));

router.post('/register', (ctx, res) => {
  try {
    const account = createLocalAccount({
      username: ctx.form.username,
      password: ctx.form.password,
      displayName: ctx.form.display_name ?? '',
      isMinor: ctx.form.is_minor === '1',
    });
    const session = createSession(account.id);
    redirect(res, '/', sessionCookie(session.id));
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    sendHtml(res, 400, formPage({
      viewer: null,
      prefs: preferencesOf(null),
      title: 'Create an account',
      action: '/register',
      fields: `
        <label for="username">Username</label>
        <input type="text" id="username" name="username" value="${ctx.form.username ?? ''}" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>`,
      submitLabel: 'Create account',
      error: error.message,
    }));
  }
});

router.get('/login', (ctx, res) =>
  sendHtml(res, 200, formPage({
    viewer: null,
    prefs: preferencesOf(null),
    title: 'Sign in',
    action: '/login',
    fields: `
      <label for="username">Username</label>
      <input type="text" id="username" name="username" autocomplete="username" required>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required>`,
    submitLabel: 'Sign in',
    footer: '<p><a href="/register">Create an account</a></p>',
  })));

router.post('/login', (ctx, res) => {
  const account = authenticate(ctx.form.username, ctx.form.password);
  if (!account) {
    return sendHtml(res, 401, formPage({
      viewer: null,
      prefs: preferencesOf(null),
      title: 'Sign in',
      action: '/login',
      fields: `
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>`,
      submitLabel: 'Sign in',
      error: 'That username and password do not match.',
    }));
  }
  const session = createSession(account.id);
  redirect(res, '/', sessionCookie(session.id));
});

router.post('/logout', (ctx, res) => {
  if (ctx.sessionId) destroySession(ctx.sessionId);
  redirect(res, '/', clearSessionCookie());
});

/* --------------------------------------------------------------------- posts */

router.post('/posts', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  try {
    const post = createPost(ctx.viewer, {
      content: ctx.form.content,
      contentWarning: ctx.form.content_warning,
      visibility: ctx.form.visibility,
      replyPolicy: ctx.form.reply_policy,
    });
    triage(post);
    fanOut(ctx.viewer, createActivity(post, ctx.viewer));
    redirect(res, '/');
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    redirect(res, `/?error=${encodeURIComponent(error.message)}`);
  }
});

router.get('/posts/:id', (ctx, res) => {
  const post = findPostById(Number(ctx.params.id));
  if (!post || !isVisibleTo(post, ctx.viewer)) return notFound(ctx, res);

  const enriched = { ...post, ...ctx.authorOf(post) };
  sendHtml(res, 200, threadPage({
    viewer: ctx.viewer,
    prefs: preferencesOf(ctx.viewer),
    post: decorate(enriched, ctx.viewer),
    replies: repliesTo(post.id).map((r) => decorate(r, ctx.viewer)),
    replyState: canReply(post, ctx.viewer),
    error: ctx.url.searchParams.get('error'),
  }));
});

router.post('/posts/:id/reply', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  const parent = findPostById(Number(ctx.params.id));
  if (!parent) return notFound(ctx, res);
  try {
    const reply = createPost(ctx.viewer, { content: ctx.form.content, contentWarning: ctx.form.content_warning, inReplyTo: parent.id });
    triage(reply);
    fanOut(ctx.viewer, createActivity(reply, ctx.viewer));
    redirect(res, `/posts/${parent.id}`);
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    redirect(res, `/posts/${parent.id}?error=${encodeURIComponent(error.message)}`);
  }
});

router.post('/posts/:id/like', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  const post = findPostById(Number(ctx.params.id));
  if (!post || !isVisibleTo(post, ctx.viewer)) return notFound(ctx, res);
  if (hasReacted(ctx.viewer.id, post.id)) unreact(ctx.viewer.id, post.id);
  else react(ctx.viewer.id, post.id);
  redirect(res, `/posts/${post.id}`);
});

/* ------------------------------------------------------- profiles + actors */

router.get('/@:username', async (ctx, res) => {
  const account = findLocalByUsername(ctx.params.username);
  if (!account) return notFound(ctx, res);
  const accountPrefs = preferencesOf(account);

  if (wantsActivityJson(ctx.req)) {
    return sendActivityJson(res, 200, actorDocument(account, accountPrefs));
  }

  const before = ctx.url.searchParams.get('before');
  const { posts, nextCursor } = accountTimeline(account.id, { before });
  sendHtml(res, 200, profilePage({
    viewer: ctx.viewer,
    prefs: preferencesOf(ctx.viewer),
    account,
    accountPrefs,
    paused: isPaused(account) && ctx.viewer?.id !== account.id,
    posts: posts.filter((p) => isVisibleTo(p, ctx.viewer)).map((p) => decorate(p, ctx.viewer)),
    nextCursor,
    counts: { followers: countFollowers(account.id), following: countFollowing(account.id) },
    isSelf: ctx.viewer?.id === account.id,
    following: ctx.viewer ? isFollowing(ctx.viewer.id, account.id) : false,
  }));
});

router.get('/@:username/outbox', (ctx, res) => {
  const account = findLocalByUsername(ctx.params.username);
  if (!account || isPaused(account)) return notFound(ctx, res);
  const { posts } = accountTimeline(account.id, { limit: 40 });
  const items = posts
    .filter((p) => p.visibility === 'public')
    .map((p) => noteDocument(p, account));
  sendActivityJson(res, 200, collection(`${actorUrl(account.username)}/outbox`, items));
});

router.get('/@:username/followers', (ctx, res) => {
  const account = findLocalByUsername(ctx.params.username);
  if (!account) return notFound(ctx, res);
  const prefs = preferencesOf(account);
  // A private follower count stays private over the protocol too.
  const items = prefs.showMetrics
    ? followerAccounts(account.id).map((a) => (a.is_local ? actorUrl(a.username) : a.actor_url))
    : [];
  sendActivityJson(res, 200, collection(`${actorUrl(account.username)}/followers`, items));
});

router.get('/@:username/following', (ctx, res) => {
  const account = findLocalByUsername(ctx.params.username);
  if (!account) return notFound(ctx, res);
  const prefs = preferencesOf(account);
  const items = prefs.showMetrics
    ? followingAccounts(account.id).map((a) => (a.is_local ? actorUrl(a.username) : a.actor_url))
    : [];
  sendActivityJson(res, 200, collection(`${actorUrl(account.username)}/following`, items));
});

router.post('/@:username/follow', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  const target = findLocalByUsername(ctx.params.username);
  if (!target) return notFound(ctx, res);
  const follow = requestFollow(ctx.viewer.id, target.id);
  if (follow && !target.is_local) {
    enqueue(ctx.viewer, inboxesFor([target]), followActivity(ctx.viewer, target.actor_url, `${actorUrl(ctx.viewer.username)}#follows/${target.id}`));
  }
  redirect(res, `/@${target.username}`);
});

router.post('/@:username/unfollow', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  const target = findLocalByUsername(ctx.params.username);
  if (!target) return notFound(ctx, res);
  unfollow(ctx.viewer.id, target.id);
  if (!target.is_local) {
    enqueue(ctx.viewer, inboxesFor([target]), undoActivity(ctx.viewer, followActivity(ctx.viewer, target.actor_url, `${actorUrl(ctx.viewer.username)}#follows/${target.id}`)));
  }
  redirect(res, `/@${target.username}`);
});

/* ------------------------------------------------------------------ settings */

router.get('/settings', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  sendHtml(res, 200, settingsPage({
    viewer: ctx.viewer,
    prefs: preferencesOf(ctx.viewer),
    feeds: listFeeds(),
    saved: ctx.url.searchParams.get('saved') === '1',
  }));
});

router.post('/settings', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  updatePreferences(ctx.viewer.id, {
    feed: ctx.form.feed,
    replyPolicy: ctx.form.replyPolicy,
    showMetrics: ctx.form.showMetrics === '1',
    discoverable: ctx.form.discoverable === '1',
    reducedMotion: ctx.form.reducedMotion === '1',
    lowStimulus: ctx.form.lowStimulus === '1',
    plainLanguage: ctx.form.plainLanguage === '1',
    sessionLimitMinutes: Number.parseInt(ctx.form.sessionLimitMinutes, 10) || 0,
  });
  redirect(res, '/settings?saved=1');
});

router.post('/settings/pause', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  pauseAccount(ctx.viewer.id);
  redirect(res, '/settings?saved=1');
});

router.post('/settings/resume', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  resumeAccount(ctx.viewer.id);
  redirect(res, '/settings?saved=1');
});

router.get('/settings/export', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  sendJson(res, 200, exportAccount(ctx.viewer.id), {
    'content-disposition': `attachment; filename="lamp-export-${ctx.viewer.username}.json"`,
  });
});

/* ---------------------------------------------------------------- moderation */

router.get('/moderation', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  sendHtml(res, 200, moderationPage({
    viewer: ctx.viewer,
    prefs: preferencesOf(ctx.viewer),
    reports: openReports(),
    stats: triageAgreementStats(),
  }));
});

router.post('/moderation/:id', (ctx, res) => {
  if (!requireViewer(ctx, res)) return;
  decideReport({
    reportId: Number(ctx.params.id),
    moderatorId: ctx.viewer.id,
    decision: ctx.form.decision === 'actioned' ? 'actioned' : 'dismissed',
    note: ctx.form.note ?? '',
  });
  redirect(res, '/moderation');
});

/* --------------------------------------------------------------- federation */

router.get('/.well-known/webfinger', (ctx, res) => {
  const resource = ctx.url.searchParams.get('resource') ?? '';
  const match = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!match) return sendJson(res, 400, { error: 'resource must look like acct:user@host' });
  const account = findLocalByUsername(match[1]);
  if (!account) return sendJson(res, 404, { error: 'no such account' });
  res.writeHead(200, { 'content-type': 'application/jrd+json; charset=utf-8' });
  res.end(JSON.stringify(webfingerDocument(account)));
});

router.get('/.well-known/nodeinfo', (ctx, res) =>
  sendJson(res, 200, {
    links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href: `${config.origin}/nodeinfo/2.1` }],
  }));

router.get('/nodeinfo/2.1', (ctx, res) => sendJson(res, 200, nodeInfo()));

async function receiveInbox(ctx, res, localAccount) {
  const auth = await authenticateRequest({
    method: 'POST',
    path: ctx.url.pathname + ctx.url.search,
    headers: ctx.req.headers,
    body: ctx.body,
  });
  if (!auth.ok) return sendJson(res, 401, { error: auth.reason });

  let activity;
  try {
    activity = JSON.parse(ctx.body);
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON' });
  }
  // The signing key must belong to the actor claiming to act.
  if (activity.actor && auth.account.actor_url && activity.actor !== auth.account.actor_url) {
    return sendJson(res, 403, { error: 'actor does not match signing key' });
  }

  const result = await handleActivity(activity, auth.account, localAccount);
  sendJson(res, result.status, { note: result.note });
}

router.post('/inbox', (ctx, res) => receiveInbox(ctx, res, null));

router.post('/@:username/inbox', (ctx, res) => {
  const account = findLocalByUsername(ctx.params.username);
  if (!account) return notFound(ctx, res);
  return receiveInbox(ctx, res, account);
});

/* ------------------------------------------------------------------- plumbing */

function notFound(ctx, res) {
  if (wantsActivityJson(ctx.req)) return sendJson(res, 404, { error: 'not found' });
  sendHtml(res, 404, errorPage({
    viewer: ctx.viewer,
    prefs: preferencesOf(ctx.viewer),
    status: 404,
    message: 'That page does not exist.',
  }));
}

export function createApp() {
  return async (req, res) => {
    const url = new URL(req.url, config.origin);
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.lamp_session;
    const viewer = accountForSession(sessionId);
    const body = req.method === 'POST' ? await readBody(req) : '';
    const isForm = (req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded');

    const ctx = {
      req,
      url,
      viewer,
      sessionId,
      body,
      form: isForm ? parseForm(body) : {},
      params: {},
      /** Author columns the post views expect. */
      authorOf(post) {
        const author = ctx.viewer && ctx.viewer.id === post.account_id
          ? ctx.viewer
          : findLocalByUsername(post.username ?? '') ?? {};
        return {
          username: post.username ?? author.username,
          domain: post.domain ?? author.domain ?? null,
          display_name: post.display_name ?? author.display_name,
        };
      },
    };

    const match = router.match(req.method, url.pathname);
    if (!match) return notFound(ctx, res);
    ctx.params = match.params;

    try {
      await match.handler(ctx, res);
    } catch (error) {
      console.error(`${req.method} ${url.pathname} failed:`, error);
      if (!res.headersSent) {
        sendHtml(res, 500, errorPage({
          viewer,
          prefs: preferencesOf(viewer),
          status: 500,
          message: 'Something went wrong on our side.',
        }));
      }
    }
  };
}

/* ------------------------------------------------------------------ bootstrap */

function seedDemoData() {
  if (findLocalByUsername('mira')) return;
  const mira = createLocalAccount({ username: 'mira', password: 'lamp-demo-password', displayName: 'Mira' });
  const jonas = createLocalAccount({ username: 'jonas', password: 'lamp-demo-password', displayName: 'Jonas', isMinor: true });
  requestFollow(jonas.id, mira.id);
  requestFollow(mira.id, jonas.id);
  createPost(mira, {
    content: 'First post on our instance. Newest-first feed, counts private, replies limited to people I follow back.',
    visibility: 'public',
    replyPolicy: 'followers',
  });
  createPost(jonas, { content: 'Testing the reply cool-down and the pause button today.', visibility: 'followers' });
  console.log('Seeded demo accounts: mira / jonas (password "lamp-demo-password")');
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

if (isMain) {
  openDatabase();
  if (config.seed) seedDemoData();

  const server = createServer(createApp());
  server.listen(config.port, () => {
    console.log(`${config.instanceName} listening on ${config.origin}`);
  });

  if (config.federation.enabled) {
    // Simple periodic drain; a production deployment would use a real queue.
    setInterval(() => {
      flushQueue().catch((error) => console.error('delivery flush failed:', error));
    }, 10_000).unref();
  }
}

export { router };
