@echo off
cd /d C:\Users\THIAGO\Documents\inovaSys\whatsapp-mcp-server
echo ============================================
echo    WhatsApp MCP Server - QR Code
echo ============================================
echo.
echo O QR code sera aberto no navegador.
echo Escaneie com o WhatsApp do celular.
echo.
echo WhatsApp -> Configuracoes -> Dispositivos conectados -> Conectar dispositivo
echo ============================================
echo.
rmdir /s /q .baileys_auth* 2>nul
node open-qr.cjs
echo.
pause
