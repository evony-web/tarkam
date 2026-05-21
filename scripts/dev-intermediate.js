// Intermediate process for double-fork technique
// This process starts the actual Next.js dev server as a detached child,
// then exits immediately. The child process gets reparented to PID 1 (init),
// so it survives even if the spawning shell dies.

const { spawn } = require('child_process');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');

const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: projectDir,
  stdio: ['ignore', 'ignore', 'ignore'],
  detached: true,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' }
});

child.unref();

// Write PID file so we can kill it later
const fs = require('fs');
fs.writeFileSync(path.join(projectDir, '.next-dev.pid'), String(child.pid));

console.log(`[dev-intermediate] Next.js dev server started as PID ${child.pid} (detached)`);
console.log(`[dev-intermediate] Intermediate process exiting...`);

process.exit(0);
