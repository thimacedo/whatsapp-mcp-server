import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { createServer } from 'http';
import { exec } from 'child_process';
import fs from 'fs';

const AUTH_DIR = '.baileys_auth';
const PORT = 3003;

let pin = '';
let connected = false;
let sock = null;

async function start() {
  // Limpar apenas se nao existir creds
  const hasCreds = fs.existsSync(`${AUTH_DIR}/creds.json`);
  if (!hasCreds && fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    console.log('[WhatsApp] Credenciais antigas removidas');
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  sock = makeWASocket({
    auth: state,
    version,
    browser: ['Windows', 'Chrome', '138.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      connected = true;
      pin = '';
      console.log('[WhatsApp] CONECTADO COM SUCESSO!');
      return;
    }
    if (connection === 'close') {
      connected = false;
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`[WhatsApp] Fechada (${reason})`);
    }
  });

  // Esperar 5s para o socket estabilizar, solicitar PIN
  setTimeout(async () => {
    console.log('[WhatsApp] Solicitando pairing code para 5584996066876...');
    try {
      const code = await sock.requestPairingCode('5584996066876');
      pin = code;
      console.log(`[WhatsApp] ✅ PIN: ${code}`);
      console.log(`[WhatsApp] Digite em: WhatsApp -> Dispositivos conectados -> Conectar -> Digitar código`);
    } catch (err) {
      console.error('[WhatsApp] Erro pairing code:', err.message);
      // Tentar QR como fallback
      console.log('[WhatsApp] Tentando QR code como fallback...');
    }
  }, 5000);
}

const server = createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected, pin }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>WhatsApp</title>
<style>body{background:#1a1a2e;color:#eee;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}
.pin{background:#fff;color:#000;padding:20px 40px;border-radius:12px;font-size:36px;font-weight:bold;letter-spacing:8px;margin:15px}
.info{color:#ccc;margin:8px}</style>
</head>
<body>
<h1>WhatsApp MCP</h1>
<div class="pin" id="p">${pin || 'GERANDO...'}</div>
<p class="info" id="m">${pin ? 'WhatsApp → Dispositivos → Conectar → Digitar PIN' : 'Aguarde...'}</p>
<script>
setInterval(() => {
  fetch('/status').then(r => r.json()).then(d => {
    if (d.connected) { document.body.innerHTML = '<h1 style="color:#0d0">✅ CONECTADO!</h1>'; return; }
    if (d.pin) { document.getElementById('p').textContent = d.pin; document.getElementById('m').textContent = 'WhatsApp → Dispositivos → Conectar → Digitar PIN'; }
  });
}, 3000);
</script>
</body></html>`);
});

server.listen(PORT, () => {
  console.log(`[Servidor] http://localhost:${PORT}`);
  exec(`start http://localhost:${PORT}`);
});

start().catch(e => console.error('[Erro fatal]', e.message));
