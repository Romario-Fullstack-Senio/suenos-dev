#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'apps', 'api');
const child = spawn('npx', ['nest', 'start'], {
  cwd: apiDir,
  stdio: 'ignore',
  detached: true,
  shell: true,
});

child.unref();
console.log(`API started with PID: ${child.pid}`);
