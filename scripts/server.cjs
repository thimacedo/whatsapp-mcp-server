const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const AUTH_DIR = '.baileys_auth';
let lastQR = '';
let isConnected = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 10;

function log(msg) {
  const time = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${time}] ${msg}`);
}

async function init() {
  const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = 
    await import('@whiskeysockets/baileys');

  // Don't clean auth dir if we have creds
  const hasCreds = fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).some(f => f.startsWith('creds'));
  if (!hasCreds && fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    log('Auth dir limpo (sem credenciais)');
  } else if (hasCreds) {
    log('Credenciais encontradas - mantendo sessão');
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    auth: state,
    version,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 1000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      lastQR = qr;
      log('QR code gerado - aguardando escaneio');
    }
    
    if (connection === 'open') {
      isConnected = true;
      log('CONECTADO COM SUCESSO!');
    }
    
    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      log(`Conexão fechada (status: ${statusCode})`);
      
      if (statusCode !== DisconnectReason.loggedOut) {
        log('Tentando reconectar...');
        setTimeout(() => {
          if (connectionAttempts < MAX_ATTEMPTS) {
            connectionAttempts++;
            init().catch(e => log(`Erro na reconexão: ${e.message}`));
          }
        }, 3000);
      }
    }
  });

  // Periodic buffer snapshot
  sock.ev.on('messages.upsert', () => {});
}

const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected: isConnected, hasQR: !!lastQR, attempts: connectionAttempts }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>WhatsApp MCP</title>
<meta http-equiv="refresh" content="15">
<style>
  body{background:#1a1a2e;color:#eee;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0}
  h1{color:#00d26a;margin-bottom:5px}
  .qr{background:#fff;padding:24px;border-radius:16px;box-shadow:0 0 40px rgba(0,210,106,.3);margin:20px}
  .info{color:#aaa;text-align:center;max-width:480px;margin-top:10px}
  .status{color:#00d26a;font-size:14px;margin-top:8px}
  .error{color:#ff6b6b;font-size:14px}
</style>
</head>
<body>
${isConnected ? '<h1>✅ CONECTADO!</h1><p class="status">Servidor WhatsApp autenticado. Use as ferramentas no chat.</p>' : `
<h1>WhatsApp MCP Server</h1>
<img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(lastQR || 'AGUARDANDO...')}">
<p class="info">Abra o WhatsApp → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong></p>
<p class="status">${lastQR ? 'Escaneia agora!' : 'Gerando QR code...'}</p>
<p class="info">Atualiza sozinho a cada 15s</p>
<script>setTimeout(()=>location.reload(),15000)</script>
`}
</body>
</html>`);
});

server.listen(3001, () => {
  log('Servidor: http://localhost:3001');
  exec('start http://localhost:3001');
});

init().catch(e => log(`Erro init: ${e.message}`));
