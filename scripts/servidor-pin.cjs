const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const AUTH_DIR = '.baileys_auth';
let pairPin = '';
let isConnected = false;

async function init(phoneNumber) {
  const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = 
    await import('@whiskeysockets/baileys');

  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
  console.log('[WhatsApp] Iniciando...');
  
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({ 
    auth: state, 
    version, 
    browser: ['Windows', 'Edge', '120.0.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') { 
      isConnected = true; 
      pairPin = ''; 
      console.log('[WhatsApp] CONECTADO!'); 
    }
    if (connection === 'close') { 
      isConnected = false; 
      console.log('[WhatsApp] Fechada');
    }
  });

  console.log(`[WhatsApp] Solicitando PIN para ${phoneNumber}...`);
  try {
    const pin = await sock.requestPairingCode(phoneNumber);
    pairPin = pin;
    console.log(`[WhatsApp] PIN: ${pin}`);
  } catch (e) {
    console.error('[WhatsApp] Erro:', e.message);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected: isConnected, pin: pairPin }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WhatsApp MCP</title>
<style>
body{background:#1a1a2e;color:#eee;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}
h1{color:#00d26a}
.pin-box{background:#fff;color:#1a1a2e;padding:30px 60px;border-radius:16px;font-size:56px;font-weight:bold;letter-spacing:12px;box-shadow:0 0 40px rgba(0,210,106,.4);margin:20px}
.info{color:#aaa;margin-top:12px;text-align:center;max-width:500px}
</style></head>
<body>
<h1>WhatsApp MCP Server</h1>
<div class="pin-box" id="pin">${pairPin || 'AGUARDANDO'}</div>
<p class="info" id="msg">${pairPin ? 'Digite este PIN no WhatsApp' : 'Aguardando...'}</p>
<script>
function update() {
  fetch('/status').then(r => r.json()).then(d => {
    if (d.connected) {
      document.body.innerHTML = '<h1 style="color:#00d26a">✅ CONECTADO!</h1>';
      return;
    }
    if (d.pin) {
      document.getElementById('pin').textContent = d.pin;
      document.getElementById('msg').textContent = 'WhatsApp → Dispositivos conectados → Conectar → Digitar PIN';
    }
    setTimeout(update, 3000);
  });
}
update();
</script>
</body></html>`);
});

server.listen(3002, () => {
  console.log('[Servidor] http://localhost:3002');
});

init('5584996066876').catch(e => console.error('Erro:', e.message));
