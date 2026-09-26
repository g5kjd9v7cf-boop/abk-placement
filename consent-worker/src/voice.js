/**
 * Inbound call assistant for a virtual business number.
 * Twilio posts the call here. The script is fixed: it discloses that it is
 * automatic, writes down the message, and does not keep audio.
 * The route stays closed until TWILIO_AUTH_TOKEN is set. No personal mobile
 * is read from configuration or spoken as the business line.
 */

const VOICES = {
  de: { voice: 'Google.de-DE-Neural2-C', language: 'de-DE' },
  en: { voice: 'Google.en-GB-Neural2-C', language: 'en-GB' },
};

const COPY = {
  de: {
    welcome:
      'Guten Tag. Hier ist der Assistent von MEDA Vermittlung. Sie sprechen mit einem automatischen Assistenten, nicht mit einer Person. Ich schreibe Ihre Nachricht auf und leite sie weiter, damit eine Person Sie später zurückruft. Es wird keine Tonaufnahme gespeichert. Wir geben keine Rechtsberatung und keine Zusage für ein Visum. Bitte nennen Sie keine Gesundheitsdaten. Hinweise zum Datenschutz stehen auf meda minus vermittlung punkt de. Drücken Sie 1 für Deutsch oder 2 für Englisch.',
    name: 'Bitte sagen Sie Ihren Namen.',
    email: 'Wenn Sie eine E-Mail-Adresse angeben möchten, sagen Sie sie jetzt, zum Beispiel name at beispiel punkt de. Sonst sagen Sie: keine.',
    request: 'Bitte sagen Sie kurz, wobei wir helfen sollen.',
    number: 'Wir rufen die Nummer zurück, von der Sie anrufen. Wenn das richtig ist, sagen Sie ja. Wenn Sie eine andere Nummer möchten, sagen Sie diese Nummer jetzt.',
    thanks: 'Danke. Ihre Nachricht ist aufgenommen. Eine Person ruft Sie zurück. Auf Wiederhören.',
    fail: 'Die Nachricht konnte nicht gespeichert werden. Bitte nutzen Sie das Formular auf meda minus vermittlung punkt de schrägstrich kontakt. Auf Wiederhören.',
    again: 'Das habe ich nicht verstanden. Bitte sagen Sie es noch einmal.',
  },
  en: {
    welcome:
      'Good day. This is the assistant of MEDA Vermittlung. You are speaking with an automatic assistant, not a person. I will write down your message and pass it on so a person can call you back. No audio recording is kept. We do not give legal advice and we do not promise a visa. Please do not mention health data. Privacy information is on meda hyphen vermittlung dot de. Press 1 for German or 2 for English.',
    name: 'Please say your name.',
    email: 'If you want to leave an email address, say it now, for example name at example dot com. Otherwise say: none.',
    request: 'Please say briefly what we should help with.',
    number: 'We will call back the number you are calling from. If that is right, say yes. If you want a different number, say that number now.',
    thanks: 'Thank you. Your message has been taken. A person will call you back. Goodbye.',
    fail: 'The message could not be saved. Please use the form at meda hyphen vermittlung dot de slash kontakt. Goodbye.',
    again: 'I did not catch that. Please say it once more.',
  },
};

function clip(value, max) {
  if (value == null) return '';
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function langOf(value) {
  return value === 'en' ? 'en' : 'de';
}

function say(lang, text) {
  const voice = VOICES[langOf(lang)];
  return `<Say voice="${voice.voice}" language="${voice.language}">${escapeXml(text)}</Say>`;
}

function twiml(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

function xmlResponse(body) {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function publicOrigin(request, env) {
  const configured = clip(env && env.PUBLIC_BASE_URL, 200);
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  return new URL(request.url).origin;
}

function stepUrl(request, env, stage, fields) {
  const url = new URL('/voice/step', publicOrigin(request, env));
  url.searchParams.set('stage', stage);
  Object.keys(fields || {}).forEach((key) => {
    const value = fields[key];
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

function gatherSpeech(lang, prompt, action) {
  const voice = VOICES[langOf(lang)];
  return (
    `<Gather input="speech" language="${voice.language}" speechTimeout="auto" action="${escapeXml(action)}" method="POST">` +
    say(lang, prompt) +
    '</Gather>' +
    `<Redirect method="POST">${escapeXml(action)}</Redirect>`
  );
}

export function extractEmail(speech) {
  const normalized = clip(speech, 300)
    .replace(/\s+(at|ät)\s+/gi, '@')
    .replace(/\s+(punkt|dot|point)\s+/gi, '.')
    .replace(/\s+/g, '');
  const match = normalized.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

export function extractPhone(speech) {
  const raw = clip(speech, 80);
  const digits = raw.replace(/[^\d+]/g, '');
  const compact = digits.replace(/(?!^)\+/g, '');
  if (compact.replace(/\D/g, '').length < 6) return '';
  return compact.slice(0, 20);
}

function affirms(speech) {
  const text = clip(speech, 40).toLowerCase();
  return /^(ja|yes|oui|richtig|korrekt|ok|okay|genau)\b/.test(text);
}

function declinesEmail(speech) {
  const text = clip(speech, 40).toLowerCase();
  return /^(keine|keiner|none|no|nein|non)\b/.test(text);
}

export function readFields(url) {
  return {
    stage: url.searchParams.get('stage') || 'start',
    lang: langOf(url.searchParams.get('lang')),
    name: clip(url.searchParams.get('name'), 80),
    mail: clip(url.searchParams.get('mail'), 254),
    msg: clip(url.searchParams.get('msg'), 500),
    from: clip(url.searchParams.get('from'), 20),
    tries: url.searchParams.get('tries') === '1' ? '1' : '',
  };
}

export function nextResponse(request, env, form) {
  const url = new URL(request.url);
  const fields = readFields(url);
  const speech = clip(form.SpeechResult, 500);
  const digits = clip(form.Digits, 4);
  const caller = extractPhone(form.From) || clip(form.From, 20);

  if (fields.stage === 'start' || url.pathname.endsWith('/voice/incoming')) {
    const action = stepUrl(request, env, 'lang', {});
    const inner =
      `<Gather input="dtmf" numDigits="1" timeout="6" action="${escapeXml(action)}" method="POST">` +
      say('de', COPY.de.welcome) +
      '</Gather>' +
      `<Redirect method="POST">${escapeXml(stepUrl(request, env, 'name', { lang: 'de', from: caller }))}</Redirect>`;
    return { twiml: twiml(inner), saved: null };
  }

  if (fields.stage === 'lang') {
    const lang = digits === '2' ? 'en' : 'de';
    const action = stepUrl(request, env, 'name', { lang, from: caller });
    return { twiml: twiml(gatherSpeech(lang, COPY[lang].name, action)), saved: null };
  }

  const lang = fields.lang;
  const copy = COPY[lang];

  if (!speech && fields.stage !== 'lang') {
    if (!fields.tries) {
      const retry = stepUrl(request, env, fields.stage, {
        lang,
        name: fields.name,
        mail: fields.mail,
        msg: fields.msg,
        from: fields.from || caller,
        tries: '1',
      });
      return { twiml: twiml(gatherSpeech(lang, copy.again + ' ' + copy[fields.stage] || copy.again, retry)), saved: null };
    }
  }

  if (fields.stage === 'name') {
    const name = speech || fields.name;
    const action = stepUrl(request, env, 'email', { lang, name, from: fields.from || caller });
    return { twiml: twiml(gatherSpeech(lang, copy.email, action)), saved: null };
  }

  if (fields.stage === 'email') {
    const mail = declinesEmail(speech) ? '' : extractEmail(speech);
    const action = stepUrl(request, env, 'request', {
      lang,
      name: fields.name,
      mail,
      from: fields.from || caller,
    });
    return { twiml: twiml(gatherSpeech(lang, copy.request, action)), saved: null };
  }

  if (fields.stage === 'request') {
    const msg = speech || fields.msg;
    const action = stepUrl(request, env, 'number', {
      lang,
      name: fields.name,
      mail: fields.mail,
      msg,
      from: fields.from || caller,
    });
    return { twiml: twiml(gatherSpeech(lang, copy.number, action)), saved: null };
  }

  const spoken = affirms(speech) ? '' : extractPhone(speech);
  const callback = spoken || fields.from || caller;
  const row = {
    lang,
    caller_name: fields.name,
    caller_number: callback,
    email: fields.mail,
    message: fields.msg || speech,
  };
  return { twiml: null, saved: row, failText: say(lang, copy.fail), thanksText: say(lang, copy.thanks) };
}

async function verifyTwilioSignature(authToken, url, params, signature) {
  if (!authToken || !signature) return false;
  const keys = Object.keys(params).sort();
  let data = url;
  keys.forEach((key) => {
    data += key + params[key];
  });
  const encoded = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoded.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoded.encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function signedUrl(request, env) {
  const url = new URL(request.url);
  const configured = clip(env && env.PUBLIC_BASE_URL, 200);
  if (!configured) return url.origin + url.pathname + url.search;
  try {
    const base = new URL(configured);
    return base.origin + url.pathname + url.search;
  } catch {
    return url.origin + url.pathname + url.search;
  }
}

async function storeMessage(env, row) {
  if (!env || !env.DB) return false;
  const ts = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO call_messages (ts, lang, caller_name, caller_number, email, message)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(ts, row.lang, row.caller_name || null, row.caller_number || null, row.email || null, row.message || '')
    .run();
  return true;
}

async function mailInbox(env, row) {
  const inbox = clip(env && env.CALL_INBOX, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inbox)) return false;
  const reply = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email || '') ? row.email : inbox;
  try {
    const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(inbox), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: row.caller_name || 'Anrufer',
        email: reply,
        phone: row.caller_number || '',
        message: [
          'Telefonische Nachricht über den Assistenten.',
          'Name: ' + (row.caller_name || ''),
          'Rückrufnummer: ' + (row.caller_number || ''),
          'E-Mail: ' + (row.email || ''),
          'Sprache: ' + (row.lang || ''),
          'Nachricht: ' + (row.message || ''),
        ].join('\n'),
        _subject: 'MEDA Rückruf aus dem Telefon-Assistenten',
        _template: 'table',
        _captcha: 'false',
      }),
    });
    return !!res && res.ok;
  } catch {
    return false;
  }
}

export async function handleVoiceRequest(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const token = env && env.TWILIO_AUTH_TOKEN;
  if (!token) {
    return new Response('Not found', { status: 404 });
  }
  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (raw.length > 20000) {
    return new Response('Payload too large', { status: 413 });
  }
  const params = {};
  new URLSearchParams(raw).forEach((value, key) => {
    params[key] = value;
  });
  const signature = request.headers.get('X-Twilio-Signature') || '';
  const valid = await verifyTwilioSignature(token, signedUrl(request, env), params, signature);
  if (!valid) {
    return new Response('Forbidden', { status: 403 });
  }

  const replay = new Request(request.url, { method: 'POST', body: raw });
  const outcome = nextResponse(replay, env || {}, params);
  if (!outcome.saved) {
    return xmlResponse(outcome.twiml);
  }

  let kept = false;
  try {
    kept = await storeMessage(env, outcome.saved);
  } catch {
    kept = false;
  }
  const mailed = await mailInbox(env, outcome.saved);
  if (!kept && !mailed) {
    return xmlResponse(twiml(outcome.failText + '<Hangup/>'));
  }
  return xmlResponse(twiml(outcome.thanksText + '<Hangup/>'));
}

export async function purgeOldCallMessages(env, now = new Date()) {
  if (!env || !env.DB) return { ok: false };
  const cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('DELETE FROM call_messages WHERE ts < ?').bind(cutoff).run();
  return { ok: true, cutoff };
}
