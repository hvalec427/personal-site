#!/usr/bin/env bash
# Installs a launchd agent that runs pc-status.sh every 60s against one
# environment. Safe to re-run (e.g. to rotate a token) — reinstalls the
# agent and overwrites its config.
#
# Usage: install-pc-status-agent.sh <local|staging|prod> <token>
set -euo pipefail

env_name="${1:?Usage: install-pc-status-agent.sh <local|staging|prod> <token>}"
token="${2:?Usage: install-pc-status-agent.sh <local|staging|prod> <token>}"

case "$env_name" in
  local)   url="http://localhost:3000" ;;
  staging) url="https://staging-api.hvalec.com" ;;
  prod)    url="https://api.hvalec.com" ;;
  *)
    echo "Unknown environment '$env_name' (expected local, staging, or prod)" >&2
    exit 1
    ;;
esac

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pc_status_script="$script_dir/pc-status.sh"
if [[ ! -f "$pc_status_script" ]]; then
  echo "pc-status.sh not found next to this script at $pc_status_script" >&2
  exit 1
fi
chmod +x "$pc_status_script"

label="com.hvalec.pc-status.$env_name"
config_file="$HOME/.config/hvalec-pc-status-$env_name.env"
plist_file="$HOME/Library/LaunchAgents/$label.plist"
log_file="$HOME/Library/Logs/hvalec-pc-status-$env_name.log"

mkdir -p "$HOME/.config" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

cat > "$config_file" <<EOF
PC_STATUS_URL=$url
PC_STATUS_TOKEN=$token
EOF
chmod 600 "$config_file"

cat > "$plist_file" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>$label</string>
	<key>ProgramArguments</key>
	<array>
		<string>/bin/bash</string>
		<string>$pc_status_script</string>
	</array>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PC_STATUS_CONFIG</key>
		<string>$config_file</string>
	</dict>
	<key>StartInterval</key>
	<integer>60</integer>
	<key>RunAtLoad</key>
	<true/>
	<key>StandardOutPath</key>
	<string>$log_file</string>
	<key>StandardErrorPath</key>
	<string>$log_file</string>
</dict>
</plist>
EOF

uid=$(id -u)
if launchctl print "gui/$uid/$label" >/dev/null 2>&1; then
  launchctl bootout "gui/$uid/$label"
fi
launchctl bootstrap "gui/$uid" "$plist_file"

echo "Installed and started $label"
echo "  config: $config_file"
echo "  logs:   $log_file"
