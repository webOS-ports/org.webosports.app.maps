## About

This is the Map application written mainly for LuneOS and webOS. It is an Enyo 2 application with selectable map engines.

## Map engines

The engine is chosen in Settings > Map engine (the app reloads to switch):

* **OpenStreetMap** (default, no API key): [Leaflet](https://leafletjs.com) 1.9.4 (bundled in `lib/leaflet`),
  OpenStreetMap tiles, [Nominatim](https://nominatim.org) search, [OSRM](https://project-osrm.org) routing
  on the FOSSGIS servers (car, bike, foot) and [Open-Meteo](https://open-meteo.com) elevation.
  Packaged apps run from `file://` and send no Referer, which tile.openstreetmap.org refuses, so on the
  device the standard layer comes from tile.openstreetmap.de and the rail (transit) overlay is not offered.
* **Google Maps**: the Google Maps JavaScript API v3 the app always used, with traffic, transit routing and Street View.

Engines live in `source/engines/`; a new provider implements the interface documented in
`source/engines/MapEngine.js` and registers itself with `MapEngines.register()`.

Other apps can open the map with `maploc:<address or lat,lng>`, `mapto:<address>` (route from the
current position) or `geo:lat,lng` targets, e.g.
`luna-send -n 1 luna://com.webos.service.applicationmanager/launch '{"id":"org.webosports.app.maps","params":{"target":"maploc:Amsterdam Centraal"}}'`.

## Tests

See [tests/README.md](tests/README.md): `npm run test:unit` and `npm run test:smoke`.

![screenshot](http://2hp.sweb.cz/screen/github.png)


## State

The application state is an alpha state with some unfinished tasks. It contains a lot of features derived from my previous Mojo version of Google Maps for webOS.
It is tested physically only on HP Pre3, where is implemented also a compass feature.
You can search places, get directions, use street view, launch Navit from popup menu etc. Check also the settings and more maptypes.


## Desktop Development
In a web browser, open debug.html.  

To test the minified version  
`tools/deploy.sh`  
then open deploy/index.html


## Building, Installation, & Debugging

### webOS
`tools/deploy.sh -w`  

### LuneOS first installation
`tools/deploy.sh -w`
`adb push org.webosports.app.maps_0.0.1_all.ipk /media/internal`  
`adb shell`  
`luna-send -n 6 luna://com.palm.appinstaller/install '{"subscribe":true, "target": "/media/internal/org.webosports.app.maps_0.0.1_all.ipk"}'`  

### LuneOS re-install
`tools/deploy.sh -i`  
 
### LuneOS Debugging 
`adb forward tcp:1122 tcp:1122`  
In Safari, navigate to http://localhost:1122
