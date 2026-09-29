#!/bin/zsh
cd "$(dirname "$0")"
[[ -f "$HOME/.zprofile" ]] && source "$HOME/.zprofile"
[[ -f "$HOME/.zshrc" ]] && source "$HOME/.zshrc"
if [[ ! -d node_modules ]]; then
  npm install
fi
if curl -fsS http://127.0.0.1:3000/api/auth/status >/dev/null 2>&1; then
  open http://127.0.0.1:3000
  exit 0
fi
npm start &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM
until curl -fsS http://127.0.0.1:3000/api/auth/status >/dev/null 2>&1; do
  sleep 1
done
open http://127.0.0.1:3000
wait "$server_pid"
