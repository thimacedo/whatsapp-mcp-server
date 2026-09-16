const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const AUTH_DIR = '.baileys_auth';
let lastQR = '';
let isConnected = false;

async function init() {
  const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = 
    await import('@whiskeysockets/baileys');

  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
  console.log('[WhatsApp] Iniciando...');
  
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({ auth: state, version, browser: ['Windows', 'Edge', '120.0.0.0'] });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) { lastQR = qr; console.log('[WhatsApp] QR gerado'); }
    if (connection === 'open') { isConnected = true; lastQR = ''; console.log('[WhatsApp] CONECTADO!'); }
    if (connection === 'close') { isConnected = false; }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected: isConnected, qr: lastQR }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WhatsApp MCP</title>
<style>
body{background:#1a1a2e;color:#eee;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}
h1{color:#00d26a}
.qr{background:#fff;padding:20px;border-radius:12px;margin:20px}
.info{color:#aaa;margin-top:10px}
</style></head>
<body>
<h1>WhatsApp MCP Server</h1>
<div class="qr"><img id="qr-img" src="" alt="QR Code" width="300" height="300"></div>
<p class="info" id="msg">Gerando QR code...</p>
<script>
const img = document.getElementById('qr-img');
const msg = document.getElementById('msg');
function update() {
  fetch('/status').then(r => r.json()).then(d => {
    if (d.connected) {
      document.body.innerHTML = '<h1 style="color:#00d26a">✅ CONECTADO!</h1>';
      return;
    }
    if (d.qr) {
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' + encodeURIComponent(d.qr);
      msg.textContent = 'Escaneie: WhatsApp → Dispositivos conectados → Conectar dispositivo';
    }
    setTimeout(update, 2000);
  });
}
update();
</script>
</body></html>`);
});

server.listen(3001, () => {
  console.log('[Servidor] http://localhost:3001');
  exec('start http://localhost:3001');
});

init().catch(e => console.error('Erro:', e.message));
