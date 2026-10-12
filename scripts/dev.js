const { spawn } = require('node:child_process');

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const children = [];
let stopping = false;

function launch(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[Solvox dev] Failed to start ${command}: ${error.message}`);
    shutdown(1);
  });
  child.on('exit', (code) => {
    if (!stopping) shutdown(code ?? 1);
  });
  return child;
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill('SIGTERM');
  }
  process.exitCode = code;
}

// Keep the API + Socket.IO backend running on port 3000 while Vite serves the UI.
// vite.config.js proxies /api and /socket.io to this backend.
launch(process.execPath, ['server.js']);
launch(npmCommand, ['--workspace', 'frontend', 'run', 'dev'], {
  shell: isWindows,
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
