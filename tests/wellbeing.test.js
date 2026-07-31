/**
 * These tests encode the product commitments from the Youth Design Charter.
 * If one of them fails, the build is not shippable — that is the point of
 * writing them as tests rather than as documentation.
 */

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { freshDatabase, makeAccount } from './helpers.js';
import config from '../src/config.js';
import { DomainError, exportAccount, pauseAccount, preferencesOf, resumeAccount, updatePreferences } from '../src/domain/accounts.js';
import { createPost, metricsVisible, react, countReactions } from '../src/domain/posts.js';
import { requestFollow } from '../src/domain/safety.js';
import { timeline } from '../src/domain/feeds.js';
import { nodeInfo } from '../src/federation/activitypub.js';

beforeEach(freshDatabase);

describe('defaults', () => {
  it('gives every new account a chronological, unranked feed', () => {
    const account = makeAccount('ada');
    assert.equal(preferencesOf(account).feed, 'chronological');
  });

  it('keeps like counts private until the author opts in', () => {
    const author = makeAccount('author');
    const viewer = makeAccount('viewer');
    const post = createPost(author, { content: 'hello' });
    react(viewer.id, post.id);

    assert.equal(countReactions(post.id), 1);
    assert.equal(metricsVisible(post, viewer), false, 'a stranger must not see the count');
    assert.equal(metricsVisible(post, author), true, 'the author always sees their own count');

    updatePreferences(author.id, { showMetrics: true });
    assert.equal(metricsVisible(post, viewer), true);
  });

  it('advertises its well-being posture in nodeinfo so instance pickers can filter', () => {
    const meta = nodeInfo().metadata.wellbeingDefaults;
    assert.equal(meta.infiniteScroll, false);
    assert.equal(meta.engagementRankingDefault, false);
    assert.equal(meta.behaviouralAdvertising, false);
    assert.equal(meta.altTextRequired, true);
  });
});

describe('minor protection', () => {
  it('pins the protective settings even if a form tries to loosen them', () => {
    const minor = makeAccount('teen', { isMinor: true });
    const prefs = updatePreferences(minor.id, { showMetrics: true, discoverable: true, dmFrom: 'everyone' });

    assert.equal(prefs.showMetrics, false);
    assert.equal(prefs.discoverable, false);
    assert.equal(prefs.dmFrom, 'nobody');
  });

  it('defaults a minor account\'s posts to followers-only', () => {
    const minor = makeAccount('teen2', { isMinor: true });
    const post = createPost(minor, { content: 'hi' });
    assert.equal(post.visibility, 'followers');
  });

  it('still lets a minor change comfort settings', () => {
    const minor = makeAccount('teen3', { isMinor: true });
    const prefs = updatePreferences(minor.id, { lowStimulus: true, plainLanguage: true });
    assert.equal(prefs.lowStimulus, true);
    assert.equal(prefs.plainLanguage, true);
  });
});

describe('accessibility', () => {
  it('refuses to publish an image without a description', () => {
    const account = makeAccount('pix');
    assert.throws(
      () => createPost(account, { content: 'look', media: [{ url: 'https://example.org/a.png' }] }),
      (error) => error instanceof DomainError && /description/i.test(error.message),
    );
  });

  it('accepts media once alt text is supplied', () => {
    const account = makeAccount('pix2');
    const post = createPost(account, { content: 'look', media: [{ url: 'https://example.org/a.png', alt: 'A red bicycle' }] });
    assert.equal(JSON.parse(post.media)[0].alt, 'A red bicycle');
  });
});

describe('pause instead of delete', () => {
  it('hides a paused account from timelines without losing anything', () => {
    const author = makeAccount('paused');
    const reader = makeAccount('reader');
    requestFollow(reader.id, author.id);
    createPost(author, { content: 'still here', visibility: 'public' });

    assert.equal(timeline(reader, {}).posts.length, 1);

    pauseAccount(author.id);
    assert.equal(timeline(reader, {}).posts.length, 0, 'paused authors leave the timeline');
    assert.equal(exportAccount(author.id).posts.length, 1, 'nothing is deleted');

    resumeAccount(author.id);
    assert.equal(timeline(reader, {}).posts.length, 1, 'resuming restores everything in one step');
  });
});

describe('portability', () => {
  it('exports profile, posts and both sides of the social graph', () => {
    const account = makeAccount('mover');
    const friend = makeAccount('friend');
    requestFollow(account.id, friend.id);
    requestFollow(friend.id, account.id);
    createPost(account, { content: 'taking this with me' });

    const dump = exportAccount(account.id);
    assert.equal(dump.profile.username, 'mover');
    assert.equal(dump.posts.length, 1);
    assert.equal(dump.following.length, 1);
    assert.equal(dump.followers.length, 1);
  });
});

describe('paging', () => {
  it('pages in explicit steps and reports when there is nothing more', () => {
    const author = makeAccount('prolific');
    const reader = makeAccount('audience');
    requestFollow(reader.id, author.id);
    for (let i = 0; i < config.limits.pageSize + 5; i += 1) {
      createPost(author, { content: `post ${i}`, visibility: 'public' });
    }

    const first = timeline(reader, {});
    assert.equal(first.posts.length, config.limits.pageSize);
    assert.ok(first.nextCursor, 'a cursor is offered for an explicit "show older" action');

    const second = timeline(reader, { before: first.nextCursor });
    assert.equal(second.posts.length, 5);
    assert.equal(second.nextCursor, null, 'the end of the timeline is stated, not hidden');
  });
});
