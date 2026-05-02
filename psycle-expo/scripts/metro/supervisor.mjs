#!/usr/bin/env node

import { spawn } from 'node:child_process';

const children = [];
let shuttingDown = false;

function startChild(label, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo',
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[metro-supervisor] ${label} exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    shuttingDown = true;

    for (const other of children) {
      if (other !== child && !other.killed) {
        other.kill('SIGTERM');
      }
    }

    process.exit(code ?? 1);
  });

  children.push(child);
  return child;
}

startChild(
  'metro',
  '/opt/homebrew/bin/npm',
  ['run', 'start:lan'],
  { EXPO_NO_INTERACTIVE: '1' }
);

startChild(
  'bridge',
  '/opt/homebrew/bin/node',
  ['scripts/metro/bridge-8081-to-8082.mjs']
);

const shutdown = () => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(0), 250).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
