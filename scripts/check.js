#!/usr/bin/env node
// muselinn-toolkit check — audit Claude Code environment
// Outputs JSON to stdout for the check.md command to analyse

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CLAUDE = path.join(HOME, '.claude');

// Garage plugins (hardcoded — match marketplace.json)
const GARAGE_PLUGINS = [
  'deepseek-statusline',
  'patent-disclosure-skill',
  'nature-skills',
  'gpt-image-2',
];

// Recommended official plugins
const OFFICIAL_PLUGINS = [
  { name: 'plugin-dev', marketplace: 'claude-plugins-official' },
  { name: 'mcp-server-dev', marketplace: 'claude-plugins-official' },
  { name: 'pr-review-toolkit', marketplace: 'claude-plugins-official' },
  { name: 'hookify', marketplace: 'claude-plugins-official' },
  { name: 'commit-commands', marketplace: 'claude-plugins-official' },
  { name: 'feature-dev', marketplace: 'claude-plugins-official' },
  { name: 'document-skills', marketplace: 'anthropic-agent-skills' },
  { name: 'obsidian', marketplace: 'obsidian-skills' },
];

function rjson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

// Find installed plugin versions from cache
function findInstalled() {
  const plugins = {};
  const cacheDir = path.join(CLAUDE, 'plugins', 'cache');
  if (!fs.existsSync(cacheDir)) return plugins;
  for (const mp of fs.readdirSync(cacheDir)) {
    const mpPath = path.join(cacheDir, mp);
    if (!fs.statSync(mpPath).isDirectory()) continue;
    for (const pkg of fs.readdirSync(mpPath)) {
      const pkgPath = path.join(mpPath, pkg);
      if (!fs.statSync(pkgPath).isDirectory()) continue;
      for (const ver of fs.readdirSync(pkgPath)) {
        const vp = path.join(pkgPath, ver, '.claude-plugin', 'plugin.json');
        const pj = rjson(vp);
        if (pj) plugins[pj.name] = { version: pj.version, path: vp, marketplace: mp };
      }
    }
  }
  return plugins;
}

// Check settings.json
function checkSettings() {
  const sf = rjson(path.join(CLAUDE, 'settings.json'));
  if (!sf) return { hasSettings: false, statusLine: false, deepseek: false, hasToken: false };
  return {
    hasSettings: true,
    statusLine: !!(sf.statusLine && sf.statusLine.command),
    deepseek: (sf.env && sf.env.ANTHROPIC_BASE_URL || '').includes('deepseek'),
    hasToken: !!(sf.env && sf.env.ANTHROPIC_AUTH_TOKEN),
  };
}

// Check marketplaces
function checkMarketplace() {
  const mp = rjson(path.join(CLAUDE, 'plugins', 'marketplaces', 'muselinn-garage', '.claude-plugin', 'marketplace.json'));
  return !!mp;
}

// Check if statusline.js exists
function checkStatusline() {
  return fs.existsSync(path.join(CLAUDE, 'statusline.js'));
}

const installed = findInstalled();
const settings = checkSettings();
const hasGarage = checkMarketplace();
const hasStatusline = checkStatusline();

// Build report
const garageReport = GARAGE_PLUGINS.map(name => ({
  name,
  installed: !!installed[name],
  version: installed[name] ? installed[name].version : null,
}));

const officialReport = OFFICIAL_PLUGINS.map(p => ({
  ...p,
  installed: !!installed[p.name],
  version: installed[p.name] ? installed[p.name].version : null,
}));

console.log(JSON.stringify({
  garage_marketplace: hasGarage,
  statusline_exists: hasStatusline,
  settings,
  garage_plugins: garageReport,
  official_plugins: officialReport,
  all_installed: Object.keys(installed),
}, null, 2));
