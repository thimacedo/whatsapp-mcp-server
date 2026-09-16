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
      const html = `<html><head><title>QR Code WhatsApp</title></head><body style="background:#1a1a2e;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif"><h2 style="color:#00d26a">WhatsApp MCP Server</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}" style="background:white;padding:20px;border-radius:12px"><p style="color:#aaa;margin-top:20px">Escaneie com WhatsApp - Dispositivos conectados - Conectar dispositivo</p></body></html>`;
      fs.writeFileSync('qr.html', html);
      exec('start qr.html');
      console.log('QR ABERTO NO NAVEGADOR! Escaneie agora.');
      
      setTimeout(() => { console.log('TIMEOUT'); process.exit(0); }, 60000);
    }
    if (connection === 'open') { 
      console.log('CONECTADO COM SUCESSO!');
      process.exit(0); 
    }
    if (connection === 'close') { 
      console.log('Conexao fechada');
      process.exit(1); 
    }
  });
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
