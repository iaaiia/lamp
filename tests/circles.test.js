/**
 * Kreise — die Räume, aus denen lamb besteht.
 *
 * Die Eigenschaft, die diese Suite absichert: Ein Beitrag gehört dem Kreis, in
 * dem er steht. Seine Regel schlägt jede andere, auf jedem Weg — Timeline,
 * Direktaufruf, Profil, Föderation.
 */

import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { freshDatabase, makeAccount } from './helpers.js';
import { DomainError } from '../src/domain/accounts.js';
import {
  admit,
  invite,
  circleTimeline,
  circlesFor,
  createCircle,
  discoverable,
  federates,
  isMember,
  isModerator,
  isReadable,
  join,
  leave,
  markRead,
  memberCount,
  slugify,
} from '../src/domain/circles.js';
import { createPost, isVisibleTo, react } from '../src/domain/posts.js';
import { accountTimeline, timeline } from '../src/domain/feeds.js';
import { requestFollow } from '../src/domain/safety.js';
import { mutualSupporters, openRaum } from '../src/domain/rueckhalt.js';

beforeEach(freshDatabase);

describe('anlegen', () => {
  it('macht die Person, die einen Kreis öffnet, zur Moderation', () => {
    const ada = makeAccount('ada');
    const circle = createCircle(ada, { name: 'Abi und danach', kind: 'topic' });

    assert.equal(circle.slug, 'abi-und-danach');
    assert.equal(isMember(circle.id, ada.id), true);
    assert.equal(isModerator(circle.id, ada.id), true);
  });

  it('zwingt private Kreise auf Einladung, egal was das Formular schickt', () => {
    const ada = makeAccount('ada2');
    const circle = createCircle(ada, { name: 'Freundeskreis', kind: 'private', joining: 'open' });
    assert.equal(circle.joining, 'invite');
  });

  it('bildet Adressen aus Umlauten', () => {
    assert.equal(slugify('Schüler:innen München'), 'schueler-innen-muenchen');
    assert.equal(slugify('Straße & Kultur'), 'strasse-kultur');
  });

  it('lehnt zu kurze Namen ab', () => {
    const ada = makeAccount('ada3');
    assert.throws(() => createCircle(ada, { name: 'x' }), (e) => e instanceof DomainError);
  });
});

describe('beitreten und verlassen', () => {
  it('nimmt bei offenen Kreisen sofort auf', () => {
    const host = makeAccount('host');
    const guest = makeAccount('guest');
    const circle = createCircle(host, { name: 'Leipzig 15 bis 24', kind: 'local', joining: 'open' });

    join(circle, guest);
    assert.equal(isMember(circle.id, guest.id), true);
    assert.equal(memberCount(circle.id), 2);
  });

  it('lässt Anfragen erst nach Aufnahme durch die Moderation gelten', () => {
    const host = makeAccount('host2');
    const guest = makeAccount('guest2');
    const circle = createCircle(host, { name: 'Mental Health', kind: 'topic', joining: 'request' });

    join(circle, guest);
    assert.equal(isMember(circle.id, guest.id), false, 'erst pending');

    admit(circle, host, guest.id);
    assert.equal(isMember(circle.id, guest.id), true);
  });

  it('lässt niemanden ohne Einladung in einen privaten Kreis', () => {
    const host = makeAccount('host3');
    const stranger = makeAccount('stranger3');
    const circle = createCircle(host, { name: 'Familie', kind: 'private' });

    assert.throws(() => join(circle, stranger), (e) => e instanceof DomainError);
    assert.equal(isMember(circle.id, stranger.id), false);
  });

  it('hindert die letzte Moderation daran, den Kreis führungslos zu verlassen', () => {
    const host = makeAccount('host4');
    const circle = createCircle(host, { name: 'Gaming', kind: 'topic' });
    assert.throws(() => leave(circle, host), (e) => e instanceof DomainError && /allein/.test(e.message));
  });

  it('lässt Mitglieder jederzeit gehen', () => {
    const host = makeAccount('host5');
    const guest = makeAccount('guest5');
    const circle = createCircle(host, { name: 'Kultur', kind: 'topic' });
    join(circle, guest);

    leave(circle, guest);
    assert.equal(isMember(circle.id, guest.id), false);
    assert.equal(memberCount(circle.id), 1);
  });
});

describe('Sichtbarkeit', () => {
  it('zeigt private Kreise nur ihren Mitgliedern — auf jedem Weg', () => {
    const host = makeAccount('host6');
    const friend = makeAccount('friend6');
    const stranger = makeAccount('stranger6');
    const circle = createCircle(host, { name: 'Freundeskreis', kind: 'private' });
    invite(circle, host, friend);

    const post = createPost(host, { content: 'Samstag jemand Zeit?', circleId: circle.id });

    assert.equal(post.visibility, 'circle', 'der Kreis bestimmt die Sichtbarkeit');
    assert.equal(isVisibleTo(post, host), true);
    assert.equal(isVisibleTo(post, stranger), false);
    assert.equal(isVisibleTo(post, null), false, 'abgemeldet erst recht nicht');
    assert.equal(isReadable(circle, stranger), false);
  });

  it('lässt Nichtmitglieder nicht in einen privaten Kreis schreiben', () => {
    const host = makeAccount('host7');
    const stranger = makeAccount('stranger7');
    const circle = createCircle(host, { name: 'Familie', kind: 'private' });

    assert.throws(
      () => createPost(stranger, { content: 'hallo', circleId: circle.id }),
      (e) => e instanceof DomainError && /Mitglied/.test(e.message),
    );
  });

  it('macht Themenkreise öffentlich lesbar', () => {
    const host = makeAccount('host8');
    const stranger = makeAccount('stranger8');
    const circle = createCircle(host, { name: 'Abi 2027', kind: 'topic' });
    const post = createPost(host, { content: 'Mathe LK jemand?', circleId: circle.id });

    assert.equal(post.visibility, 'public');
    assert.equal(isVisibleTo(post, stranger), true);
    assert.equal(isReadable(circle, null), true);
  });

  it('hält Kreisbeiträge aus dem Folge-Strom und aus dem Profil heraus', () => {
    const host = makeAccount('host9');
    const reader = makeAccount('reader9');
    requestFollow(reader.id, host.id);
    const circle = createCircle(host, { name: 'Themenkreis Neun', kind: 'topic' });

    createPost(host, { content: 'im Kreis', circleId: circle.id });
    createPost(host, { content: 'auf dem Profil', visibility: 'public' });

    const stream = timeline(reader, {}).posts;
    assert.equal(stream.length, 1, 'nur der Profilbeitrag');
    assert.equal(stream[0].content, 'auf dem Profil');

    const profile = accountTimeline(host.id).posts;
    assert.equal(profile.length, 1);
    assert.equal(profile[0].content, 'auf dem Profil');

    assert.equal(circleTimeline(circle.id).posts.length, 1, 'der Kreisbeitrag lebt in seinem Kreis');
  });
});

describe('Föderation', () => {
  it('lässt private Kreise diesen Server nie verlassen', () => {
    const host = makeAccount('host10');
    assert.equal(federates(createCircle(host, { name: 'Privatkreis Zehn', kind: 'private' })), false);
    assert.equal(federates(createCircle(host, { name: 'Themenkreis Zehn', kind: 'topic' })), true);
    assert.equal(federates(createCircle(host, { name: 'Lokalkreis Zehn', kind: 'local' })), true);
  });
});

describe('Übersicht', () => {
  it('zählt nur, was seit dem letzten Öffnen dazukam — und nicht die eigenen Beiträge', () => {
    const ada = makeAccount('ada11');
    const other = makeAccount('other11');
    const circle = createCircle(ada, { name: 'Themenkreis Elf', kind: 'topic' });
    join(circle, other);

    createPost(ada, { content: 'von mir selbst', circleId: circle.id });
    assert.equal(circlesFor(ada.id)[0].fresh_count, 0, 'eigene Beiträge sind nie "neu"');

    createPost(other, { content: 'von jemand anderem', circleId: circle.id });
    assert.equal(circlesFor(ada.id)[0].fresh_count, 1);

    markRead(circle.id, ada.id);
    assert.equal(circlesFor(ada.id)[0].fresh_count, 0, 'nach dem Öffnen ist es wirklich null');
  });

  it('schlägt nie private Kreise zum Entdecken vor', () => {
    const host = makeAccount('host12');
    const seeker = makeAccount('seeker12');
    createCircle(host, { name: 'Geheimer Kreis', kind: 'private' });
    createCircle(host, { name: 'Offener Kreis', kind: 'topic' });

    const found = discoverable(seeker.id);
    assert.equal(found.length, 1);
    assert.equal(found[0].name, 'Offener Kreis');
  });

  it('zeigt keine Kreise, in denen man schon ist', () => {
    const host = makeAccount('host13');
    const seeker = makeAccount('seeker13');
    const circle = createCircle(host, { name: 'Kreis Dreizehn', kind: 'topic' });
    join(circle, seeker);

    assert.equal(discoverable(seeker.id).length, 0);
    assert.equal(circlesFor(seeker.id).length, 1);
  });
});

describe('Rückhalt-Raum', () => {
  const aufbau = () => {
    const mira = makeAccount('mira');
    const jonas = makeAccount('jonas');
    const kim = makeAccount('kim');
    const kreis = createCircle(mira, { name: 'Kultur Leipzig', kind: 'topic', joining: 'open' });
    join(kreis, jonas);
    join(kreis, kim);
    const vonMira = createPost(mira, { content: 'Mir gehts gerade nicht gut.', circleId: kreis.id });
    const vonJonas = createPost(jonas, { content: 'Bei mir auch nicht.', circleId: kreis.id });
    return { mira, jonas, kim, kreis, vonMira, vonJonas };
  };

  it('entsteht nur, wenn beide hintereinander stehen', () => {
    const { mira, jonas, kreis, vonMira, vonJonas } = aufbau();

    // Einseitig: noch kein Raum.
    react(jonas.id, vonMira.id);
    assert.equal(mutualSupporters(kreis.id, mira.id).length, 0);
    assert.throws(() => openRaum(kreis, mira, jonas.id), DomainError);

    // Und jetzt von beiden Seiten.
    react(mira.id, vonJonas.id);
    assert.deepEqual(mutualSupporters(kreis.id, mira.id).map((p) => p.username), ['jonas']);
    const raum = openRaum(kreis, mira, jonas.id);
    assert.equal(raum.kind, 'private');
    assert.equal(memberCount(raum.id), 2);
  });

  it('führt zweimal Öffnen in denselben Raum, nicht in zwei', () => {
    const { mira, jonas, kreis, vonMira, vonJonas } = aufbau();
    react(jonas.id, vonMira.id);
    react(mira.id, vonJonas.id);

    const erster = openRaum(kreis, mira, jonas.id);
    const zweiter = openRaum(kreis, jonas, mira.id);
    assert.equal(erster.id, zweiter.id, 'beide Seiten landen im selben Raum');
  });

  it('existiert für Dritte nicht — auch nicht als verschlossene Tür', () => {
    const { mira, jonas, kim, kreis, vonMira, vonJonas } = aufbau();
    react(jonas.id, vonMira.id);
    react(mira.id, vonJonas.id);
    const raum = openRaum(kreis, mira, jonas.id);

    assert.equal(isReadable(raum, kim), false, 'ein Dritter sieht den Raum nicht');
    assert.equal(federates(raum), false, 'und er verlässt diesen Server nie');

    createPost(mira, { content: 'Magst du reden?', circleId: raum.id });
    assert.equal(circleTimeline(raum.id).posts.length, 1);
    assert.equal(
      timeline(kim).posts.some((p) => p.content === 'Magst du reden?'),
      false,
      'und nichts davon taucht anderswo auf',
    );
  });

  it('lässt sich nicht mit sich selbst öffnen', () => {
    const { mira, kreis } = aufbau();
    assert.throws(() => openRaum(kreis, mira, mira.id), DomainError);
  });

  it('zählt nur Rückhalt aus diesem Kreis', () => {
    // Sonst wäre der Kreis nicht mehr die Grenze: was woanders passiert ist,
    // öffnet hier keine Tür.
    const { mira, jonas, kreis } = aufbau();
    const anderer = createCircle(mira, { name: 'Ganz woanders', kind: 'topic', joining: 'open' });
    join(anderer, jonas);
    const a = createPost(mira, { content: 'dort', circleId: anderer.id });
    const b = createPost(jonas, { content: 'auch dort', circleId: anderer.id });
    react(jonas.id, a.id);
    react(mira.id, b.id);

    assert.equal(mutualSupporters(kreis.id, mira.id).length, 0, 'im anderen Kreis, nicht in diesem');
    assert.equal(mutualSupporters(anderer.id, mira.id).length, 1);
  });
});
