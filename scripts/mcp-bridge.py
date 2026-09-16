#!/usr/bin/env python3
"""
Servidor MCP para WhatsApp usando Baileys via Node.js subprocess.
Compatível com Windows + Node.js 24.
"""
import json
import sys
import subprocess
import os
import http.server
import urllib.request
import urllib.error

HUB_URL = "http://localhost:5000"
HUB_TOKEN = "token-...-123"

class MCPHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/status":
            try:
                req = urllib.request.Request(f"{HUB_URL}/health", headers={"x-hub-token": HUB_TOKEN})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(resp.read())
            except Exception as e:
                self.send_response(503)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/send":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            # Enviar via Hub
            try:
                req = urllib.request.Request(
                    f"{HUB_URL}/send",
                    data=json.dumps({"telefone": data["to"], "mensagem": data["message"]}).encode(),
                    headers={"Content-Type": "application/json", "x-hub-token": HUB_TOKEN},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(resp.read())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[MCP] {args[0]}")

if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", 5002), MCPHandler)
    print(f"[MCP] Servidor rodando em http://127.0.0.1:5002")
    server.serve_forever()
