---
name: check
description: Audit & fix Claude Code setup — scan plugins/skills/config, then interactively install missing items
---

Run a full environment health check, then let the user choose what to fix:

1. **Run the checker script** to gather raw data:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/check.js
```

2. **Analyze the JSON output** and identify what's missing or outdated:

### Garage Marketplace
- Is `MuseLinn/muselinn-garage` added? If not → `claude plugin marketplace add MuseLinn/muselinn-garage`
- Run `claude plugin marketplace update muselinn-garage` to fetch latest.

### Missing Items Summary
From the JSON, build a list of what needs attention:

| Category | Item | Action |
|---|---|---|
| plugin | claude-code-statusline | install / update |
| plugin | patent-disclosure-skill | install |
| ... | ... | ... |
| skill | find-skills | npx skills add |
| config | statusline.js missing | copy from plugin |
| config | opencode go config | set up auth cookie |

### Config Health
- `settings.json` statusLine configured?
- `~/.claude/statusline.js` exists?
- `~/.claude/statusline-config.json` for opencode go?
- provider detection: deepseek-direct / opencode-go-proxy / anthropic-direct / custom-proxy

### MATLAB / Simulink Toolkit
Check the `matlab` field:
- `mcpServer: found/missing`
- `matlabVer` / `simulinkVer`

If missing: `setupAgenticToolkit("install")` then `setupAgenticToolkit("configure")` in MATLAB.

3. **Ask the user interactively** which items to install or fix:

```
AskUserQuestion:
  Which items do you want to install/fix?
  Options (multi-select):
  □ claude-code-statusline (missing)
  □ patent-disclosure-skill (missing)
  □ gpt-image-2 (update available: 0.2.0 → 0.3.0)
  □ find-skills (missing)
  □ markitdown (missing)
  □ [Recommended Actions]
```

Use AskUserQuestion with multiSelect for this. Group related items. Only show items that are actually missing/outdated.

4. **Execute selected actions** — run the appropriate commands for each selected item:

- Plugin install: `claude plugin install <name>`
- Skill install: `npx -y skills add <source> --skill <name> --agent claude-code -g`
- Config fix: use `Edit` to write the config file
- Statusline copy: `cp "${CLAUDE_PLUGIN_ROOT}/statusline.js" "${HOME}/.claude/statusline.js"`
- MATLAB toolkit setup: guide the user to run MATLAB commands

5. **After execution**, run the checker script again and show a concise summary:

```
✅ All good (N/N plugins installed, all config OK)
⚠️ N issues remaining: [list]
```
