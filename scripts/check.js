#!/usr/bin/env node
// muselinn-toolkit check — full Claude Code environment audit
// Outputs JSON for the check.md command to analyse

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const C = p => path.join(HOME, '.claude', p);

const GARAGE_PLUGINS = [
  'deepseek-statusline',
  'patent-disclosure-skill',
  'nature-skills',
  'gpt-image-2',
  'muselinn-toolkit',
];

const OFFICIAL_PLUGINS = [
  { name: 'plugin-dev', marketplace: 'claude-plugins-official' },
  { name: 'mcp-server-dev', marketplace: 'claude-plugins-official' },
  { name: 'pr-review-toolkit', marketplace: 'claude-plugins-official' },
  { name: 'hookify', marketplace: 'claude-plugins-official' },
  { name: 'commit-commands', marketplace: 'claude-plugins-official' },
  { name: 'feature-dev', marketplace: 'claude-plugins-official' },
  { name: 'document-skills', marketplace: 'anthropic-agent-skills' },
  { name: 'obsidian', marketplace: 'obsidian-skills' },
  { name: 'nature-skills', marketplace: 'nature-skills' },
];

// Recommended standalone skills (installed via npx skills add, not plugins)
const RECOMMENDED_SKILLS = [
  { name: 'find-skills', source: 'vercel-labs/skills', description: 'Meta-skill — discover and install other skills' },
  { name: 'fpga', source: 'mindrally/skills', description: 'FPGA development — Vivado, SystemVerilog, timing closure, AXI' },
  { name: 'vercel-react-best-practices', source: 'vercel-labs/agent-skills', description: 'React & Next.js performance optimization from Vercel' },
  { name: 'remotion-best-practices', source: 'remotion-dev/skills', description: 'Remotion video framework best practices' },
  { name: 'claude-to-im', source: 'op7418/Claude-to-IM-skill', description: 'Bridge Claude Code to Telegram/Discord/Feishu/QQ/WeChat — remote via mobile' },
];

function rjson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

// ── plugins ──────────────────────────────────────────────────────────────────
function findPlugins() {
  const plugins = {};
  const cd = C('plugins/cache');
  if (!fs.existsSync(cd)) return plugins;
  for (const mp of fs.readdirSync(cd)) {
    const mpP = path.join(cd, mp);
    if (!fs.statSync(mpP).isDirectory()) continue;
    for (const pkg of fs.readdirSync(mpP)) {
      const pkP = path.join(mpP, pkg);
      if (!fs.statSync(pkP).isDirectory()) continue;
      for (const ver of fs.readdirSync(pkP)) {
        const vp = path.join(pkP, ver, '.claude-plugin', 'plugin.json');
        const cp = path.join(pkP, ver, '.codex-plugin', 'plugin.json');
        const pj = rjson(vp) || rjson(cp);
        if (pj) plugins[pj.name] = { version: pj.version, marketplace: mp };
      }
    }
  }
  return plugins;
}

// ── marketplaces ─────────────────────────────────────────────────────────────
function findMarketplaces() {
  const mps = [];
  const md = C('plugins/marketplaces');
  if (!fs.existsSync(md)) return mps;
  for (const mp of fs.readdirSync(md)) {
    const mf = path.join(md, mp, '.claude-plugin', 'marketplace.json');
    const mj = rjson(mf);
    if (mj) mps.push({ name: mj.name, pluginCount: (mj.plugins || []).length, path: mf });
  }
  return mps;
}

// ── MCP servers ──────────────────────────────────────────────────────────────
function findMcpServers() {
  const servers = [];
  // .mcp.json (project/user)
  const mcpJson = rjson(path.join(HOME, '.mcp.json'));
  if (mcpJson && mcpJson.mcpServers) {
    for (const [name, cfg] of Object.entries(mcpJson.mcpServers)) {
      servers.push({ name, type: cfg.type || cfg.command ? 'stdio' : 'http', source: '.mcp.json' });
    }
  }
  // ~/.claude.json (user scope)
  const claudeJson = rjson(C('..', '.claude.json'));
  if (claudeJson) {
    const projects = claudeJson.projects || {};
    for (const [proj, cfg] of Object.entries(projects)) {
      const ss = cfg.mcpServers || {};
      for (const [name, sc] of Object.entries(ss)) {
        servers.push({ name, type: sc.type || 'http', source: '~/.claude.json (' + path.basename(proj) + ')' });
      }
    }
  }
  return servers;
}

// ── standalone skills ────────────────────────────────────────────────────────
function findStandaloneSkills() {
  const skills = [];
  const sd = C('skills');
  if (!fs.existsSync(sd)) return skills;
  for (const s of fs.readdirSync(sd)) {
    const sp = path.join(sd, s);
    try {
      const st = fs.lstatSync(sp);
      if (st.isDirectory() && !st.isSymbolicLink() && fs.existsSync(path.join(sp, 'SKILL.md'))) {
        skills.push(s);
      }
    } catch {}
  }
  return skills;
}

// ── MATLAB toolkit ───────────────────────────────────────────────────────────
function checkMatlab() {
  const root = path.join(HOME, '.matlab', 'agentic-toolkits');
  const mcp = path.join(root, 'bin', 'matlab-mcp-server.exe');
  const mcpVer = fs.existsSync(mcp) ? 'found' : 'missing';
  // Read versions from plugin cache
  let matlab = 'unknown', simulink = 'unknown';
  const cacheBase = C(path.join('plugins', 'cache', 'matlab-agentic-toolkits'));
  if (fs.existsSync(cacheBase)) {
    for (const pkg of fs.readdirSync(cacheBase)) {
      const pkP = path.join(cacheBase, pkg);
      if (!fs.statSync(pkP).isDirectory()) continue;
      for (const ver of fs.readdirSync(pkP)) {
        const vp = path.join(pkP, ver, '.codex-plugin', 'plugin.json');
        const pj = rjson(vp);
        if (pj && pj.version) {
          if (pkg === 'toolkit') matlab = pj.version;
          else if (pkg === 'model-based-design-core') simulink = pj.version;
        }
      }
    }
  }
  return { mcpServer: mcpVer, matlabVer: matlab, simulinkVer: simulink };
}

// ── settings ─────────────────────────────────────────────────────────────────
function checkSettings() {
  const sf = rjson(C('settings.json'));
  if (!sf) return { hasSettings: false };
  const env = sf.env || {};
  return {
    hasSettings: true,
    statusLine: !!(sf.statusLine && sf.statusLine.command),
    deepseek: (env.ANTHROPIC_BASE_URL || '').includes('deepseek'),
    hasToken: !!(env.ANTHROPIC_AUTH_TOKEN),
    model: env.ANTHROPIC_MODEL || '',
    hasImageKey: !!(env.OPENAI_IMAGE_API_KEY || ((rjson(C('settings.local.json')) || {}).env || {}).OPENAI_IMAGE_API_KEY),
    enabledPlugins: Object.keys(sf.enabledPlugins || {}),
    effort: sf.effortLevel || 'default',
  };
}

// ── statusline.js ────────────────────────────────────────────────────────────
function checkStatusline() {
  const sp = C('statusline.js');
  if (!fs.existsSync(sp)) return { exists: false };
  const src = fs.readFileSync(sp, 'utf8');
  const vMatch = src.match(/Edition \(v(\d+)\)/);
  return { exists: true, version: vMatch ? 'v' + vMatch[1] : 'unknown', size: src.length };
}

// ── gather ───────────────────────────────────────────────────────────────────
const plugins = findPlugins();
const marketplaces = findMarketplaces();
const mcpServers = findMcpServers();
const standaloneSkills = findStandaloneSkills();
const settings = checkSettings();
const statusline = checkStatusline();
const matlab = checkMatlab();

const garageReport = GARAGE_PLUGINS.map(name => ({
  name, installed: !!plugins[name], version: plugins[name] ? plugins[name].version : null,
}));

const officialReport = OFFICIAL_PLUGINS.map(p => ({
  ...p, installed: !!plugins[p.name], version: plugins[p.name] ? plugins[p.name].version : null,
}));

const skillsReport = RECOMMENDED_SKILLS.map(s => ({
  ...s, installed: standaloneSkills.includes(s.name),
}));

console.log(JSON.stringify({
  summary: {
    garagePlugins: garageReport.filter(p => p.installed).length + '/' + GARAGE_PLUGINS.length,
    officialPlugins: officialReport.filter(p => p.installed).length + '/' + OFFICIAL_PLUGINS.length,
    recommendedSkills: skillsReport.filter(s => s.installed).length + '/' + RECOMMENDED_SKILLS.length,
    marketplaces: marketplaces.length,
    mcpServers: mcpServers.length,
    standaloneSkills: standaloneSkills.length,
  },
  settings,
  statusline,
  matlab,
  marketplaces,
  mcp_servers: mcpServers,
  standalone_skills: standaloneSkills,
  garage_plugins: garageReport,
  official_plugins: officialReport,
  recommended_skills: skillsReport,
}, null, 2));
