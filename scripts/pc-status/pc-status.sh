#!/usr/bin/env bash
# Collects a snapshot of this Mac's stats and POSTs it to hvalec-api's
# /pc-status endpoint. Meant to run periodically via launchd (see
# scripts/com.hvalec.pc-status.plist).
set -euo pipefail

CONFIG_FILE="${PC_STATUS_CONFIG:-$HOME/.config/hvalec-pc-status.env}"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

: "${PC_STATUS_URL:?PC_STATUS_URL is not set (export it or add it to $CONFIG_FILE)}"
: "${PC_STATUS_TOKEN:?PC_STATUS_TOKEN is not set (export it or add it to $CONFIG_FILE)}"

hostname=$(scutil --get ComputerName 2>/dev/null || hostname)
os_version=$(sw_vers -productVersion)

boot_epoch=$(sysctl -n kern.boottime | sed -E 's/.*\{ sec = ([0-9]+).*/\1/')
uptime_seconds=$(( $(date +%s) - boot_epoch ))

cpu_line=$(top -l 1 -n 0 | grep "CPU usage")
idle_percent=$(echo "$cpu_line" | sed -E 's/.*, ([0-9.]+)% idle.*/\1/')
cpu_usage_percent=$(awk "BEGIN { printf \"%.1f\", 100 - $idle_percent }")

gpu_usage_percent=$(ioreg -r -d 1 -c "IOAccelerator" 2>/dev/null \
  | grep -o '"Device Utilization %"=[0-9]*' | head -1 | grep -o '[0-9]*$')
gpu_usage_percent="${gpu_usage_percent:-null}"

read -r load1 load5 load15 <<< "$(sysctl -n vm.loadavg | tr -d '{}')"

page_size=$(vm_stat | head -1 | grep -oE '[0-9]+')
mem_total_bytes=$(sysctl -n hw.memsize)
pages_active=$(vm_stat | awk '/Pages active/ {gsub("\\.", "", $3); print $3}')
pages_wired=$(vm_stat | awk '/Pages wired/ {gsub("\\.", "", $4); print $4}')
pages_compressed=$(vm_stat | awk '/Pages occupied by compressor/ {gsub("\\.", "", $5); print $5}')
mem_used_bytes=$(( (pages_active + pages_wired + pages_compressed) * page_size ))

read -r disk_total_kb disk_used_kb <<< "$(df -k / | tail -1 | awk '{print $2, $3}')"
disk_total_bytes=$((disk_total_kb * 1024))
disk_used_bytes=$((disk_used_kb * 1024))

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
