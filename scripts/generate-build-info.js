#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const target = path.join(__dirname, '..', 'src', 'environments', 'version.ts');

function git(args) {
  try {
    return execSync(`git ${args}`, {cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore']}).toString().trim();
  } catch {
    return 'unknown';
  }
}

const buildInfo = {
  hash: git('rev-parse --short HEAD'),
  subject: git('log -1 --pretty=%s'),
};

fs.writeFileSync(target, `export const buildInfo = {hash: ${JSON.stringify(buildInfo.hash)}, subject: ${JSON.stringify(buildInfo.subject)}};\n`);
console.log(`Build info: ${buildInfo.hash} - ${buildInfo.subject}`);
