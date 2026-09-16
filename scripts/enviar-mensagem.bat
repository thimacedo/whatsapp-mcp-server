@echo off
:: Script para enviar mensagem via Hub
:: Uso: enviar-mensagem.bat <telefone> <mensagem>

set TELEFONE=%1
set MENSAGEM=%2
set TOKEN=token-...-123

curl -s -X POST http://localhost:5000/send -H "x-hub-token: %TOKEN%" -H "Content-Type: application/json" -d "{\"telefone\":\"%TELEFONE%\",\"mensagem\":\"%MENSAGEM%\"}"
