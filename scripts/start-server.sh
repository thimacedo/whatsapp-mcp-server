#!/bin/bash
# Script para iniciar o WhatsApp MCP Server mantendo o processo ativo
# O servidor requer stdin aberto para o StdioServerTransport
cd /c/Users/THIAGO/Documents/inovaSys/whatsapp-mcp-server
echo "[whatsapp-mcp] Iniciando servidor..." >&2
rm -rf .baileys_auth*
# Mantém o stdin aberto usando um FIFO enquanto o servidor roda
FIFO=/tmp/mcp-fifo-$$
mkfifo "$FIFO" 2>/dev/null || true
# Abre o FIFO em background para manter stdin aberto
exec 3<>"$FIFO"
# Remove o FIFO do filesystem (mas mantém fd aberto)
rm -f "$FIFO"
# Inicia o servidor com stdin vindo do FIFO
node dist/mcp-server/index.js <&3 >&2 2>&1
exec 3<&-
