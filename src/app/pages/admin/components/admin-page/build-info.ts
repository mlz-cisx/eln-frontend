export interface BuildInfo {
  hash: string;
  subject: string;
}

let resolved: BuildInfo;

try {
  const mod = require('@environments/version');
  resolved = mod.buildInfo as BuildInfo;
} catch {
  resolved = {
    hash: 'dev',
    subject: 'unknown'
  };
}

export const buildInfo: BuildInfo = resolved;
