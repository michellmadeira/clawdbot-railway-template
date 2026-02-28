#!/usr/bin/env bash
# Optional: if SSH_USERNAME and SSH_PASSWORD are set, create user and start sshd, then run the main app.
set -euo pipefail

if [ -n "${SSH_USERNAME:-}" ] && [ -n "${SSH_PASSWORD:-}" ]; then
  mkdir -p /run/sshd
  chmod 755 /run/sshd
  if ! id "$SSH_USERNAME" &>/dev/null; then
    useradd -ms /bin/bash "$SSH_USERNAME"
    echo "$SSH_USERNAME:$SSH_PASSWORD" | chpasswd
  fi
  if [ -n "${AUTHORIZED_KEYS:-}" ]; then
    mkdir -p "/home/$SSH_USERNAME/.ssh"
    echo "$AUTHORIZED_KEYS" > "/home/$SSH_USERNAME/.ssh/authorized_keys"
    chown -R "$SSH_USERNAME:$SSH_USERNAME" "/home/$SSH_USERNAME/.ssh"
    chmod 700 "/home/$SSH_USERNAME/.ssh"
    chmod 600 "/home/$SSH_USERNAME/.ssh/authorized_keys"
  fi
  # Cursor/VS Code Remote-SSH: server installs in ~/.cursor-server or ~/.vscode-server; ensure home is writable
  chown -R "$SSH_USERNAME:$SSH_USERNAME" "/home/$SSH_USERNAME"
  /usr/sbin/sshd
fi

exec tini -- node src/server.js
