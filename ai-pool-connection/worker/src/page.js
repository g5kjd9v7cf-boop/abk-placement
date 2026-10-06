// Inlined, mobile-first HTML for the Worker. Single-file so one `wrangler
// deploy` serves the whole app — ideal for opening on an iPhone.

const STYLE = `
:root{--bg:#0b1020;--panel:#141b31;--panel2:#1c2540;--accent:#5b8cff;--accent2:#22c58b;--text:#e8ecf6;--muted:#9aa6c4}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text)}
.wrap{display:flex;flex-direction:column;height:100dvh}
header{padding:12px 16px;background:var(--panel);border-bottom:1px solid #24304f;display:flex;align-items:center;gap:10px}
header h1{font-size:16px;margin:0}
header .sp{flex:1}
header a{color:var(--muted);font-size:13px;text-decoration:none}
.providers{display:flex;gap:6px;overflow-x:auto;padding:8px 16px;background:var(--panel);border-bottom:1px solid #24304f;-webkit-overflow-scrolling:touch}
.chip{white-space:nowrap;font-size:12px;color:var(--muted);border:1px solid #33406a;border-radius:999px;padding:3px 10px;display:flex;gap:6px;align-items:center}
.dot{width:8px;height:8px;border-radius:50%;background:#445}
.dot.on{background:var(--accent2);box-shadow:0 0 8px var(--accent2)}
.msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.msg{max-width:85%;padding:11px 14px;border-radius:14px;line-height:1.45;white-space:pre-wrap;font-size:15px}
.msg.user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}
.msg.jarvis{align-self:flex-start;background:var(--panel2);border-bottom-left-radius:4px}
.msg .meta{display:block;font-size:11px;color:var(--muted);margin-top:6px}
form.composer{display:flex;gap:8px;padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));border-top:1px solid #24304f;background:var(--panel)}
form.composer input{flex:1;background:var(--panel2);border:1px solid #33406a;color:var(--text);border-radius:12px;padding:12px 14px;font-size:16px}
form.composer input:focus{outline:none;border-color:var(--accent)}
form.composer button{background:var(--accent);color:#fff;border:none;border-radius:12px;padding:0 18px;font-size:15px}
.login{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:var(--panel);border:1px solid #24304f;border-radius:16px;padding:24px;width:100%;max-width:340px}
.card h1{font-size:20px;margin:0 0 4px}
.card p{color:var(--muted);font-size:13px;margin:0 0 16px}
.card input{width:100%;background:var(--panel2);border:1px solid #33406a;color:var(--text);border-radius:12px;padding:12px 14px;font-size:16px;margin-bottom:12px}
.card button{width:100%;background:var(--accent);color:#fff;border:none;border-radius:12px;padding:12px;font-size:16px}
.err{color:#ff7a7a;font-size:13px;margin-bottom:12px}
`;

export const PAGE_HTML = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<title>AI Pool Connection</title><style>${STYLE}</style></head>
<body><div class="wrap">
<header><h1>AI Pool Connection</h1><span class="sp"></span><span id="budget" style="font-size:12px;color:var(--muted)"></span>&nbsp;<a href="/logout">Sign out</a></header>
<div class="providers" id="providers"></div>
<div class="msgs" id="msgs"></div>
<form class="composer" id="form"><input id="input" placeholder="Ask Jarvis…" autocomplete="off"/><button>Send</button></form>
</div>
<script>
const msgs=document.getElementById('msgs'),form=document.getElementById('form'),input=document.getElementById('input'),provEl=document.getElementById('providers'),budget=document.getElementById('budget');
function add(role,text,meta){const el=document.createElement('div');el.className='msg '+role;el.textContent=text;if(meta){const m=document.createElement('span');m.className='meta';m.textContent=meta;el.appendChild(m)}msgs.appendChild(el);msgs.scrollTop=msgs.scrollHeight;return el}
function renderProviders(s){if(!s)return;provEl.innerHTML='';s.providers.forEach(p=>{const c=document.createElement('div');c.className='chip';c.innerHTML='<span class="dot '+(p.configured?'on':'')+'"></span>'+p.label+' · '+p.tier;provEl.appendChild(c)})}
async function loadStatus(){try{const r=await fetch('/api/status');if(r.status===401){location.href='/login';return}renderProviders(await r.json())}catch(e){}}
form.addEventListener('submit',async e=>{e.preventDefault();const t=input.value.trim();if(!t)return;input.value='';add('user',t);const typing=add('jarvis','Thinking…');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})});const d=await r.json();typing.remove();if(!r.ok){add('jarvis','Error: '+(d.error||r.status));return}add('jarvis',d.text,d.providerLabel+' · '+d.model+' · '+d.tier);renderProviders(d.status)}catch(err){typing.remove();add('jarvis','Error: '+err.message)}});
add('jarvis',"Hi, I'm Jarvis. I pool multiple AI models and pick the cheapest capable one. Ask me anything.");
loadStatus();
</script></body></html>`;

export const LOGIN_HTML = (error) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Sign in · AI Pool Connection</title><style>${STYLE}</style></head>
<body><div class="login"><form class="card" method="POST" action="/login">
<h1>AI Pool Connection</h1><p>Enter your password to continue.</p>
${error ? `<div class="err">${error}</div>` : ''}
<input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus/>
<button type="submit">Sign in</button>
</form></div></body></html>`;
