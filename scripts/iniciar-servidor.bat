@echo off
cd /d C:\Users\THIAGO\Documents\inovaSys\whatsapp-mcp-server
echo ========================================
echo   WhatsApp MCP Server
echo ========================================
echo.
echo O QR code vai aparecer abaixo.
echo Escaneie com o WhatsApp do celular.
echo.
echo WhatsApp -> Configuracoes -> Dispositivos conectados -> Conectar dispositivo
echo.
echo Mantenha esta janela aberta apos escanear.
echo ========================================
echo.

rmdir /s /q .baileys_auth* 2>nul

node dist\mcp-server\index.js

pause
