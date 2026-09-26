// Web server for AI Pool Connection. Serves the chat UI and a small JSON API.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jarvis } from './src/jarvis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// One shared Jarvis instance per server process (simple demo scope).
const jarvis = new Jarvis();

app.get('/api/status', (req, res) => {
  res.json(jarvis.status());
});

app.post('/api/chat', async (req, res) => {
  const { message, mode, prefer } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) required' });
  }
  try {
    if (mode === 'council') {
      const r = await jarvis.council(message);
      return res.json({ mode: 'council', ...r, status: jarvis.status() });
    }
    const r = await jarvis.chat(message, { prefer });
    return res.json({ mode: 'chat', ...r, status: jarvis.status() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset', (req, res) => {
  jarvis.reset();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`AI Pool Connection web UI on http://localhost:${PORT}`);
});
