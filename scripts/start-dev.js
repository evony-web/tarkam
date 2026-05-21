// Double-fork dev server starter
// Forks an intermediate process that starts Next.js as a detached child.
// The intermediate exits, leaving Next.js as an orphan adopted by PID 1.
// This prevents the dev server from being killed when the parent shell exits.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const pidFile = path.join(projectDir, '.next-dev.pid');

// Kill any existing dev server
if (fs.existsSync(pidFile)) {
  try {
    const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
    process.kill(oldPid, 0); // Check if running
    process.kill(oldPid, 'SIGTERM');
    console.log(`[start-dev] Killed previous dev server (PID ${oldPid})`);
  } catch (e) {
    // Process not running, ignore
  }
  fs.unlinkSync(pidFile);
}

// Start the intermediate process
const intermediate = spawn('node', [path.join(__dirname, 'dev-intermediate.js')], {
  cwd: projectDir,
  stdio: 'inherit',
  detached: false
});

intermediate.on('exit', (code) => {
  if (code === 0) {
    console.log('[start-dev] Double-fork complete. Dev server is running detached.');
    
    // Verify the server is actually running
    setTimeout(() => {
      if (fs.existsSync(pidFile)) {
        const pid = fs.readFileSync(pidFile, 'utf8').trim();
        console.log(`[start-dev] Dev server PID: ${pid}`);
        console.log('[start-dev] Access at http://localhost:3000');
      }
    }, 2000);
  } else {
    console.error(`[start-dev] Intermediate process exited with code ${code}`);
  }
});
