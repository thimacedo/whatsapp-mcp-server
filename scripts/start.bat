@echo off
cd /d C:\Users\THIAGO\Documents\inovaSys\whatsapp-mcp-server
if exist .baileys_auth* rmdir /s /q .baileys_auth*
echo Iniciando WhatsApp MCP Server...
echo.
node dist\mcp-server\index.js
pause
