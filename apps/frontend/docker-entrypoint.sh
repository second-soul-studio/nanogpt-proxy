#!/bin/sh
set -eu

cat >/usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:3001}"
};
EOF

exec nginx -g "daemon off;"