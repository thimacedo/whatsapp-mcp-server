@echo off
setlocal enabledelayedexpansion

set NUMERO=%1
set MSG=%2
set TOKEN=token-...-123

curl -s -X POST http://localhost:5000/send -H "x-hub-token: %TOKEN%" -H "Content-Type: application/json" -d "{\"telefone\":\"%NUMERO%\",\"mensagem\":\"%MSG%\"}"
