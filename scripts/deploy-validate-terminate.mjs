import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const npmCmd = process.platform === 'win32' ? 'npm' : 'npm';
const nodeCmd = process.execPath;

const runCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const spawnCommand =
      process.platform === 'win32' ? 'cmd.exe' : command;
    const spawnArgs =
      process.platform === 'win32' ? ['/c', command, ...args] : args;
    const child = spawn(spawnCommand, spawnArgs, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
      }
    });
  });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForFile = async (filePath, timeoutMs = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (content.trim()) {
        return content.trim();
      }
    } catch {
      // ignore until timeout
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for port file: ${filePath}`);
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `Request failed (${response.status})`);
  }
  return payload;
};

const waitForHealth = async (baseUrl, timeoutMs = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const payload = await fetchJson(`${baseUrl}/api/health`);
      if (payload?.status === 'ok') {
        return;
      }
    } catch {
      // retry
    }
    await delay(300);
  }
  throw new Error('Backend health check timed out');
};

const terminateProcess = async (child) =>
  new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
      resolve();
    }, 4000);
  });

const run = async () => {
  const rootDir = process.cwd();
  const backendDir = path.join(rootDir, 'backend');

  await runCommand(npmCmd, ['run', 'build'], { cwd: rootDir });
  await runCommand(npmCmd, ['run', 'build'], { cwd: backendDir });

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eaa-deploy-'));
  const portFile = path.join(tempDir, 'backend-port.txt');

  const backendProc = spawn(nodeCmd, ['dist/main.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: '0',
      PORT_FILE: portFile,
    },
    stdio: 'inherit',
  });

  try {
    const port = await waitForFile(portFile, 15000);
    const baseUrl = `http://localhost:${port}`;
    await waitForHealth(baseUrl, 15000);
    await fetchJson(`${baseUrl}/api/diagnostics/startup`);
    console.log(`Deployment validation succeeded at ${baseUrl}`);
  } finally {
    await terminateProcess(backendProc);
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
