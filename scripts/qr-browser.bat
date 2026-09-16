@echo off
cd /d C:\Users\THIAGO\Documents\inovaSys\whatsapp-mcp-server
rmdir /s /q .baileys_auth* 2>nul
echo Gerando QR code...
node -e "
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { exec } = require('child_process');

async function main() {
  const AUTH_DIR = '.baileys_auth';
  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
  
  const { state } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({ auth: state, version });
  
  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) { 
      const qrData = encodeURIComponent(qr);
      const html = '<html><head><title>QR Code WhatsApp</title></head><body style=\"background:#1a1a2e;display:flex;justify-content:center;align-items:center;height:100vh;margin:0\"><img src=\"https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + qrData + '\" style=\"background:white;padding:20px;border-radius:12px\"></body></html>';
      fs.writeFileSync('qr.html', html);
      exec('start qr.html');
      console.log('QR CODE ABERTO NO NAVEGADOR!');
      console.log('Escaneie com o WhatsApp - Dispositivos conectados - Conectar dispositivo');
      console.log('Este processo vai aguardar 60 segundos para escanear...');
      
      // Manter vivo para escanear
      setTimeout(() => { console.log('TIMEOUT'); process.exit(0); }, 60000);
    }
    if (connection === 'open') { 
      console.log('CONECTADO COM SUCESSO! WhatsApp autenticado.');
      process.exit(0); 
    }
    if (connection === 'close') { 
      console.log('Conexao fechada');
      process.exit(1); 
    }
  });
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
"
echo.
echo Processo finalizado.
pause
