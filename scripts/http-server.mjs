import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { createServer } from 'http';
import fs from 'fs';

const AUTH_DIR = '.baileys_auth';
const PORT = 3001;

let lastQR = '';
let pairPin = '';
let isConnected = false;
let sock = null;

async function init(phone) {
  const hasCreds = fs.existsSync(`${AUTH_DIR}/creds.json`);
  if (!hasCreds && fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    console.log('[WhatsApp] Credenciais antigas removidas');
  } else if (hasCreds) {
    console.log('[WhatsApp] Usando credenciais salvas');
  }

  console.log('[WhatsApp] Iniciando...');
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  sock = makeWASocket({
    auth: state,
    version,
    browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    defaultQueryTimeoutMs: 60000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      isConnected = true;
      lastQR = '';
      pairPin = '';
      console.log('[WhatsApp] CONECTADO!');
    }
    if (connection === 'close') {
      isConnected = false;
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`[WhatsApp] Conexão fechada (${reason})`);
      if (reason !== DisconnectReason.loggedOut) {
        console.log('[WhatsApp] Reconectando em 5s...');
        setTimeout(() => init(phone), 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', () => {});

  if (!hasCreds) {
    setTimeout(async () => {
      console.log(`[WhatsApp] Solicitando PIN para ${phone}...`);
      try {
        const pin = await sock.requestPairingCode(phone);
        pairPin = pin;
        console.log(`[WhatsApp] PIN: ${pin}`);
      } catch (e) {
        console.error('[WhatsApp] Erro PIN:', e.message);
      }
    }, 5000);
  }
}

const server = createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      connected: isConnected, 
      pin: pairPin, 
      qr: lastQR,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WhatsApp</title>
<style>body{background:#1a1a2e;color:#eee;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}
h1{color:#00d26a}.pin-box{background:#fff;color:#1a1a2e;padding:30px 60px;border-radius:16px;font-size:48px;font-weight:bold;letter-spacing:12px;box-shadow:0 0 40px rgba(0,210,106,.4);margin:20px}
.info{color:#aaa;text-align:center;max-width:500px;margin-top:10px}</style>
</head><body>
<h1>WhatsApp MCP Server</h1>
<div class="pin-box" id="pin">${pairPin || 'CONECTADO'}</div>
<p class="info" id="msg">${isConnected ? '✅ Autenticado e pronto para uso!' : pairPin ? `WhatsApp → Dispositivos → Conectar → Digitar: ${pairPin.slice(0,4)}-${pairPin.slice(4)}` : 'Iniciando...'}</p>
<script>
setInterval(() => {
  fetch('/status').then(r => r.json()).then(d => {
    if (d.connected) {
      document.body.innerHTML = '<h1 style="color:#00d26a">✅ CONECTADO</h1><p>Servidor autenticado e pronto.</p>';
    } else if (d.pin) {
      document.getElementById('pin').textContent = d.pin.slice(0,4) + '-' + d.pin.slice(4);
      document.getElementById('msg').textContent = 'WhatsApp → Dispositivos → Conectar → Digitar PIN';
    }
  });
}, 5000);
</script>
</body></html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Servidor] http://0.0.0.0:${PORT}`);
});

// Número padrão - passe como argumento se quiser outro
const phone = process.argv[2] || '5584996066876';
init(phone).catch(e => console.error('Erro fatal:', e.message));
