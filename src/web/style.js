/**
 * Stylesheet. Served as a real file so the CSP can forbid inline styles.
 *
 * Three body classes carry user preferences into the visual layer:
 *   .reduced-motion — no transitions or animation at all
 *   .low-stimulus   — muted palette, no colour accents competing for attention
 *   .plain-language — wider line spacing and shorter measure for easier reading
 */

export const STYLESHEET = `
:root {
  color-scheme: light dark;
  --bg: #fbfaf7;
  --surface: #ffffff;
  --ink: #17181c;
  --muted: #5a5f6b;
  --line: #dcdbd4;
  --accent: #2f5d50;
  --accent-ink: #ffffff;
  --warn: #8a3324;
  --radius: 10px;
  --measure: 34rem;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14151a;
    --surface: #1c1e25;
    --ink: #eceef2;
    --muted: #a2a8b6;
    --line: #2f333d;
    --accent: #8fd0bb;
    --accent-ink: #10221d;
    --warn: #f0a08c;
  }
}
body.low-stimulus {
  --accent: #4a4f57;
  --accent-ink: #ffffff;
  --bg: #f4f4f2;
  --surface: #ffffff;
}
@media (prefers-color-scheme: dark) {
  body.low-stimulus { --bg: #17181b; --surface: #1e1f23; --accent: #9aa1ac; --accent-ink: #17181b; }
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
body.plain-language { line-height: 1.9; --measure: 30rem; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
body.reduced-motion *, body.reduced-motion *::before, body.reduced-motion *::after {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}

.skip-link {
  position: absolute;
  left: -9999px;
  background: var(--accent);
  color: var(--accent-ink);
  padding: .6rem 1rem;
}
.skip-link:focus { left: .5rem; top: .5rem; z-index: 10; }

:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

header.site {
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
header.site .inner,
main, footer.site .inner {
  max-width: 46rem;
  margin: 0 auto;
  padding: 1rem;
}
header.site .inner { display: flex; gap: 1rem; align-items: baseline; flex-wrap: wrap; }
header.site a.brand { font-weight: 700; font-size: 1.1rem; text-decoration: none; color: var(--ink); }
nav.site ul { list-style: none; display: flex; gap: .9rem; margin: 0; padding: 0; flex-wrap: wrap; }
a { color: var(--accent); }
main { padding-bottom: 3rem; }

h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
h2 { font-size: 1.15rem; margin: 1.75rem 0 .5rem; }
p, li, label { max-width: var(--measure); }

.card, article.post, .panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1rem;
  margin: 0 0 .75rem;
}
article.post header { display: flex; gap: .5rem; align-items: baseline; flex-wrap: wrap; margin-bottom: .4rem; }
article.post .handle { color: var(--muted); font-size: .9rem; }
article.post .body { white-space: pre-wrap; overflow-wrap: anywhere; }
article.post footer { margin-top: .6rem; display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }

.meta, .muted, small { color: var(--muted); }
.feed-explainer {
  border-left: 4px solid var(--accent);
  padding: .5rem .85rem;
  background: var(--surface);
  border-radius: 0 var(--radius) var(--radius) 0;
  margin-bottom: 1rem;
}
.notice { border: 1px solid var(--line); border-left: 4px solid var(--warn); padding: .75rem 1rem; border-radius: 0 var(--radius) var(--radius) 0; }
.error { color: var(--warn); font-weight: 600; }

form { margin: 0; }
fieldset { border: 1px solid var(--line); border-radius: var(--radius); margin: 0 0 1rem; padding: .75rem 1rem 1rem; }
legend { font-weight: 600; padding: 0 .35rem; }
label { display: block; margin: .75rem 0 .25rem; font-weight: 600; }
label.inline { display: flex; gap: .5rem; align-items: flex-start; font-weight: 400; }
input[type=text], input[type=password], textarea, select {
  width: 100%;
  max-width: var(--measure);
  padding: .55rem .65rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font: inherit;
}
textarea { min-height: 7rem; resize: vertical; }
button, .button {
  font: inherit;
  font-weight: 600;
  padding: .5rem .95rem;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--accent);
  color: var(--accent-ink);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
button.secondary, .button.secondary { background: transparent; color: var(--ink); border-color: var(--line); }
.hint { font-size: .9rem; color: var(--muted); margin-top: .25rem; }

/* Explicit paging. There is no scroll listener in this codebase. */
.pager { margin: 1.25rem 0; text-align: center; }
.pager .end { color: var(--muted); }

footer.site { border-top: 1px solid var(--line); margin-top: 2rem; }
footer.site .inner { font-size: .9rem; color: var(--muted); }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; border-bottom: 1px solid var(--line); padding: .5rem .4rem; vertical-align: top; }
`;
