const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const AUTH_DIR = '.baileys_auth';
let sock;
let lastQR = '';
let isConnected = false;

async function init() {
  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
  const { state } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({ auth: state, version });

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) {
      lastQR = qr;
      console.log('QR atualizado');
    }
    if (connection === 'open') {
      isConnected = true;
      console.log('CONECTADO!');
    }
    if (connection === 'close') {
      isConnected = false;
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/qr' && lastQR) {
    const qr = encodeURIComponent(lastQR);
    res.writeHead(200, { 'Content-Type': 'image/png' });
    // Redirect to QR generator
    res.writeHead(302, { 'Location': `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${qr}` });
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>WhatsApp MCP Server</title>
<meta http-equiv="refresh" content="20">
<style>
  body { background:#1a1a2e; color:#eee; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  h2 { color:#00d26a; }
  img { background:#fff; padding:20px; border-radius:12px; box-shadow:0 0 30px rgba(0,210,106,0.3); margin:20px; }
  .info { color:#aaa; text-align:center; max-width:500px; }
  .connected { color:#00d26a; font-size:2em; }
</style>
</head>
<body>
${isConnected ? '<h2 class="connected">CONECTADO!</h2><p>Servidor WhatsApp autenticado. Pode usar as ferramentas.</p>' : `
<h2>WhatsApp MCP Server</h2>
<img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(lastQR || '')}" alt="QR Code">
<p class="info">Escaneie com o WhatsApp<br><strong>Configurações → Dispositivos conectados → Conectar dispositivo</strong></p>
<p class="info">A página atualiza a cada 20 segundos automaticamente.</p>
<script>
setTimeout(() => location.reload(), 20000);
</script>
`}
</body>
</html>`);
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Servidor rodando em http://localhost:3001');
  exec('start http://localhost:3001');
  console.log('Navegador aberto! Escaneie o QR code.');
});

init().catch(e => { console.error('Erro:', e.message); });
