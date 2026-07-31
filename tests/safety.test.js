/** Consent-first interaction: reply permissions, cool-down, blocks, moderation. */

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { freshDatabase, makeAccount } from './helpers.js';
import { DomainError } from '../src/domain/accounts.js';
import { createPost, findPostById } from '../src/domain/posts.js';
import { block, canReply, hiddenAccountIds, isFollowing, requestFollow } from '../src/domain/safety.js';
import { timeline } from '../src/domain/feeds.js';
import { decideReport, openReports, resetClassifier, setClassifier, triage, triageAgreementStats } from '../src/domain/moderation.js';

beforeEach(() => {
  freshDatabase();
  resetClassifier();
});

describe('reply permissions', () => {
  it('applies the followers-only default', () => {
    const author = makeAccount('author');
    const stranger = makeAccount('stranger');
    const post = createPost(author, { content: 'my post' });

    assert.equal(canReply(post, stranger).allowed, false);

    requestFollow(author.id, stranger.id); // author now follows the stranger back
    assert.equal(canReply(post, stranger).allowed, true);
  });

  it('honours "nobody" and "mentioned"', () => {
    const author = makeAccount('author2');
    const other = makeAccount('other2');
    requestFollow(author.id, other.id);

    const closed = createPost(author, { content: 'no replies please', replyPolicy: 'nobody' });
    assert.equal(canReply(closed, other).allowed, false);

    const mentioned = createPost(author, { content: 'thoughts @other2 ?', replyPolicy: 'mentioned' });
    assert.equal(canReply(mentioned, other).allowed, true);

    const notMentioned = createPost(author, { content: 'thoughts anyone?', replyPolicy: 'mentioned' });
    assert.equal(canReply(notMentioned, other).allowed, false);
  });

  it('blocks a reply from an account the author blocked, whatever the policy', () => {
    const author = makeAccount('author3');
    const troll = makeAccount('troll3');
    const post = createPost(author, { content: 'open post', replyPolicy: 'everyone' });
    block(author.id, troll.id);
    assert.equal(canReply(post, troll).allowed, false);
  });

  it('rejects a reply at write time, not only in the UI', () => {
    const author = makeAccount('author4');
    const stranger = makeAccount('stranger4');
    const post = createPost(author, { content: 'closed', replyPolicy: 'nobody' });
    assert.throws(
      () => createPost(stranger, { content: 'anyway', inReplyTo: post.id }),
      (error) => error instanceof DomainError,
    );
  });
});

describe('pile-on cool-down', () => {
  it('stops rapid repeated replies in the same thread', () => {
    const author = makeAccount('author5');
    const replier = makeAccount('replier5');
    requestFollow(author.id, replier.id);
    const post = createPost(author, { content: 'topic', replyPolicy: 'everyone' });

    createPost(replier, { content: 'first reply', inReplyTo: post.id });
    assert.throws(
      () => createPost(replier, { content: 'second reply immediately', inReplyTo: post.id }),
      (error) => error instanceof DomainError && /breath/i.test(error.message),
    );
  });
});

describe('blocks', () => {
  it('severs the relationship in both directions and hides content', () => {
    const reader = makeAccount('reader');
    const noisy = makeAccount('noisy');
    requestFollow(reader.id, noisy.id);
    createPost(noisy, { content: 'visible for now', visibility: 'public' });
    assert.equal(timeline(reader, {}).posts.length, 1);

    block(reader.id, noisy.id);
    assert.equal(isFollowing(reader.id, noisy.id), false);
    assert.ok(hiddenAccountIds(reader.id).includes(noisy.id));
    assert.equal(timeline(reader, {}).posts.length, 0);
  });
});

describe('moderation', () => {
  it('routes flagged content to a human queue without touching the post', () => {
    const author = makeAccount('poster');
    const post = createPost(author, { content: "you are an idiot and I will find you" });

    const { triage: hint, reportId } = triage(post);
    assert.equal(hint.severity, 'high');
    assert.ok(reportId, 'a queue item exists for a human');
    assert.equal(findPostById(post.id).deleted_at, null, 'classification alone never removes a post');
    assert.equal(openReports().length, 1);
  });

  it('leaves ordinary posts alone', () => {
    const author = makeAccount('ordinary');
    const post = createPost(author, { content: 'went for a walk, the light was nice' });
    const { triage: hint, reportId } = triage(post);
    assert.equal(hint.severity, 'none');
    assert.equal(reportId, null);
    assert.equal(openReports().length, 0);
  });

  it('only removes content through a recorded human decision', () => {
    const author = makeAccount('subject');
    const moderator = makeAccount('mod');
    const post = createPost(author, { content: 'you are worthless' });
    const { reportId } = triage(post);

    const decided = decideReport({ reportId, moderatorId: moderator.id, decision: 'actioned', note: 'targeted abuse' });
    assert.equal(decided.state, 'actioned');
    assert.equal(decided.decided_by, moderator.id);
    assert.ok(decided.decision_note);
    assert.ok(findPostById(post.id) === undefined, 'the human decision is what removed it');
  });

  it('reports its own weakness in unsupported languages', () => {
    const author = makeAccount('estonian');
    const post = createPost(author, { content: 'sa oled loll ja ma leian su üles', language: 'et' });
    const { triage: hint } = triage(post);
    assert.equal(hint.languageSupported, false);
    assert.ok(hint.confidence <= 0.3, 'low confidence outside evaluated languages');
  });

  it('tracks human/machine agreement per language for the WP4 assessment', () => {
    const author = makeAccount('mixed');
    const moderator = makeAccount('mod2');
    const bad = createPost(author, { content: 'you are an idiot', language: 'en' });
    const alsoBad = createPost(author, { content: 'you are stupid', language: 'en' });

    decideReport({ reportId: triage(bad).reportId, moderatorId: moderator.id, decision: 'actioned' });
    decideReport({ reportId: triage(alsoBad).reportId, moderatorId: moderator.id, decision: 'dismissed' });

    const stats = triageAgreementStats();
    assert.equal(stats.en.decided, 2);
    assert.equal(stats.en.actioned, 1);
    assert.equal(stats.en.precision, 0.5);
  });

  it('lets WP4 swap in a different classifier for evaluation', () => {
    setClassifier(() => ({ severity: 'medium', labels: ['model-flag'], confidence: 0.9, model: 'test-model', languageSupported: true }));
    const author = makeAccount('swap');
    const post = createPost(author, { content: 'anything at all' });
    const { triage: hint } = triage(post);
    assert.equal(hint.model, 'test-model');
    assert.equal(openReports().length, 1);
  });
});
