@echo off
set NVM=C:\Users\THIAGO\AppData\Local\nvm
set NODE=%NVM%\v20.11.0\node.exe
set NPM=%NVM%\v20.11.0\npm.cmd

title WhatsApp Hub - Node 20.11.0
cd /d E:\02_Projetos_Trabalho\Projetos_Ativos\03_legado\comunicacao-hub

echo ================================
echo   WhatsApp Hub - Node 20.11.0
echo ================================
echo.

if not exist "%NODE%" (
    echo ERRO: Node 20 nao encontrado em %NODE%
    pause
    exit /b 1
)

echo Limpando credenciais antigas...
rmdir /s /q .baileys_auth* 2>nul

echo Iniciando Hub...
echo.

%NODE% hub.js

echo.
pause
