/**
 * Key management, password hashing and HTTP Signatures (draft-cavage-12), the
 * signature scheme the Fediverse actually uses for server-to-server auth.
 */

import {
  generateKeyPairSync,
  createSign,
  createVerify,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

export function generateKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, salt, expected] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const actual = scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('hex');

export function digestHeader(body) {
  return `SHA-256=${createHash('sha256').update(body).digest('base64')}`;
}

/** Build the string that gets signed, per the `headers` list of a signature. */
function signingString(headerNames, { method, path, headers }) {
  return headerNames
    .map((name) => {
      if (name === '(request-target)') {
        return `(request-target): ${method.toLowerCase()} ${path}`;
      }
      return `${name}: ${headers[name] ?? ''}`;
    })
    .join('\n');
}

/**
 * Sign an outgoing request.
 * @returns headers to merge into the request.
 */
export function signRequest({ keyId, privateKey, method, url, body }) {
  const target = new URL(url);
  const headers = {
    host: target.host,
    date: new Date().toUTCString(),
    digest: digestHeader(body ?? ''),
    'content-type': 'application/activity+json',
  };
  const names = ['(request-target)', 'host', 'date', 'digest'];
  const signature = createSign('sha256')
    .update(signingString(names, { method, path: target.pathname + target.search, headers }))
    .sign(privateKey, 'base64');

  headers.signature =
    `keyId="${keyId}",algorithm="rsa-sha256",headers="${names.join(' ')}",signature="${signature}"`;
  return headers;
}

export function parseSignatureHeader(value) {
  if (!value) return null;
  const fields = {};
  for (const match of value.matchAll(/([a-zA-Z]+)="([^"]*)"/g)) {
    fields[match[1]] = match[2];
  }
  if (!fields.keyId || !fields.signature) return null;
  fields.headers = (fields.headers ?? 'date').split(' ');
  return fields;
}

/**
 * Verify an inbound signature against a PEM public key.
 * Returns `{ ok, reason }` so the caller can log why a delivery was rejected.
 */
export function verifySignature({ signature, publicKey, method, path, headers, body }) {
  if (!signature) return { ok: false, reason: 'missing signature' };

  if (signature.headers.includes('digest')) {
    if (headers.digest !== digestHeader(body ?? '')) {
      return { ok: false, reason: 'digest mismatch' };
    }
  }
  if (headers.date) {
    const skew = Math.abs(Date.now() - Date.parse(headers.date));
    if (Number.isNaN(skew) || skew > 12 * 60 * 60 * 1000) {
      return { ok: false, reason: 'stale date header' };
    }
  }

  const expected = signingString(signature.headers, { method, path, headers });
  const ok = createVerify('sha256')
    .update(expected)
    .verify(publicKey, signature.signature, 'base64');
  return ok ? { ok: true } : { ok: false, reason: 'bad signature' };
}
