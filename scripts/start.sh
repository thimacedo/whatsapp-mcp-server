#!/bin/bash
cd /c/Users/THIAGO/Documents/inovaSys/whatsapp-mcp-server
rm -rf .baileys_auth*
echo "[whatsapp-mcp] Starting WhatsApp MCP server (session: default)" >&2
echo "[whatsapp-mcp] Initializing WhatsApp client..." >&2
node dist/mcp-server/index.js 2>&1
