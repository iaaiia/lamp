/** Minimal routing and request/response helpers (no framework dependency). */

export function createRouter() {
  const routes = [];

  const add = (method, pattern, handler) => {
    const names = [];
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/:([a-zA-Z_]+)/g, (_, name) => {
            names.push(name);
            return '([^/]+)';
          }) +
        '$',
    );
    routes.push({ method, regex, names, handler });
  };

  return {
    get: (p, h) => add('GET', p, h),
    post: (p, h) => add('POST', p, h),
    match(method, pathname) {
      for (const route of routes) {
        if (route.method !== method) continue;
        const match = pathname.match(route.regex);
        if (!match) continue;
        const params = {};
        route.names.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { handler: route.handler, params };
      }
      return null;
    },
  };
}

export async function readBody(req, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('payload too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function parseForm(body) {
  const params = new URLSearchParams(body);
  const out = {};
  for (const [key, value] of params) out[key] = value;
  return out;
}

export function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

/** ActivityStreams responses need the AS2 content type to federate correctly. */
export function sendActivityJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/activity+json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function sendHtml(res, status, html) {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(html),
    'referrer-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
    'content-security-policy':
      "default-src 'self'; img-src 'self' data: https:; style-src 'self'; script-src 'none'; form-action 'self'",
  });
  res.end(html);
}

export function redirect(res, location, cookie) {
  const headers = { location };
  if (cookie) headers['set-cookie'] = cookie;
  res.writeHead(303, headers);
  res.end();
}

export const sessionCookie = (id) =>
  `lamb_session=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;

export const clearSessionCookie = () => 'lamb_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

/** Does the client want ActivityStreams rather than HTML? */
export function wantsActivityJson(req) {
  const accept = req.headers.accept ?? '';
  return accept.includes('application/activity+json') || accept.includes('application/ld+json');
}
