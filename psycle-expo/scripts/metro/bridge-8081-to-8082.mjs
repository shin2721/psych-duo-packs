#!/usr/bin/env node

import net from 'node:net';

const listenPort = 8081;
const targetPort = 8082;
const targetHost = '127.0.0.1';

const server = net.createServer((clientSocket) => {
  const upstreamSocket = net.connect(targetPort, targetHost);

  clientSocket.on('error', () => {
    upstreamSocket.destroy();
  });

  upstreamSocket.on('error', () => {
    clientSocket.destroy();
  });

  clientSocket.pipe(upstreamSocket);
  upstreamSocket.pipe(clientSocket);
});

server.on('error', (error) => {
  console.error(`[metro-bridge] ${error.message}`);
  process.exit(1);
});

server.listen(listenPort, '0.0.0.0', () => {
  console.log(`[metro-bridge] forwarding 0.0.0.0:${listenPort} -> ${targetHost}:${targetPort}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
