const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const port = 3000;
const pidFile = path.join(projectRoot, '.gapfinder-dev.json');
const stopFile = path.join(projectRoot, '.gapfinder-stop.json');
const nextCli = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

function startServer() {
  if (!fs.existsSync(nextCli)) {
    console.error('Next.js is not installed. Run npm install and try again.');
    process.exitCode = 1;
    return;
  }

  const child = spawn(process.execPath, [nextCli, 'dev', '--port', String(port)], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: false,
  });

  fs.writeFileSync(pidFile, JSON.stringify({
    launcherPid: process.pid,
    nextPid: child.pid,
    projectRoot,
    port,
    startedAt: new Date().toISOString(),
  }, null, 2));

  let stopping = false;
  function removePidFile() {
    try {
      const current = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
      if (current.launcherPid === process.pid) fs.unlinkSync(pidFile);
    } catch { /* A stale or already-removed PID file is harmless. */ }
  }

  child.once('error', error => {
    console.error(`Could not start Next.js: ${error.message}`);
    removePidFile();
    process.exitCode = 1;
  });

  child.once('exit', (code, signal) => {
    removePidFile();
    let stoppedByScript = false;
    try {
      const request = JSON.parse(fs.readFileSync(stopFile, 'utf8'));
      stoppedByScript = request.launcherPid === process.pid;
      if (stoppedByScript) fs.unlinkSync(stopFile);
    } catch { /* No managed stop request was recorded. */ }
    if (signal) console.log(`GapFinder AI stopped (${signal}).`);
    process.exitCode = stoppedByScript ? 0 : (code ?? 0);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (stopping) return;
      stopping = true;
      if (!child.killed) child.kill();
    });
  }
}

const portCheck = net.createServer();
portCheck.once('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Close the other app on port ${port}, then run run.bat again.`);
    process.exitCode = 2;
  } else {
    console.error(`Could not check port ${port}: ${error.message}`);
    process.exitCode = 1;
  }
});
portCheck.listen(port, '127.0.0.1', () => portCheck.close(startServer));
