import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';

const AUTH_DIR = '.baileys_auth';
let pin = '';

async function start() {
  console.log('\n=== WhatsApp MCP Server ===\n');
  
  const fs = await import('fs');
  if (fs.existsSync(AUTH_DIR)) {
    console.log('Limpando credenciais antigas...');
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  console.log('Iniciando WhatsApp...');
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    auth: state,
    version,
    browser: ['Windows', 'Chrome', '138.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      pin = '';
      console.log('\n✅ CONECTADO COM SUCESSO!');
      console.log('Servidor WhatsApp autenticado e pronto para uso.\n');
      process.exit(0);
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`Conexão fechada (${reason})`);
    }
  });

  sock.ev.on('messages.upsert', () => {});

  // Solicitar PIN após conexão inicial
  setTimeout(async () => {
    console.log('\nSolicitando pairing code para 5584996066876...');
    try {
      const code = await sock.requestPairingCode('5584996066876');
      pin = code;
      console.log(`\n✅ PIN: ${code}`);
      console.log('\nNo WhatsApp do celular:');
      console.log('Configurações -> Dispositivos conectados -> Conectar dispositivo -> Digitar código');
      console.log('\nAguardando conexão...\n');
    } catch (err) {
      console.error('Erro ao solicitar PIN:', err.message);
    }
  }, 8000);
}

start().catch(e => {
  console.error('Erro fatal:', e.message);
  process.exit(1);
});
