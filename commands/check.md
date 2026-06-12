---
name: check
description: Audit Claude Code setup — check installed plugins, skills, version consistency, and config health against muselinn-garage
---

Run a full environment health check:

1. **Run the checker script** to gather raw data:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/check.js
```

2. **Analyze the JSON output** and present findings in a structured report:

### Garage Marketplace
- Is `MuseLinn/muselinn-garage` added as a marketplace? If not, recommend adding it.
- Run `claude plugin marketplace update muselinn-garage` to fetch latest.

### Plugins from Garage (should be installed)
| Plugin | Installed | Version | Latest | Status |
|---|---|---|---|---|
| deepseek-statusline | yes/no | x.y.z | x.y.z | OK / Update available / Missing |
| patent-disclosure-skill | | | | |
| nature-skills | | | | |
| gpt-image-2 | | | | |

### Plugins from Official Sources (recommended)
| Plugin | Marketplace | Installed |
|---|---|---|
| plugin-dev | claude-plugins-official | yes/no |
| mcp-server-dev | claude-plugins-official | yes/no |
| pr-review-toolkit | claude-plugins-official | yes/no |
| hookify | claude-plugins-official | yes/no |
| commit-commands | claude-plugins-official | yes/no |
| feature-dev | claude-plugins-official | yes/no |
| document-skills | anthropic-agent-skills | yes/no |
| obsidian | obsidian-skills | yes/no |

### Config Health
- `settings.json` statusLine configured?
- `settings.json` env.ANTHROPIC_BASE_URL set to DeepSeek?
- `settings.json` env.ANTHROPIC_AUTH_TOKEN present?
- `~/.claude/statusline.js` exists?

### Recommended Actions
List specific `claude plugin install/uninstall` commands to fix gaps. List config fixes needed.

3. **Output a concise summary**:
```
✅ All good (N/N plugins installed, all config OK)
⚠️ N issues found: [list]
```
