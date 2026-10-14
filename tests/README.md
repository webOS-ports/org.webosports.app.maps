# Tests

## Unit tests

Engine logic without browser or network: the `MapEngines` helpers, OSRM
response → directions conversion (instructions, maneuver icons), Nominatim
result → place conversion, engine capabilities and map types.

    npm run test:unit

Needs only Node.js 18 or newer (`node --test`).

## Browser smoke test

`tests/smoke/app.test.js` drives the real app with puppeteer-core and talks to
the live services (OpenStreetMap tiles, Nominatim, OSRM, Open-Meteo, Google).
It checks start-up, search, marker popups, place details with elevation,
long press to drop a pin, drag to pan, routing per travel mode, direction
steps, clearing, map types and overlays, and switching engines in both
directions through the preference (which reloads the app).

    npm install
    npm run test:smoke                       # builds, serves deploy/ and runs headless Chromium
    tests/smoke/run.sh /path/to/screenshots  # same, with screenshots

Set `CHROME_BIN` if Chromium is not in one of the usual places.

`debug.html` cannot be used for the engine switch: Enyo's debug loader fails
on any page reload (also on master), so the smoke test runs the built app.

### On LuneOS (device or VirtualBox)

Install the built app, launch it, forward the WebAppManager inspector port and
run the same test against the running app:

    tools/deploy.sh
    scp -P 5522 -r deploy/* root@localhost:/usr/palm/applications/org.webosports.app.maps/
    ssh -p 5522 root@localhost 'luna-send -n 1 luna://com.webos.service.applicationmanager/launch "{\"id\":\"org.webosports.app.maps\"}"'
    ssh -p 5522 -N -L 19998:127.0.0.1:9998 root@localhost &
    node tests/smoke/app.test.js "connect=http://127.0.0.1:19998#org.webosports.app.maps/index.html"

On LuneOS the position comes from `com.webos.service.location`, which DevTools
cannot emulate; the test uses whatever fix the device has and skips the
location checks when there is none.

The test makes a few dozen requests to the public OpenStreetMap services;
do not run it in a loop.
