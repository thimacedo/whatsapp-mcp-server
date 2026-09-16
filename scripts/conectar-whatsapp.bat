@echo off
title WhatsApp MCP Server - Conexao Inicial
color 0a

echo.
echo ============================================
echo    WhatsApp MCP Server - CONEXAO INICIAL
echo ============================================
echo.
echo  1. Este servidor vai gerar um QR code
echo  2. Escaneie com o WhatsApp do celular
echo  3. Aguarde a confirmacao de conexao
echo.
echo ============================================
echo.

:: Mata processos node antigos
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Finalizando processos node anteriores...
    taskkill /F /IM node.exe 2>NUL
    timeout /t 2 /nobreak >NUL
)

:: Limpa credenciais antigas
if exist .baileys_auth* (
    echo Limpando credenciais antigas...
    rmdir /s /q .baileys_auth* 2>NUL
)

echo.
echo Iniciando servidor...
echo.
echo NAO FECHE ESTA JANELA DURANTE O USO!
echo.

node servidor.cjs

pause
