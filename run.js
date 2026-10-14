#!/usr/bin/env node
/**
 * CricPredic — One-Command System Runner
 *
 * Starts ML Service, Node Backend, and Frontend server,
 * waits for all health checks, then opens the browser.
 *
 * Usage:  node run.js
 *         run.bat  (Windows shortcut)
 */

'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

// ── Configuration ──────────────────────────────────────────────────────────
const ROOT = __dirname;
const ML_DIR = path.join(ROOT, 'backend', 'ml_service');
const NODE_DIR = path.join(ROOT, 'backend', 'node_service');
const FRONTEND_DIR = path.join(ROOT, 'frontend');

const ML_PORT = 8000;
const NODE_PORT = 5000;
const FRONTEND_PORT = 3000;

// Resolve Python — test each candidate by executing --version, fallback to system python
const PYTHON = (() => {
  const { spawnSync } = require('child_process');
  const candidates = [
    path.join(ROOT, 'venv', 'Scripts', 'python.exe'),
    path.join(ROOT, 'venv', 'bin', 'python'),
    path.join(ML_DIR, 'venv', 'Scripts', 'python.exe'),
    path.join(ML_DIR, 'venv', 'bin', 'python'),
  ];
  for (const p of candidates) {
    try {
      const res = spawnSync(p, ['--version'], { stdio: 'ignore' });
      if (res.status === 0) return p;
    } catch { /* continue */ }
  }
  for (const sys of ['python', 'python3']) {
    try {
      const res = spawnSync(sys, ['--version'], { stdio: 'ignore' });
      if (res.status === 0) return sys;
    } catch { /* continue */ }
  }
  return 'python';
})();


// ── ANSI Colors ────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bg_green: '\x1b[42m',
  bg_cyan: '\x1b[46m',
  bg_yellow: '\x1b[43m',
};

const tag = (color, label) => `${color}${C.bold}[${label}]${C.reset}`;
const ML_TAG = tag(C.magenta, '🧠 ML');
const NODE_TAG = tag(C.cyan, '🏏 NODE');
const FRONT_TAG = tag(C.yellow, '🌐 FRONT');
const SYS_TAG = tag(C.green, '⚡ SYS');

// ── Utilities ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkPort(port, timeout = 2000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => { req.destroy(); resolve(false); });
  });
}

async function waitForService(name, port, healthPath = '/', maxWait = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}${healthPath}`, (res) => {
          res.resume();
          resolve(res.statusCode < 500);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => { req.destroy(); resolve(false); });
      });
      if (ok) return true;
    } catch { /* retry */ }
    await sleep(800);
  }
  return false;
}

function openBrowser(url) {
  const cmd = os.platform() === 'win32' ? 'start'
    : os.platform() === 'darwin' ? 'open' : 'xdg-open';
  const args = os.platform() === 'win32' ? ['', url] : [url];
  spawn(cmd, args, { shell: true, detached: true, stdio: 'ignore' }).unref();
}

function pipeOutput(proc, TAG, filter = false) {
  const transform = (stream, isErr) => {
    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        // Filter noisy lines if requested
        if (filter) {
          if (line.includes('[debug]')) continue;
          if (line.includes('MONGOOSE') && line.includes('Warning')) continue;
          if (line.includes('GET /health')) continue;
        }
        const prefix = isErr ? `${C.dim}` : '';
        console.log(`  ${TAG} ${prefix}${line.trimEnd()}${C.reset}`);
      }
    });
  };
  if (proc.stdout) transform(proc.stdout, false);
  if (proc.stderr) transform(proc.stderr, true);
}

// ── Kill existing processes on our ports ────────────────────────────────────
async function killPort(port) {
  return new Promise((resolve) => {
    const cmd = os.platform() === 'win32'
      ? spawn('powershell', ['-Command',
          `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ` +
          `ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`
        ], { stdio: 'ignore' })
      : spawn('sh', ['-c', `lsof -ti:${port} | xargs kill -9 2>/dev/null`], { stdio: 'ignore' });
    cmd.on('close', () => resolve());
    cmd.on('error', () => resolve());
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log();
  console.log(`${C.bold}${C.green}  ╔════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.green}  ║   🏏  CricPredic — Cricket Prediction System  🏏  ║${C.reset}`);
  console.log(`${C.bold}${C.green}  ╚════════════════════════════════════════════════════╝${C.reset}`);
  console.log();

  // Kill any existing processes on our ports
  console.log(`${SYS_TAG} Cleaning up existing processes...`);
  await Promise.all([killPort(ML_PORT), killPort(NODE_PORT), killPort(FRONTEND_PORT)]);
  await sleep(1500);

  const children = [];
  const cleanup = () => {
    console.log(`\n${SYS_TAG} Shutting down all services...`);
    for (const child of children) {
      try { 
        if (os.platform() === 'win32') {
          spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
        } else {
          child.kill('SIGTERM'); 
        }
      } catch { /* ignore */ }
    }
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // ── Start ML Service ───────────────────────────────────────────────────
  console.log(`${ML_TAG} Starting ML service on port ${ML_PORT}...`);
  console.log(`${ML_TAG} Python: ${PYTHON}`);
  const mlProc = spawn(PYTHON, ['-m', 'uvicorn', 'main:app', '--port', String(ML_PORT), '--host', '0.0.0.0'], {
    cwd: ML_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    shell: true,
  });
  children.push(mlProc);
  pipeOutput(mlProc, ML_TAG);
  mlProc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${ML_TAG} ${C.red}ML process exited with code ${code}${C.reset}`);
    }
  });

  // ── Start Node Backend ─────────────────────────────────────────────────
  console.log(`${NODE_TAG} Starting Node backend on port ${NODE_PORT}...`);
  const nodeProc = spawn('node', ['server.js'], {
    cwd: NODE_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    shell: true,
  });
  children.push(nodeProc);
  pipeOutput(nodeProc, NODE_TAG, true);
  nodeProc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${NODE_TAG} ${C.red}Node process exited with code ${code}${C.reset}`);
    }
  });

  // ── Start Frontend ─────────────────────────────────────────────────────
  console.log(`${FRONT_TAG} Starting frontend server on port ${FRONTEND_PORT}...`);
  const frontProc = spawn('npx', ['serve', '-l', String(FRONTEND_PORT)], {
    cwd: FRONTEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    shell: true,
  });
  children.push(frontProc);
  pipeOutput(frontProc, FRONT_TAG);
  frontProc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${FRONT_TAG} ${C.red}Frontend process exited with code ${code}${C.reset}`);
    }
  });

  // ── Health Checks ──────────────────────────────────────────────────────
  console.log();
  console.log(`${SYS_TAG} Waiting for services to be ready...`);
  console.log();

  const mlReady = await waitForService('ML', ML_PORT, '/health', 90000);
  if (mlReady) {
    console.log(`${ML_TAG} ${C.bg_green}${C.bold} ✓ ML Service ready ${C.reset}  → http://localhost:${ML_PORT}/docs`);
  } else {
    console.error(`${ML_TAG} ${C.red}✗ ML Service failed to start (predictions will use fallback)${C.reset}`);
  }

  const nodeReady = await waitForService('Node', NODE_PORT, '/health', 30000);
  if (nodeReady) {
    console.log(`${NODE_TAG} ${C.bg_cyan}${C.bold} ✓ Backend ready    ${C.reset}  → http://localhost:${NODE_PORT}/api/docs`);
  } else {
    console.error(`${NODE_TAG} ${C.red}✗ Backend failed to start${C.reset}`);
    cleanup();
    return;
  }

  const frontReady = await waitForService('Frontend', FRONTEND_PORT, '/', 15000);
  if (frontReady) {
    console.log(`${FRONT_TAG} ${C.bg_yellow}${C.bold} ✓ Frontend ready   ${C.reset}  → http://localhost:${FRONTEND_PORT}`);
  } else {
    console.error(`${FRONT_TAG} ${C.red}✗ Frontend failed to start${C.reset}`);
    cleanup();
    return;
  }

  // ── Quick API Smoke Test ───────────────────────────────────────────────
  console.log();
  console.log(`${SYS_TAG} Running quick smoke test...`);

  try {
    const teamsOk = await new Promise((resolve) => {
      http.get(`http://localhost:${NODE_PORT}/api/teams`, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const count = json?.data?.length || 0;
            console.log(`${SYS_TAG}   Teams API: ${count} teams loaded ✓`);
            resolve(count > 0);
          } catch { resolve(false); }
        });
      }).on('error', () => resolve(false));
    });

    if (!teamsOk) {
      console.log(`${SYS_TAG}   ${C.yellow}⚠ No teams in DB — you may need to run: node scripts/seed.js${C.reset}`);
    }
  } catch { /* non-critical */ }

  // ── Open Browser ───────────────────────────────────────────────────────
  const appUrl = `http://localhost:${FRONTEND_PORT}/index.html`;
  console.log();
  console.log(`${SYS_TAG} ${C.bold}Opening browser → ${C.cyan}${appUrl}${C.reset}`);
  openBrowser(appUrl);

  // ── Running ────────────────────────────────────────────────────────────
  console.log();
  console.log(`${C.bold}${C.green}  ┌──────────────────────────────────────────────────┐${C.reset}`);
  console.log(`${C.bold}${C.green}  │        All systems operational! 🚀               │${C.reset}`);
  console.log(`${C.bold}${C.green}  │                                                  │${C.reset}`);
  console.log(`${C.bold}${C.green}  │  Frontend:  http://localhost:${FRONTEND_PORT}                 │${C.reset}`);
  console.log(`${C.bold}${C.green}  │  Backend:   http://localhost:${NODE_PORT}                 │${C.reset}`);
  console.log(`${C.bold}${C.green}  │  ML Docs:   http://localhost:${ML_PORT}/docs             │${C.reset}`);
  console.log(`${C.bold}${C.green}  │                                                  │${C.reset}`);
  console.log(`${C.bold}${C.green}  │  Press Ctrl+C to stop all services                │${C.reset}`);
  console.log(`${C.bold}${C.green}  └──────────────────────────────────────────────────┘${C.reset}`);
  console.log();
}

main().catch((err) => {
  console.error(`${SYS_TAG} ${C.red}Fatal error: ${err.message}${C.reset}`);
  process.exit(1);
});
