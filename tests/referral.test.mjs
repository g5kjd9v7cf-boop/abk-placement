import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('../js/referral.js', import.meta.url), 'utf8');

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function el(tag, attrs = {}) {
  const node = {
    tagName: String(tag).toUpperCase(),
    attrs: { ...attrs },
    children: [],
    parentNode: null,
    value: attrs.value || '',
    setAttribute(name, value) {
      node.attrs[name] = String(value);
      if (name === 'value') node.value = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(node.attrs, name) ? node.attrs[name] : null;
    },
    appendChild(child) {
      child.parentNode = node;
      node.children.push(child);
      return child;
    },
    addEventListener() {},
  };
  node.querySelectorAll = (sel) => queryAll(node, sel);
  node.querySelector = (sel) => queryAll(node, sel)[0] || null;
  return node;
}

function matches(node, sel) {
  const attrStar = sel.match(/^([a-z]+)\[([a-z-]+)\*="([^"]+)"\]$/i);
  if (attrStar) {
    return node.tagName === attrStar[1].toUpperCase()
      && String(node.getAttribute(attrStar[2]) || '').includes(attrStar[3]);
  }
  const attrEq = sel.match(/^([a-z]+)\[([a-z-]+)="([^"]+)"\]$/i);
  if (attrEq) {
    return node.tagName === attrEq[1].toUpperCase()
      && node.getAttribute(attrEq[2]) === attrEq[3];
  }
  const attrHas = sel.match(/^([a-z]+)\[([a-z-]+)\]$/i);
  if (attrHas) {
    return node.tagName === attrHas[1].toUpperCase() && node.getAttribute(attrHas[2]) != null;
  }
  return false;
}

function queryAll(rootNode, sel) {
  const out = [];
  (rootNode.children || []).forEach((child) => {
    if (matches(child, sel)) out.push(child);
    out.push(...queryAll(child, sel));
  });
  return out;
}

function boot({ href, readyState = 'complete', allowlist = ['M001', 'M002'], fetchFails = false }) {
  const writes = [];
  const historyCalls = [];
  const body = el('body');
  const formA = el('form', { action: 'https://formsubmit.co/meda-vermittlung@agentmail.to' });
  formA.appendChild(el('input', { type: 'hidden', name: 'ref_code', value: 'direkt' }));
  const formB = el('form', { action: 'https://formsubmit.co/meda-vermittlung@agentmail.to' });
  body.appendChild(formA);
  body.appendChild(formB);
  body.appendChild(el('a', { href: 'bewerben.html' }));
  body.appendChild(el('a', { href: 'leistungen.html?x=1#a' }));
  body.appendChild(el('a', { href: 'bewerben.html?ref=OLD' }));
  body.appendChild(el('a', { href: 'mailto:meda-vermittlung@agentmail.to' }));
  body.appendChild(el('a', { href: 'https://example.com/out' }));
  body.appendChild(el('a', { href: '#main' }));
  body.appendChild(el('a', { href: 'https://meda-vermittlung.de/kontakt.html' }));

  const listeners = {};
  const doc = {
    readyState,
    body,
    listeners,
    addEventListener(type, fn) {
      (listeners[type] ||= []).push(fn);
    },
    createElement(tag) {
      return el(tag);
    },
    querySelectorAll(sel) {
      return queryAll(body, sel);
    },
    querySelector(sel) {
      return queryAll(body, sel)[0] || null;
    },
  };
  let cookieJar = '';
  Object.defineProperty(doc, 'cookie', {
    configurable: true,
    get() {
      writes.push('cookie.read');
      return cookieJar;
    },
    set(value) {
      writes.push(`cookie.write:${value}`);
      cookieJar = String(value);
    },
  });

  function trap(label) {
    return {
      getItem() {
        writes.push(`${label}.getItem`);
        return null;
      },
      setItem() {
        writes.push(`${label}.setItem`);
      },
      removeItem() {
        writes.push(`${label}.removeItem`);
      },
      clear() {
        writes.push(`${label}.clear`);
      },
      key() {
        writes.push(`${label}.key`);
        return null;
      },
      get length() {
        writes.push(`${label}.length`);
        return 0;
      },
    };
  }

  const pageUrl = new URL(href);
  const location = {
    href: pageUrl.href,
    origin: pageUrl.origin,
    pathname: pageUrl.pathname,
    search: pageUrl.search,
    hash: pageUrl.hash,
  };
  const win = {
    location,
    document: doc,
    history: {
      replaceState() {
        historyCalls.push('replaceState');
      },
      pushState() {
        historyCalls.push('pushState');
      },
    },
    sessionStorage: trap('sessionStorage'),
    localStorage: trap('localStorage'),
    indexedDB: trap('indexedDB'),
    fetch(_url) {
      if (fetchFails) return Promise.reject(new Error('offline'));
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({ codes: allowlist });
        },
      });
    },
  };

  const context = {
    window: win,
    document: doc,
    sessionStorage: win.sessionStorage,
    localStorage: win.localStorage,
    indexedDB: win.indexedDB,
    history: win.history,
    location,
    URL,
    URLSearchParams,
    Promise,
    JSON,
    RegExp,
    console,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'js/referral.js' });
  return { win, writes, historyCalls, doc, body, location };
}

async function settle(page) {
  if (page.doc.readyState === 'loading') {
    page.doc.readyState = 'complete';
    for (const fn of page.doc.listeners.DOMContentLoaded || []) fn();
  }
  return page.win.MEDA_referral.ready;
}

function fieldValues(body) {
  return queryAll(body, 'input[name="ref_code"]').map((input) => input.value);
}

function hrefs(body) {
  return queryAll(body, 'a[href]').map((anchor) => anchor.getAttribute('href'));
}

test('referral script does not mention browser storage or history edits', () => {
  for (const token of ['localStorage', 'sessionStorage', 'cookie', 'indexedDB', 'replaceState', 'pushState']) {
    assert.equal(source.includes(token), false, token);
  }
});

test('?ref=M001 fills ref_code, keeps the query, and rewrites same-site links', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/index.html?ref=M001' });
  const value = await settle(page);
  assert.equal(value, 'M001');
  assert.deepEqual(fieldValues(page.body), ['M001', 'M001']);
  assert.deepEqual(hrefs(page.body), [
    'bewerben.html?ref=M001',
    'leistungen.html?x=1&ref=M001#a',
    'bewerben.html?ref=M001',
    'mailto:meda-vermittlung@agentmail.to',
    'https://example.com/out',
    '#main',
    'https://meda-vermittlung.de/kontakt.html?ref=M001',
  ]);
  assert.equal(page.location.href, 'https://meda-vermittlung.de/index.html?ref=M001');
  assert.equal(page.location.search, '?ref=M001');
  assert.deepEqual(page.writes, []);
  assert.deepEqual(page.historyCalls, []);
});

test('an unknown code becomes direkt and is not copied onto links', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/bewerben.html?ref=NOPE' });
  const value = await settle(page);
  assert.equal(value, 'direkt');
  assert.deepEqual(fieldValues(page.body), ['direkt', 'direkt']);
  assert.equal(hrefs(page.body)[0], 'bewerben.html');
  assert.equal(page.location.search, '?ref=NOPE');
  assert.deepEqual(page.writes, []);
  assert.deepEqual(page.historyCalls, []);
});

test('inactive and malformed codes become direkt without storage writes', async () => {
  for (const ref of ['M003', 'M01', 'M00001', 'm00', '']) {
    const page = boot({ href: `https://meda-vermittlung.de/bewerben.html?ref=${encodeURIComponent(ref)}` });
    const value = await settle(page);
    assert.equal(value, 'direkt', ref);
    assert.deepEqual(page.writes, [], ref);
    assert.deepEqual(page.historyCalls, [], ref);
  }
});

test('a lowercase active code is normalized only on the field and the links', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/fuer-fachkraefte.html?ref=m001' });
  const value = await settle(page);
  assert.equal(value, 'M001');
  assert.equal(hrefs(page.body)[0], 'bewerben.html?ref=M001');
  assert.equal(page.location.search, '?ref=m001');
  assert.deepEqual(page.writes, []);
});

test('a missing ref stays direkt and writes nothing', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/bewerben.html' });
  const value = await settle(page);
  assert.equal(value, 'direkt');
  assert.equal(hrefs(page.body)[0], 'bewerben.html');
  assert.equal(page.location.search, '');
  assert.deepEqual(page.writes, []);
  assert.deepEqual(page.historyCalls, []);
});

test('the field is filled only after the document is ready', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/bewerben.html?ref=M001', readyState: 'loading' });
  assert.deepEqual(fieldValues(page.body), ['direkt']);
  const value = await settle(page);
  assert.equal(value, 'M001');
  assert.deepEqual(fieldValues(page.body), ['M001', 'M001']);
  assert.deepEqual(page.writes, []);
});

test('a failed allowlist read becomes direkt and still writes nothing', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/index.html?ref=M001', fetchFails: true });
  const value = await settle(page);
  assert.equal(value, 'direkt');
  assert.equal(hrefs(page.body)[0], 'bewerben.html');
  assert.deepEqual(page.writes, []);
});

test('a link added later still receives the code on click', async () => {
  const page = boot({ href: 'https://meda-vermittlung.de/index.html?ref=M001' });
  await settle(page);
  const late = el('a', { href: 'integration.html' });
  page.body.appendChild(late);
  const click = page.doc.listeners.click[0];
  click({ target: late });
  assert.equal(late.getAttribute('href'), 'integration.html?ref=M001');
  assert.deepEqual(page.writes, []);
});

test('every page loads the script, and Bewerbung carries ref_code', () => {
  const pages = readdirSync(new URL('../', import.meta.url)).filter((name) => name.endsWith('.html'));
  assert.ok(pages.includes('bewerben.html'));
  for (const name of pages) {
    const html = read(name);
    assert.equal(html.split('js/referral.js').length - 1, 1, name);
  }
  const apply = read('bewerben.html');
  assert.equal(apply.split('name="ref_code"').length - 1, 2);
  assert.equal(apply.split('value="direkt"').length - 1, 2);
  assert.match(apply, /action="https:\/\/formsubmit\.co\/meda-vermittlung@agentmail\.to"/);
});

test('the public allowlist is codes only and matches the active example rows', () => {
  const allowlist = JSON.parse(read('data/referral-codes.json'));
  assert.deepEqual(Object.keys(allowlist), ['codes']);
  for (const code of allowlist.codes) assert.match(code, /^M\d{3,4}$/);
  const lines = read('tools/referrals/marketers.example.csv').trim().split('\n').slice(1);
  const active = [];
  const inactive = [];
  for (const line of lines) {
    const [code, name, flag] = line.split(',');
    assert.ok(name);
    if (flag === 'yes') active.push(code);
    else inactive.push(code);
  }
  assert.deepEqual(active, allowlist.codes);
  for (const code of inactive) assert.equal(allowlist.codes.includes(code), false);
});

test('Pages exclude and gitignore keep the register off the site', () => {
  const config = read('_config.yml');
  for (const entry of ['CNAME', 'consent-worker', 'tools', 'tests']) {
    assert.match(config, new RegExp(`- ${entry}\\b`));
  }
  const ignore = read('.gitignore');
  assert.match(ignore, /tools\/referrals\/\*\.csv/);
  assert.match(ignore, /!tools\/referrals\/marketers\.example\.csv/);
  const csvs = readdirSync(new URL('../tools/referrals/', import.meta.url)).filter((name) => name.endsWith('.csv'));
  assert.deepEqual(csvs, ['marketers.example.csv']);
});
