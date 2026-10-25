#!/bin/bash
# Move to the project directory wherever this script is located
cd "$(dirname "$0")"

# Check if server is already running on port 3000
if ! lsof -i :3000 >/dev/null 2>&1; then
  echo "🌸 Starting Diary Daily Planner..."
  nohup npm run dev >/dev/null 2>&1 &
  sleep 2
fi

# Open in default browser
open http://localhost:3000

# Close terminal window automatically
osascript -e 'tell application "Terminal" to close (every window whose name contains "start-mac")' 2>/dev/null || exit 0
