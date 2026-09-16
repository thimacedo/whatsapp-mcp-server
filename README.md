# WhatsApp MCP Server

Servidor MCP para integração WhatsApp via Baileys (ericporres/whatsapp-mcp-server).

## Problemas Resolvidos

### 1. TypeScript outDir não funcionava no Windows
**Arquivo:** `tsconfig.json`  
**Fix:** mudou `"outDir": "dist"` → `"./dist"` e `"rootDir": "src"` → `"./src"`

### 2. QR code não era emitido
**Arquivo:** `src/mcp-server/whatsapp.ts`  
**Fix:** adicionou handler `qr` no evento `connection.update` que escreve o QR string em stderr e salva em `/tmp/whatsapp-qr.txt`

### 3. Baileys 7.x ESM-only vs hub.js CommonJS
**Arquivo:** `hub.mjs` (novo, em `comunicacao-hub/`)  
**Fix:** reescreveu `hub.js` como ESM (`hub.mjs`) com `"type": "module"` no package.json

### 4. Node 24 incompatível com Baileys no Windows
**Fix:** usar Node 20.11.0 via nvm-windows (`C:\Users\THIAGO\AppData\Local\nvm\v20.11.0\node.exe`)

### 5. Token HUB_TOKEN era placeholder
**Fix:** gerado token seguro via `crypto.randomBytes(32).toString('hex')` e atualizado `.env`

## Scripts

| Script | Função |
|--------|--------|
| `scripts/run-hub-esm.bat` | Inicia Hub com Node 20 (ESM) no Windows |
| `scripts/enviar.ps1` | Envia mensagem via Hub API |
| `scripts/start.sh` | Inicia servidor MCP (Linux) |

## Uso

```powershell
# Iniciar Hub
scripts\run-hub-esm.bat

# Enviar mensagem (PowerShell)
$body = @{telefone="5584996066876"; mensagem="Teste"} | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "http://127.0.0.1:5000/send" -Method Post `
  -Headers @{"x-hub-token"="<TOKEN>"} -Body $body -ContentType "application/json"
```

## Endpoints do Hub

- `GET /health` - Status
- `POST /send` - Enviar mensagem (header `x-hub-token`)
- `POST /pair` - Gerar código de emparelhamento

## Dependências

- `@whiskeysockets/baileys` ^7.x (ESM)
- Node 20.11.0 (via nvm-windows)
- Express, ws, qrcode, dotenv
