#!/bin/bash
# Build the app, serve it on localhost and run the browser smoke test against it.
# usage: tests/smoke/run.sh [screenshot dir]
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
PORT=${PORT:-8282}

"$ROOT/tools/deploy.sh" > /dev/null

# The Google engine is only offered with a key (source/engines/GoogleEngine.js), which the
# build fills in. Without GOOGLE_MAPS_API_KEY the Google part of this test fails.
if [ -n "$GOOGLE_MAPS_API_KEY" ]; then
	case "$GOOGLE_MAPS_API_KEY" in
		*[!A-Za-z0-9_-]*) echo "GOOGLE_MAPS_API_KEY holds characters an API key does not" >&2; exit 1 ;;
	esac
	grep -rl '"PLACEHOLDER_GOOGLE_MAPS_API_KEY"' "$ROOT/deploy" | xargs -r sed -i "s|\"PLACEHOLDER_GOOGLE_MAPS_API_KEY\"|\"$GOOGLE_MAPS_API_KEY\"|"
else
	echo "GOOGLE_MAPS_API_KEY is not set: the app offers only the open engine, so the Google checks fail" >&2
fi
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/deploy" > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1

[ -n "$1" ] && mkdir -p "$1"
node "$ROOT/tests/smoke/app.test.js" "http://127.0.0.1:$PORT/index.html" $1
