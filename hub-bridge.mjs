import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const HUB_URL = 'http://localhost:5000';
const HUB_TOKEN = process.env.HUB_TOKEN || 'token-...-123';

async function hubRequest(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-hub-token': HUB_TOKEN },
  };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(`${HUB_URL}${path}`, opts)).json();
}

const server = new Server(
  { name: 'whatsapp-hub-bridge', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'whatsapp_send_message',
      description: 'Enviar mensagem via WhatsApp',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Número ou grupo' },
          message: { type: 'string', description: 'Mensagem' },
        },
        required: ['to', 'message'],
      },
    },
    {
      name: 'whatsapp_status',
      description: 'Status da conexão',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'whatsapp_send_message') {
      const r = await hubRequest('POST', '/send', { telefone: args.to, mensagem: args.message });
      return { content: [{ type: 'text', text: JSON.stringify(r) }] };
    }
    if (name === 'whatsapp_status') {
      const r = await hubRequest('GET', '/health');
      return { content: [{ type: 'text', text: JSON.stringify(r) }] };
    }
    return { content: [{ type: 'text', text: `Desconhecida: ${name}` }], isError: true };
  } catch (e) {
    return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[MCP] WhatsApp Hub Bridge ativo');
