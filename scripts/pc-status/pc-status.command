#!/usr/bin/env bash
# Single-file installer + reporter for hvalec-api PC status.
#
# Run it directly (double-click in Finder, or `./pc-status.command` in a
# terminal) to interactively configure this Mac: it asks which server to
# report to and for a device token, then installs itself as a launchd
# agent that pushes a stats snapshot every 60s and survives reboots.
#
# Re-run any time to change the server or rotate the token.
set -euo pipefail

APP_DIR="$HOME/.local/share/hvalec-pc-status"
SCRIPT_DEST="$APP_DIR/pc-status.command"

report() {
  local config_file="${PC_STATUS_CONFIG:-$HOME/.config/hvalec-pc-status.env}"
  if [[ -f "$config_file" ]]; then
    # shellcheck disable=SC1090
    source "$config_file"
  fi

  : "${PC_STATUS_URL:?PC_STATUS_URL is not set (export it or add it to $config_file)}"
  : "${PC_STATUS_TOKEN:?PC_STATUS_TOKEN is not set (export it or add it to $config_file)}"

  local hostname os_version boot_epoch uptime_seconds
  hostname=$(scutil --get ComputerName 2>/dev/null || hostname)
  os_version=$(sw_vers -productVersion)

  boot_epoch=$(sysctl -n kern.boottime | sed -E 's/.*\{ sec = ([0-9]+).*/\1/')
  uptime_seconds=$(( $(date +%s) - boot_epoch ))

  local cpu_line idle_percent cpu_usage_percent
  cpu_line=$(top -l 1 -n 0 | grep "CPU usage")
  idle_percent=$(echo "$cpu_line" | sed -E 's/.*, ([0-9.]+)% idle.*/\1/')
  cpu_usage_percent=$(awk "BEGIN { printf \"%.1f\", 100 - $idle_percent }")

  local gpu_usage_percent
  gpu_usage_percent=$(ioreg -r -d 1 -c "IOAccelerator" 2>/dev/null \
    | grep -o '"Device Utilization %"=[0-9]*' | head -1 | grep -o '[0-9]*$')
  gpu_usage_percent="${gpu_usage_percent:-null}"

  local load1 load5 load15
  read -r load1 load5 load15 <<< "$(sysctl -n vm.loadavg | tr -d '{}')"

  local page_size mem_total_bytes pages_active pages_wired pages_compressed mem_used_bytes
  page_size=$(vm_stat | head -1 | grep -oE '[0-9]+')
  mem_total_bytes=$(sysctl -n hw.memsize)
  pages_active=$(vm_stat | awk '/Pages active/ {gsub("\\.", "", $3); print $3}')
  pages_wired=$(vm_stat | awk '/Pages wired/ {gsub("\\.", "", $4); print $4}')
  pages_compressed=$(vm_stat | awk '/Pages occupied by compressor/ {gsub("\\.", "", $5); print $5}')
  mem_used_bytes=$(( (pages_active + pages_wired + pages_compressed) * page_size ))

  local disk_total_kb disk_used_kb disk_total_bytes disk_used_bytes
  read -r disk_total_kb disk_used_kb <<< "$(df -k / | tail -1 | awk '{print $2, $3}')"
  disk_total_bytes=$((disk_total_kb * 1024))
  disk_used_bytes=$((disk_used_kb * 1024))

  local batt_info has_battery battery_percentage battery_status charging
  batt_info=$(pmset -g batt)
  if echo "$batt_info" | grep -q "InternalBattery"; then
    has_battery=true
    battery_percentage=$(echo "$batt_info" | grep -oE '[0-9]+%' | head -1 | tr -d '%')
    battery_status=$(echo "$batt_info" | grep "InternalBattery" | sed -E 's/.*;[[:space:]]*([a-zA-Z ]+);.*/\1/' | xargs)
    if [[ "$battery_status" == "discharging" ]]; then
      charging=false
    else
      charging=true
    fi
  else
    has_battery=false
    battery_percentage=null
    charging=null
  fi

  local payload
  payload=$(cat <<JSON
{
  "hostname": "$hostname",
  "platform": "darwin",
  "osVersion": "$os_version",
  "uptimeSeconds": $uptime_seconds,
  "cpu": { "usagePercent": $cpu_usage_percent, "loadAvg1": $load1, "loadAvg5": $load5, "loadAvg15": $load15 },
  "gpu": { "usagePercent": $gpu_usage_percent },
  "memory": { "usedBytes": $mem_used_bytes, "totalBytes": $mem_total_bytes },
  "disk": { "usedBytes": $disk_used_bytes, "totalBytes": $disk_total_bytes },
  "battery": { "hasBattery": $has_battery, "percentage": $battery_percentage, "charging": $charging }
}
JSON
)

  curl -fsS -X POST "${PC_STATUS_URL%/}/pc-status" \
    -H "Authorization: Bearer $PC_STATUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --max-time 10
}

install() {
  if [[ -f "$SCRIPT_DEST" ]]; then
    echo "hvalec PC status is already set up on this Mac."
    read -rp "Update the script only and keep the existing server/token? [Y/n] " keep
    if [[ ! "$keep" =~ ^[Nn] ]]; then
      cp "${BASH_SOURCE[0]}" "$SCRIPT_DEST"
      chmod +x "$SCRIPT_DEST"
      echo "Updated. Your server and token are unchanged — launchd will use the new script on its next run."
      return
    fi
    echo
  fi

  echo "hvalec PC status — setup"
  echo "========================="
  echo
  echo "Which server should this Mac report to?"
  echo "  1) production   (https://api.hvalec.com)"
  echo "  2) staging      (https://staging-api.hvalec.com)"
  echo "  3) local dev    (http://localhost:3000)"
  echo "  4) custom URL"
  read -rp "Choice [1-4]: " choice

  local url env_name
  case "$choice" in
    1) url="https://api.hvalec.com"; env_name="prod" ;;
    2) url="https://staging-api.hvalec.com"; env_name="staging" ;;
    3) url="http://localhost:3000"; env_name="local" ;;
    4)
      read -rp "Server URL (e.g. https://api.example.com): " url
      env_name="custom"
      ;;
    *)
      echo "Invalid choice." >&2
      exit 1
      ;;
  esac

  echo
  echo "Paste the device token from the admin panel's Devices section:"
  read -r token
  if [[ -z "$token" ]]; then
    echo "No token entered, aborting." >&2
    exit 1
  fi

  mkdir -p "$APP_DIR"
  cp "${BASH_SOURCE[0]}" "$SCRIPT_DEST"
  chmod +x "$SCRIPT_DEST"

  local label config_file plist_file log_file
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
		<string>$SCRIPT_DEST</string>
		<string>--report</string>
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

  local uid
  uid=$(id -u)
  if launchctl print "gui/$uid/$label" >/dev/null 2>&1; then
    launchctl bootout "gui/$uid/$label"
  fi
  launchctl bootstrap "gui/$uid" "$plist_file"

  echo
  echo "Done! This Mac is now reporting to $url every 60s."
  echo "  config: $config_file"
  echo "  logs:   $log_file"
  echo
  echo "Re-run this file any time to change the server or rotate the token."
  read -rp "Press Enter to close..." _
}

if [[ "${1:-}" == "--report" ]]; then
  report
else
  install
fi
