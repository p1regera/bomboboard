#!/bin/zsh

# Kill any Next.js dev servers or Node processes occupying the usual ports.
pids=$(lsof -ti tcp:3000,3001 -s tcp:listen 2>/dev/null)
if [ -n "$pids" ]; then
  echo "Killing processes on dev ports: $pids"
  kill $pids
else
  echo "No dev processes listening on 3000/3001."
fi

# Clean up Turbopack’s lock so the next dev server can start cleanly.
lock_file=".next/dev/lock"
if [ -f "$lock_file" ]; then
  echo "Removing stale lock $lock_file"
  rm -f "$lock_file"
fi