@echo off
title WhatsApp Hub - Node 20.11.0 (ESM)
set NODE=C:\Users\THIAGO\AppData\Local\nvm\v20.11.0\node.exe
cd /d E:\02_Projetos_Trabalho\Projetos_Ativos\03_legado\comunicacao-hub

echo ================================
echo   WhatsApp Hub - Node 20.11.0
echo ================================
echo.

if not exist "%NODE%" (
    echo ERRO: Node 20 nao encontrado
    pause
    exit /b 1
)

echo Limpando credenciais antigas...
rmdir /s /q .baileys_auth* 2>nul

echo Iniciando Hub (ESM)...
echo.

%NODE% hub.mjs

pause
