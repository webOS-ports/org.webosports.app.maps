## About

This is the Map application written mainly for LuneOS and webOS. It is an Enyo 2 application which use the recent javascript Google Maps API v3.

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
