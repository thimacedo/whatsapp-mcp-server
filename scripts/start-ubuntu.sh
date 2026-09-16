#!/bin/bash
# Servidor HTTP do WhatsApp MCP para rodar no Ubuntu
# Baileys é mais estável no Linux

cd "$(dirname "$0")"

# Limpar processos antigos
pkill -f "node.*whatsapp" 2>/dev/null || true

# Iniciar servidor HTTP na porta 3001
echo "Iniciando WhatsApp MCP Server (HTTP)..."
echo "Acesse: http://localhost:3001"
echo ""
echo "Para conectar ao Hermes no Windows, use:"
echo "  URL: http://SEU_IP_UBUNTU:3001"
echo ""

node http-server.mjs
