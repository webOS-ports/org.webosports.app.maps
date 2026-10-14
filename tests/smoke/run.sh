#!/bin/bash
# Build the app, serve it on localhost and run the browser smoke test against it.
# usage: tests/smoke/run.sh [screenshot dir]
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
PORT=${PORT:-8282}

"$ROOT/tools/deploy.sh" > /dev/null
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/deploy" > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1

[ -n "$1" ] && mkdir -p "$1"
node "$ROOT/tests/smoke/app.test.js" "http://127.0.0.1:$PORT/index.html" $1
