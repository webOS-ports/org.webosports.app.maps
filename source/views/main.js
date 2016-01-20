enyo.kind({
	name: "Maps.MainView",
	published: {	
	},
	components: [
		{kind: "Signals", onload: "load", onunload: "cleanup"},
		{kind: "Signals", name: "keyDownSignal", onkeydown: "handleKeyDown"},
		{kind: "enyo.Signals", onbackbutton: "handleBackGesture"},
		{name: "general", components: [
		{kind: "FittableRows", name: "layout", classes: "zoom-pre3", components: [
			{name: "mainPane", kind: "onyx.Toolbar", classes: "toolbar-main", layoutKind: 'FittableColumnsLayout', components: [
				{name: "searchBox", classes: "search-box", showing: true, kind: "onyx.InputDecorator", fit: true, layoutKind: 'FittableColumnsLayout', components: [
					{name: "searchLocation", classes: "truncating-text", kind: "onyx.Input", fit: true, selectOnFocus: true, defaultFocus: false, onfocus: "mainPaneTap", onchange: "searchChange", onclick: "searchChange", onenter: "searchChange", onblur: "blurSearch" }
				]},
				{name: "directBoxResult", classes: "search-box top-bar",  showing: false, fit: true, ontap: "toggleSearchDirections", components: [
					{kind: "onyx.IconButton", name: "directResultsBarIcon", ontap: "updateDirections", style: "float: left;", src: "assets/menu-icon-swap.png"},
					{kind: "enyo.Control", name: "directResultsBar", allowHtml: true}
				]},
				{name: "directBox", showing: false, fit: true, ontap: "", components: [
					{kind: "FittableColumns", components: [
						{kind: "onyx.ToggleIconButton", description: $L("origin"), classes: "toggleicon-in-fittable", name: "bookmarkA", src: "assets/menu-icon-bookmark.png", ontap: "bookmarkSelect"},
						{name: "directionBoxA", showing: true, fit: true, kind: "onyx.InputDecorator", layoutKind: 'FittableColumnsLayout', components: [
							//{kind: "onyx.Icon", classes: "direction-img", src: "assets/flagA.png"},
							{name: "directionStart", what: "origin", selectOnFocus: true, fit: true, classes: "truncating-text search-input", kind: "onyx.Input", placeholder: "Starting Location", onfocus: "bindAutocompleter"}
						]},
						{kind:"onyx.Button", content: "Close", classes: "onyx-dark direct-button", ontap: "toggleSearchDirections"}
					]},
					//{tag: "br", classes: "inline-wide-screens"},
					{kind: "FittableColumns", components: [  
						{kind: "onyx.ToggleIconButton", description: $L("destination"), classes: "toggleicon-in-fittable", name: "bookmarkB", src: "assets/menu-icon-bookmark.png", ontap: "bookmarkSelect"},
						{name: "directionBoxB", showing: true, fit: true, kind: "onyx.InputDecorator", layoutKind: 'FittableColumnsLayout', components: [
							//{kind: "onyx.Icon", classes: "direction-img", src: "assets/flagB.png"},
							{name: "directionEnd", what: "destination", selectOnFocus: true, fit: true, classes: "truncating-text search-input", kind: "onyx.Input", placeholder: "Ending Location", onchange: "codeDirection", onfocus: "bindAutocompleter"}
							
						]},
						{kind:"onyx.Button", name: "getDirectButton", disabled: false, content: "Go", classes: "onyx-blue direct-button", ontap: "calcRoute"},
					]}
				]},		  
				{name: "buttonsBox", classes: "buttons-box", showing: true, components:[
					{name: "clearButton", kind: "onyx.IconButton", showing: false, src: "lib/onyx/images/progress-button-cancel.png", panel: "info", ontap: "clearMap"},
					{kind: "onyx.IconButton", name: "directionButton", src: "assets/topbar-direct-icon.png", ontap: "toggleSearchDirections"},
					//{kind: "onyx.IconButton", src: "assets/list-view-icon.png", ontap: "togglePullout"}
					{kind: "onyx.ToggleIconButton", name: "myLocation", showing: true, value: false, src: "assets/menu-icon-mylocation.png", style: "opacity: 0.3", onChange: ""}
				]}
			]},
		]},
		{name: "initPopUp", showing: true, classes: "initpopup zoom-pre3", kind: "enyo.Control", components: [
			{kind: "onyx.Spinner", style: "margin-top: 150px;"},
			{name: "initText", content: "Loading...", style: "color: gray;"}
		]},
		{name: "mapdiv", id: "map_canvas", classes:"enyo-googlemap", ondragstart: "dragStart", ondrag: "dragging", ondragfinish: "dragEnd", onflick: "flick", ongesturestart: "gestureStart", ongesturechange: "gestureChange", ongestureend: "gestureEnd", onhold: "mapTapHold", ontap: "mapTap"},
		{name: "streetdiv", id: "street_canvas", classes: "enyo-street", showing: false, ondragstart: "SdragStart", ondrag: "Sdragging", ondragfinish: "", onflick: "", ongesturestart: "", ongesturechange: "", ongestureend: ""},
		{name: "markerPopup", classes: "marker-popup zoom-pre3", kind: "onyx.Popup", ontap: "markerPopupTap", onShow: "showPopUp", onHide: "hidePopUp", components: [
			{name: "popIcon", kind: "Image", classes: "item-icon", src: ""},
			{name: "popName", content: "", classes: "pop-name truncating-text"},
			{name: "popRating", content: "", classes: "item-rating", showing: false},
			{name: "popRatingStar", content: "", allowHtml: true, classes: "rating-container", showing: false},
			{name: "popAddress", content: "", allowHtml: true, classes: "item-address"}
		]},
		{name: "directPopup", classes: "direct-marker-popup zoom-pre3", style: "background: none; border: none; box-shadow: none; width: 100%", kind: "onyx.Popup", ontap: "", onShow: "showPopUp", components: [
				{name: "directPopoupBordered", style: "color: #F1F1F1; background: #0B775D url(lib/onyx/images/gradient.png) repeat-x bottom; background-size: contain;", classes: "direct-border" ,components: [
					{name: "directpop-centered", style: "width: 64px; float: left;", components: [
						{name: "directPopIcon", kind: "onyx.Icon", style: "background-image: url(assets/maneuvers-white.png); width: 64px; height: 64px;", src: ""},
						{name: "directPopDistance", content: "0.4 km", style: "text-align: center; font-weight: bold;"},
					]},
					{name: "directPopInstructionsContainer", classes: "direct-pop-instructions-container", components: [
						 {name: "directPopInstructions", content: "Odbocte doleva na west Maude Eve a je to", allowHtml: true, classes: "vertical-align"}
					]}
				]},
				{name: "directPopupNavigation", style: "width: 294px", components: [
					{name: "directStepBack", kind: "onyx.IconButton", src: "assets/menu-icon-back.png", style: "float: left;", step: -1, ontap: "directStepGo"},
					{name: "directStepForward", kind: "onyx.IconButton", src: "assets/menu-icon-forward.png", style: "float: right;", step: 1, ontap: "directStepGo"}
				]}
		]},
		{name: "markerPopupMenu", centered: false, floating: true, classes: "marker-popup-menu zoom-pre3", defaultKind: "onyx.MenuItem", kind: "onyx.Popup", onShow: "showPopUp", onHide: "hidePopUp", components: [
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/info.png"},
			{name: "markerInfo", classes: "marker-popup-menu-item", content: $L('Info'), ontap: "markerInfo"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", name: "streetMenuIcon", classes: "marker-popup-menu-icon", src: "assets/streetview-icon.png"},
			{name: "markerStreet", classes: "marker-popup-menu-item", content: $L('Street View'), ontap: "onMarkerStreet"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/flagA.png"},
			{name: "markerStart", classes: "marker-popup-menu-item", content: $L('Route from here'), ontap: "routeFromTo"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/flagB.png"},
			{name: "markerEnd", classes: "marker-popup-menu-item", content: $L('Route to here'), ontap: "routeFromTo"},
			{name: "markerNavitDivider", classes: "onyx-menu-divider", showing: false},
			{name: "markerNavitIcon", kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/navit_icon.png", showing: false},
			{name: "markerNavit", classes: "marker-popup-menu-item", content: $L('Route with Navit'), ontap: "routeWithNavit", showing: false},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/delete.png"},
			{name: "markerRemove", classes: "marker-popup-menu-item", content: $L('Remove'), ontap: "removeMarker"}
		]},
		{name: "infoDialog", kind: "onyx.Popup", classes: "zoom-pre3-text", scrim: true, centered: true, modal: true, floating: true, components: [
			{name: "infoDialogContent"},
			{tag: "br"},
			{kind: "onyx.Button", style: "width: 100%", content: $L("Close"), ontap: "closeInfoDialog"}
		]},
		{name: "statuspanel", classes: "status-shadow zoom-pre3", content: ""},
		{name: "bottomRightButtons", showing: false, classes: "bottom-right-buttons onyx-toolbar zoom-pre3", components: [	  
			{kind: "onyx.IconButton", name: "exitStreet", classes: "button-bottom", src: "lib/onyx/images/progress-button-cancel.png", ontap: "exitStreetView"},
			{kind: "onyx.IconButton", name: "zoomIn", value: 1, classes: "button-bottom", src: "assets/zoomin.png", ontap: "setZoomS"},
			{kind: "onyx.IconButton", name: "zoomOut", value: -1, classes: "button-bottom", src: "assets/zoomout.png", ontap: "setZoomS"}
		]},
		{name: "bottomLeftButtons", showing: true, classes: "bottom-left-buttons onyx-toolbar zoom-pre3", components: [
			//{kind: "onyx.IconButton", name: "myLocation", classes: "button-bottom", src: "assets/menu-icon-mylocation.png", ontap: "goCurrentLocation"}
			{kind: "onyx.Grabber", ontap: "togglePullout", ondragstart: "togglePullout"}
		]},
		//{kind: "gts.Keyboard", name: "keyboard", classes: "keyboard", showing: true, write: ""},
		{kind: "Pullout", classes: "pullout zoom-pre3",
			onShowTransit: "showTransit", 
			onShowTraffic: "showTraffic", 
			onShowBicycling: "showBicycling",
			onMapTypeSelect: "mapTypeSelect",
			onCacheOSM: "cacheOSM", 
			onBookmarkSelect: "bookmarkSelect",
			onLanguageChange: "langChange",
			onDirectOptions: "directOptions",
			onFillDirectField: "fillDirectField",
			onSetDirectStep: "setDirectStep",
			onSavePrefs: "savePrefs",
			onAnimateFinish: "pulloutToggled",
		components: [
			{classes: "pullout-menu", defaultKind: "onyx.IconButton", components: [
				{kind: "onyx.RadioGroup", classes: "pullout-toolbar", onActivate: "", components: [
					{kind: "onyx.Button", name: "maptypeRadio", classes: "header-button", panel: "maptypepanel", active: true, ontap: "togglePullout", components: [
						{kind: "onyx.Icon", src: "assets/icon-map-type.png"}
					]},
					{kind: "onyx.Button", name: "layersRadio", classes: "header-button", panel: "layerspanel", ontap: "togglePullout", components: [
						{kind: "onyx.Icon", src: "assets/icon-layers.png"}
					]},
					{kind: "onyx.Button", name: "bookmarkRadio", classes: "header-button", panel: "bookmarkpanel", ontap: "togglePullout", components: [
						{kind: "onyx.Icon", src: "assets/icon-places.png"}
					]},
					{kind: "onyx.Button", name: "directRadio", classes: "header-button", panel: "directpanel", ontap: "togglePullout", components: [
						{kind: "onyx.Icon", src: "assets/icon-directions.png"}
					]},
					{kind: "onyx.Button", name: "settingsRadio", classes: "header-button", panel: "settingspanel", ontap: "togglePullout", components: [
						{kind: "onyx.Icon", src: "assets/icon-settings.png"}
					]},
					{kind: "onyx.Button", name: "aboutRadio", classes: "header-button", panel: "aboutpanel", ontap: "togglePullout", components: [
						{kind: "onyx.Icon", src: "assets/icon-info.png"}
					]}
				]}
			]}
		]},
		{kind: "webOSAccel", name: "webOSAccel", onAcceleration: "accelHandler"},
		{kind: "webOSCompass", name: "webOSCompass", onHeading: "compassHandler", onTrackingHeading: "compassHandler"},
		{kind: "W3CGeolocation", name: "W3CGeolocation", onSuccess: "firstLocationSuccess", onFailure: "currentLocationFailure"},
		{kind: "webOSGeolocation", name: "webOSGeolocation", onSuccess: "firstLocationSuccess", onFailure: "currentLocationFailure"}
		]},
		{kind: "placeDetails", showing: false, onGoBack: "toggleDetails"}
	],
create: function(){
	
	this.inherited(arguments);
	this.API = false;
	this.lastPanel = "maptypepanel";
	this.droppedCount = 1;
	this.optimizedMarkers = !enyo.platform.webos;
	//this.optimizedMarkers = false;
	this.haveCompass = false;
	this.compassOpacity = 0;
	/* Adaptation to Firefox/FirefoxOS */
	this.transform = ""; //(enyo.platform.firefoxOS || enyo.platform.platformName === "firefox") ? "" : "-webkit-";
	//this.transform = "-webkit-";
	this.trackPosition = false;
	
	/* for webOS/luneOS devices use the legacy geolocation API, for the others the W3C Geolocation API */
	this.locationMethod = enyo.platform.webos ? "webOSGeolocation" : "W3CGeolocation";

	this.$.pullout.pulloutInit();

	/* Assign on-screen keyboard to main input */
	//this.$.keyboard.write = this.$.searchLocation;
	
	this.$.initText.setContent("Loading Google Maps API...");
	this.$.initPopUp.show();

},
load: function() {

	if (API) {
			this.init();
			console.log("*** API LOADED **** ", google.maps.version);
		} else {
			var errorLoadTimer = setTimeout((function(){
				this.load();
		}).bind(this), 1000);
	};

},
cleanup: function () {
	
	Prefs.lastPosLat = map.getCenter().lat();
	Prefs.lastPosLng = map.getCenter().lng();
	Prefs.lastZoom = map.getZoom();
	this.savePrefs();
	
	if(enyo.platform.webos) {
		try
		{
			this.$.webOSCompass.stopTracking();
			this.$.webOSAccel.stop();
		}
		catch(err)
		{
			console.log("Error in WebOSCompass and/or WebOSAccel (probably because we're on Desktop): "+ err.message);	
		}
	};
	
	enyo.log("*** EXIT ***");
},
init: function(){

	/** From here is the API fully loaded **/
	
	this.$.layout.rendered();
	
	if(enyo.platform.webos) {
	try
	{
		window.PalmSystem.stageReady();
		window.PalmSystem.setWindowOrientation("free");
		/* Workaround the pixelRatio, because of Pre3 */
		window.devicePixelRatio = window.innerWidth/this.$.mainPane.node.offsetWidth;	
	}
	catch (err)
	{
		console.log("Error in window.PalmSystem (probably because we're on Desktop): "+ err.message);
	}
	};

	this.$.pullout.$.APIver.setContent("<span style='color: gray; font-size: 12px'>Google Maps API: v" + google.maps.version + "</span>");
	this.$.initText.setContent("Initializing map...");
	
	var mapOptions = {
		zoom: Prefs.lastZoom,
		center: new google.maps.LatLng(Prefs.lastPosLat, Prefs.lastPosLng),
		disableDefaultUI: true,
		streetViewControl: false,
		draggable: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	/* Set mapType from preferences */	
	mapOptions.mapTypeId = this.getMapOptions(Prefs).mapTypeId;
	
	map = new google.maps.Map(document.getElementById('map_canvas'),mapOptions);
	new google.maps.event.addListenerOnce(map, 'idle', this.initAfterIdle.bind(this));
	
},
initAfterIdle: function() {

	/**  This function is called on first map idle  **/

	if(enyo.platform.webos) {
	try
	{
		window.PalmSystem.stageReady();
		window.PalmSystem.setWindowOrientation("free");
	}
	catch(err)
	{
		console.log("Error in window.PalmSystem (probably because we're on Desktop): "+ err.message);
	}
	finally
	{
		this.compassContainer = document.createElement("div");
		this.compassContainer.id = 'compass';
		this.needleContainer = document.createElement("div");
		this.needleContainer.id = 'needle';
		try
		{
			this.$.webOSCompass.startTracking();
			this.$.webOSAccel.start();
			this.$.webOSCompass.getCurrentHeading();
		}
		catch(err)
		{
			console.log("Error in WebOSCompass and/or WebOSAccel (probably because we're on Desktop): "+ err.message);	
		}
		finally
		{
			this.checkNavit(); 
		}
	}
	};
	
	/* DELETE !!!! */
	//this.statusPanel(window.devicePixelRatio, 5);
	//window.devicePixelRatio = 1.5;
	/*
	this.compassContainer = document.createElement("div");
	this.compassContainer.id = 'compass';
	this.needleContainer = document.createElement("div");
	this.needleContainer.id = 'needle';
	map.getDiv().firstChild.firstChild.appendChild(this.compassContainer);
	document.getElementById("compass").appendChild(this.needleContainer);
	*/

	this.initMainSearch();

	this.initCustomMapTypes();

	/* Show the layers enabled in preferences */
	if (Prefs.layers.traffic) this.showTraffic(null, {value: true});
	if (Prefs.layers.transit) this.showTransit(null, {value: true});
	if (Prefs.layers.bike) this.showBicycling(null, {value: true});

	/* init others */
	this.setupDirectionService();

	/* create an ElevationService */
	elevator = new google.maps.ElevationService();
	
	var clustererStyle = [{
        url: 'assets/lune-marker-red-64-64-cluster.png',
        height: 64,
        width: 64,
        anchor: [64, 64],
        textColor: "black",
        textSize: 24
      }];
	
	this.markerCluster = new MarkerClusterer(map, markers, {
          styles: clustererStyle
        });
	
	enyo.log("************ INIT DONE ************ ");
	
	this.$.initPopUp.hide();
	this.findCurrentLocation();
	
	
	/* 
	 * DEBUG
	 * 
	 * */
	 /*
	 this.firstLocationSuccess(null, {coords:
										{
										latitude: Prefs.lastPosLat,
										longitude: Prefs.lastPosLng,
										accuracy: 150
										}
									 });
	
	
	*/
	
	
	
	
	new google.maps.event.addListener(map, 'idle', this.mapIdle.bind(this));
	new google.maps.event.addListener(map, 'bounds_changed', this.mapBoundsChanged.bind(this));
},
initMainSearch: function(inSender, inEvent) {
	/* setup google SearchBox for main search */
	this.MainAutocomplete = new google.maps.places.SearchBox(this.$.searchLocation.node);
	this.MainAutocomplete.bindTo('bounds', map);
	new google.maps.event.addListener(this.MainAutocomplete, 'places_changed', this.SelectedAutocomplete.bind(this));
},
savePrefs: function (inSender, inEvent) {

	try {
		Prefs = enyo.mixin(Prefs, inEvent.prefs);
	} catch (e) {};

	enyo.setCookie("mapsAppPrefs", enyo.json.stringify(Prefs));
},
SelectedAutocomplete: function(inSender, inEvent) {

	this.$.layout.rendered();
	this.$.keyDownSignal.onkeydown = "handleKeyDown";
	var places = this.MainAutocomplete.getPlaces();
	this.$.searchLocation.place = places[0];
	this.PlaceMarker(places);
	
},
setZoom: function (inSender, inEvent) {
	map.setZoom(map.getZoom() + inSender.value);
},
setZoomS: function (inSender, inEvent) {
	this.panorama.setPov({ heading: this.panorama.getPov().heading, pitch: this.panorama.getPov().pitch, zoom: this.panorama.getPov().zoom + inSender.value });	
},
PlaceMarker: function (places) {

	var bounds = new google.maps.LatLngBounds();
	var imageUrl = "assets/lune-marker-red-64-64.png";
	var size = 64*window.devicePixelRatio;
	
	for (var i = 0, place; place = places[i]; i++) {

		if (place.lunetype) {
			switch (place.lunetype){
			  case "current":
				imageUrl = "assets/lune-marker-red-64-64.png";
				break;
			  case "recent":
				imageUrl = "assets/lune-marker-green-64-64.png";
				break;
			  case "dropped":
				imageUrl = "assets/lune-marker-blue-64-64.png";
				break;
			};
		};
		var image = {
			url: imageUrl,
			size: new google.maps.Size(size, size),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(size/2, size),
			scaledSize: new google.maps.Size(size, size)
		};
		
		// Create a marker for each place.
		var marker = new google.maps.Marker({
			map: map,
			icon: image,
			title: place.name,
			optimized: this.optimizedMarkers,
			position: place.geometry.location
		});
		
		place.distance = google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), place.geometry.location);

		marker.place = place;
		markers.push(marker);
		google.maps.event.addListener(marker,"click",this.MarkerClick.bind(this, marker));

		bounds.extend(place.geometry.location);
	};

	this.$.pullout.setSearchData(markers);
	this.markerCluster.clearMarkers()
	this.markerCluster.addMarkers(markers);

	/* Open pullout with results for more than one place result for wide screens */
	if ((places.length > 1)) {
		if (window.innerWidth > 480) { 
			this.$.pullout.openPullout("bookmarkpanel");
			this.$.pullout.togglePlaces({panel: "currentlist"},{name: "current"});
			this.$.bookmarkRadio.setActive(true);
		};
		map.fitBounds(bounds);
	} else if (places.length == 1) {
		this.MarkerClick(marker);
		if (places[0].lunetype != "dropped") {
			if (places[0].geometry.viewport) {
				map.fitBounds(places[0].geometry.viewport);
			} else {
				
				map.panTo(places[0].geometry.location);
				map.setZoom(14);
			
			};
		};
	};

	/* Go to current markers list when open pullout afterwards */
	this.lastPanel = "bookmarkpanel";

	/* Do the same as onchange event from searchBox */
	this.searchChange(null, {type: "change"});

},
MarkerClick: function (marker) {

	var place = marker.place;
	var pixel = this.fromLatLngToPixel(place.geometry.location);

	if (place.lunetype == "mylocation") {
		var date = new ilib.Date();
		var lastFix = new ilib.DateFmt({locale: Prefs.lang}).formatRelative(date, this.myLocationMarker.place.lastfix);		
		place.formatted_address = $L("Loc: ") + currentPos.toUrlValue(8) + "<br>" + $L("Updated") + ": " + lastFix;
	};
	
	this.$.placeDetails.setPlaceDetails(place);
	this.$.popName.setContent(place.name);
	this.$.popAddress.setContent(place.formatted_address);
	if (place.photos) {
				this.$.popIcon.setSrc(place.photos[0].getUrl({'maxWidth': 100, 'maxHeight': 100}));
			} else {
				this.$.popIcon.setSrc(marker.icon.url);
			};

	if (place.rating) {
				this.$.popRating.show();
				this.$.popRatingStar.show();
			} else {
				this.$.popRating.hide();
				this.$.popRatingStar.hide();
			};

	this.$.popRating.setContent(place.rating);
	var ratingElement = '<div class="rating_bar"><div id="ratingstar" style="width: ' + place.rating*20 + '%;"></div></div>';
	this.$.popRatingStar.setContent(ratingElement);

	this.$.markerPopup.applyStyle("top", (this.$.mainPane.node.offsetHeight+5) + "px");
	this.$.markerPopup.applyStyle("left", ((this.$.mainPane.node.offsetWidth - 294)/2) + "px");	
	
	this.$.markerPopup.show();
	this.lastClickedMarker = marker;

},
directMarkerClick: function (marker, item) {

	 if (item.maneuver) {
			this.$.directPopIcon.setClasses(item.maneuver);
		} else {
			this.$.directPopIcon.setClasses("straight");
	};

	this.$.directPopInstructions.setContent(item.instructions);
	this.$.directPopDistance.setContent(item.distance.text);
	this.$.directPopup.applyStyle("top", (this.$.mainPane.node.offsetHeight+5) + "px");
	this.$.directPopup.applyStyle("left", ((this.$.mainPane.node.offsetWidth - 294)/2) + "px");

	this.$.directPopup.show();
	
},

mapTypeSelect: function(inSender, inEvent) {
	
	
	var suffix = inEvent.isRetina ? (Prefs.retina ? "_HDPI" : "") : "";
	inEvent.mapType = inEvent.mapType + suffix;

	var mapOptions = this.getMapOptions(inEvent);

	Prefs.mapType = inEvent.mapType;
	this.savePrefs();

	map.setOptions(mapOptions);
},

getMapOptions: function(inEvent) {
	
	var mapOptions = {};
	
	switch (inEvent.mapType) {
		default:
			mapOptions.mapTypeId = inEvent.mapType;
			break;
		case "OSM":
			if(Prefs.OSMMapCache) {
				mapOptions.mapTypeId = "OSMCached";
			} else {
				mapOptions.mapTypeId = "OSM";
			};
			break;
		case "ROADMAP":
			mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
			break;
		case "SATELLITE":
			mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE
			break;
		case "HYBRID":
			mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID
			break;
		case "TERRAIN":
			mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN
			break;
	};
	
	return mapOptions;
},
resizeHandler: function() {
	enyo.log("window size changed");
	//google.maps.event.trigger(map, "resize");
},
togglePullout: function(inSender) {

	if (inSender.panel) {  	
		this.lastPanel = inSender.panel;
	};
	this.$.pullout.toggle(this.lastPanel);
	
},
toggleSearchDirections: function(inSender, inEvent) {
	
	var frompop = (inSender == "routeFromTo") ? true : false;
	
	this.$.searchBox.setShowing(!(this.$.searchBox.showing) || (this.$.directBoxResult.getShowing()));
	this.$.directBox.setShowing(!(this.$.directBox.showing) && !(this.$.getDirectButton.getDisabled()) && !(this.$.searchBox.getShowing()));
	this.$.directBoxResult.setShowing(!(this.$.searchBox.getShowing()) && this.$.getDirectButton.getDisabled() && !(this.$.directBox.showing));
	this.$.buttonsBox.setShowing(this.$.searchBox.getShowing() || (this.$.directBoxResult.getShowing()));

	if ((this.$.directionStart.getValue() == "")) {
			this.directRequest.origin = currentPos;
			this.$.directionStart.setValue($L("My Location"));
		};
		
	if ((this.$.searchLocation.getValue() != "") && !frompop) {
			this.directRequest.destination = this.$.searchLocation.place.geometry.location;
			this.$.directionEnd.setValue(this.$.searchLocation.place.name);
		};
		
	this.$.keyDownSignal.onkeydown = this.$.searchBox.getShowing() ? "handleKeyDown" : "";

	this.$.layout.rendered();

	google.maps.event.trigger(map, "resize");

},

showTraffic: function(inSender, inEvent) {
	map.overlayMapTypes.setAt(0, inEvent.value ? this.trafficMapType : null);
	Prefs.layers.traffic = inEvent.value;
	this.savePrefs();
},
showTransit: function(inSender, inEvent) {
	map.overlayMapTypes.setAt(1, inEvent.value ? this.transitMapType : null);
	Prefs.layers.transit = inEvent.value;
	this.savePrefs();
},
showBicycling: function (inSender, inEvent){
	bikeLayer.setMap(inEvent.value ? map : null);
	Prefs.layers.bike = inEvent.value;
	this.savePrefs();
},
findCurrentLocation: function() {
	this.$[this.locationMethod].getCurrentPosition();
},
startTracking: function() {
	this.$[this.locationMethod].startTracking();
},
goCurrentLocation: function (inSender, inEvent) {
	
	this.trackPosition = inSender.getValue();
	
	//inSender.addRemoveClass("tracking", true);
	map.fitBounds(this.circle.getBounds());
	if (map.getZoom() > 14 ) map.setZoom(14);
},

firstLocationSuccess: function(inSender, inData) {
	
	currentPos = new google.maps.LatLng(inData.coords.latitude, inData.coords.longitude);
	
		var size = 42*window.devicePixelRatio;
		
		this.statusPanel("Current location found...", 3);
		
		if (enyo.platform.webos) map.getDiv().firstChild.firstChild.appendChild(this.compassContainer);
		
		var image = {
			url: "assets/enyo-map-marker_blue_dot.png",
			size: new google.maps.Size(size, size),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(size/2, size/2)
			//scaledSize: new google.maps.Size(size, size)
		  };
		
		this.myLocationMarker = new google.maps.Marker({
			position: currentPos,
			map: map,
			//zIndex: 999999,
			optimized: this.optimizedMarkers,
			icon: image
		});

		this.myLocationMarker.place = [];
		this.myLocationMarker.place.geometry = [];
		this.myLocationMarker.place.name = $L("My Location");
		this.myLocationMarker.place.icon = image.url;
		this.myLocationMarker.place.lunetype = "mylocation";
		this.myLocationMarker.place.id = Date.now();
		this.myLocationMarker.place.geometry.location = currentPos;
		this.myLocationMarker.place.lastfix = new ilib.Date();		
		this.myLocationMarker.place.formatted_address = "Loc: " + currentPos.toUrlValue(8);

		markers.push(this.myLocationMarker);
		
		this.$.pullout.setSearchData(markers);
		
		
		this.$.myLocation.applyStyle("opacity", 1);
		this.$.myLocation.onChange = "goCurrentLocation";
		this.$.myLocation.setShowing(true);
		
		/* accuracy circle */
		this.accuracy = 350;
		if (inData.coords.accuracy) this.accuracy = inData.coords.accuracy;

			this.circle = new google.maps.Circle({
				center: currentPos,
				radius: this.accuracy, //radius in meters
				map: map,
				optimized: true,
				fillColor: "#60bbe5",
				fillOpacity: 0.1,
				strokeColor: "#60bbe5",
				strokeOpacity: 0.4,
				strokeWeight: 1
			});

		/* Bind the accuracy circle */
		this.circle.bindTo('center', this.myLocationMarker, 'position');
		map.fitBounds(this.circle.getBounds());
		if (map.getZoom() > 14 ) map.setZoom(14);
		
		/* Start tracking after first (not so precise as tracking) location succes */
		this.startTracking();
		
	this.updateCompassPosition(currentPos);
	
	this.$[this.locationMethod].onSuccess = "trackingLocationSuccess";
	
	google.maps.event.addListener(this.myLocationMarker,"click",this.MarkerClick.bind(this, this.myLocationMarker));

},

trackingLocationSuccess: function(inSender, inData) {
	currentPos = new google.maps.LatLng(inData.coords.latitude, inData.coords.longitude);
	if (this.trackPosition) map.setCenter(currentPos);
	this.myLocationMarker.place.geometry.location = currentPos;
	this.myLocationMarker.place.lastfix = new ilib.Date();	
	this.myLocationMarker.place.formatted_address = currentPos;
	this.myLocationMarker.setPosition(currentPos);
	this.circle.setRadius(inData.coords.accuracy); // update accuracy circle
	this.updateCompassPosition(currentPos);
},

currentLocationFailure: function(inSender, inData) {
	enyo.log("Geolocation failed: ", inData.message);
	this.statusPanel("Location error: " + inData.message, 10);
},

pulseDot: function (latlng) {
	/* DEPRECATED - pulsation ring doesn't bring more information to user and slows down the app */
	/* this function draws a one pulse around a dot */

	if (!document.getElementById("pulse")) {
			
			try {
			map.getDiv().firstChild.firstChild.appendChild(this.pulseContainer);
		} catch (e) {
			enyo.log("Map not loaded yet...");
			};
		
	} else {
	
		var coord = this.fromLatLngToPixel(latlng);
		
		coord.x = Math.round(coord.x-25);
		coord.y = Math.round(coord.y-25);

			this.pulseContainer.style.top = coord.y + "px;";
			this.pulseContainer.style.left = coord.x + "px;";
			this.pulseContainer.style.display = 'block';
		
			this.blockpulse = true;
			
			var timer = setTimeout(function(){	
				this.pulseContainer.style.display = 'none';
			}.bind(this), 500);
	};
	
},

gestureStart: function(inSender, e){
	
	new google.maps.event.addListenerOnce(map, 'bounds_changed', this.MapCenterChanged.bind(this));
	
	this.GestureCenter = map.getCenter();	
	this.Zooming = true;
	this.previouszoom = map.getZoom();
	this.previousScale = e.scale;
	this.previousS = 0;

	e.centerX = 0;
	e.centerY = 0;
	for(var t = 0; t < e.touches.length; ++t) {
		e.centerX += e.touches[t].clientX / e.touches.length;
		e.centerY += e.touches[t].clientY / e.touches.length;
	}
	this.oldeventg = e;
	
	this.TilesContainer = map.getDiv().firstChild.firstChild;
	this.TilesContainer.style.overflow = "visible !important;";

	this.addpaneventg = [];
	this.addpaneventg.cx = 0;
	this.addpaneventg.cy = 0;
	this.addpaneventg.oldcenter = this.fromLatLngToPixel(map.getCenter());

},

gestureChange: function(inSender, e){
	
		try {
			e.preventDefault();
		}
		catch(ex) {
		}
		
		/* ToDo: map rotate upon gesture works... needs to be more tested */
		//var rotation = 0;
		
		var rotation = e.rotation;

		//var rotate = "rotate3d(0,0,1," + rotation + "deg) ";
		var rotate = "";

		e.centerX = 0;
		e.centerY = 0;
		for(var t = 0; t < e.touches.length; ++t) {
			e.centerX += e.touches[t].clientX / e.touches.length;
			e.centerY += e.touches[t].clientY / e.touches.length;
		}
		var transform = rotate + "scale3d(" + e.scale + "," + e.scale + ",1)" + " translate3d(" + (-this.oldeventg.centerX + e.centerX)/e.scale + "px," + (-this.oldeventg.centerY + e.centerY)/e.scale + "px, 0px)";
		this.TilesContainer.style[this.transform + "transform"] = transform;

		this.addpaneventg.cx = this.addpaneventg.oldcenter.x + (this.oldeventg.centerX - e.centerX);
		this.addpaneventg.cy = this.addpaneventg.oldcenter.y + (this.oldeventg.centerY - e.centerY);

	 	var s = e.scale;
	 	var z = 0;
	 	
		if (s<=0.187) s = -3;
	 	if (s>0.187 && s<=0.375) s = -2;
	 	if (s>0.375 && s<=0.75) s = -1;
	 	if (s>0.75 && s<=1.5) s = 0;
	 	if (s>1.5 && s<=3) s = 1;
	 	if (s>3 && s<=6) s = 2;
	 	if (s>6) s = 3;	
	 	
	 	if (this.previousS!=s) {
			this.z = this.previouszoom + s;
			this.previousS = s;
		};
		


},
gestureEnd: function(inSender, e){
	map.setZoom(this.z);	
	var point = new google.maps.Point(this.addpaneventg.cx, this.addpaneventg.cy);
	map.setCenter(this.fromPixelToLatLng(point));
},

dragStart: function(inSender, inEvent) {

	this.$.markerPopup.hide();

	new google.maps.event.addListenerOnce(map, 'bounds_changed', this.MapCenterChanged.bind(this));

	inEvent.preventDefault();

	this.TilesContainer = map.getDiv().firstChild.firstChild;
	this.TilesContainer.style.overflow = "visible";

	this.oldcenter = this.fromLatLngToPixel(map.getCenter());
	this.wasflicked = false;	
	
},

dragging: function(inSender, inEvent) {

	this.moveMapBy(inEvent.dx, inEvent.dy);
	this.draggingEvent = inEvent;
},

moveMapBy: function(x,y,deg) {

	this.TilesContainer.style[this.transform + "transform"] = "translate3d(" + x + "px," + y + "px, 0px)";

},

dragEnd: function(inSender, inEvent){
	
	if (!this.wasflicked) {
		this.mapEndMove(inEvent);
	};

},

flick: function(inSender, inEvent) {

	this.wasflicked = true;
	
	var transTime = Math.sqrt(inEvent.xVelocity*inEvent.xVelocity + inEvent.yVelocity*inEvent.yVelocity)*400;

	inEvent.dx = this.draggingEvent.dx + Math.abs(this.draggingEvent.dx)*inEvent.xVelocity;
	inEvent.dy = this.draggingEvent.dy + Math.abs(this.draggingEvent.dy)*inEvent.yVelocity;
	
	this.TilesContainer.style[this.transform + "transition"] = this.transform + "transform " + transTime/1000 + "s ease-out";

	this.moveMapBy(inEvent.dx, inEvent.dy);
	
	var timer = setTimeout(function(){

			this.mapEndMove(inEvent);

	}.bind(this), transTime);


},

mapEndMove: function(inEvent) {

	var point = new google.maps.Point(this.oldcenter.x-inEvent.dx, this.oldcenter.y-inEvent.dy);
	this.residuePos = inEvent;

	map.setCenter( this.fromPixelToLatLng(point) );

},

MapCenterChanged: function () {

	this.TilesContainer.style[this.transform + "transition"] = "";
	this.TilesContainer.style[this.transform + "transform"] = "";
	
	//this.updateCompassPosition(currentPos);

	this.wasflicked = false;

},

fromLatLngToPixel: function (position) {
	var scale = Math.pow(2, map.getZoom());
	var proj = map.getProjection();
	var bounds = map.getBounds();

	var nw = proj.fromLatLngToPoint(
	new google.maps.LatLng(
		bounds.getNorthEast().lat(),
		bounds.getSouthWest().lng()
	));
	var point = proj.fromLatLngToPoint(position);

	return new google.maps.Point(
		Math.floor((point.x - nw.x) * scale),
		Math.floor((point.y - nw.y) * scale));
},

fromPixelToLatLng: function (pixel) {
	var scale = Math.pow(2, map.getZoom());
	var proj = map.getProjection();
	var bounds = map.getBounds();

	var nw = proj.fromLatLngToPoint(
	new google.maps.LatLng(
		bounds.getNorthEast().lat(),
		bounds.getSouthWest().lng()
	));
	var point = new google.maps.Point();

	point.x = pixel.x / scale + nw.x;
	point.y = pixel.y / scale + nw.y;

	return proj.fromPointToLatLng(point);
},

clearMap: function (inSender, inEvent) {
	
	this.clearMarkers();
	this.$.clearButton.hide();
	this.$.searchLocation.setValue("");
	this.$.searchLocation.place = null;
	
	/* Clear directions */
	this.directionsDisplay.setMap(null);
	this.$.getDirectButton.setDisabled(false);	
	this.$.searchBox.setShowing(false);
	if (this.directStepMarker) this.directStepMarker.setMap(null);
	this.directStepMarker = null;
	this.$.directPopup.hide();
	this.$.directionStart.setValue("");
	this.$.directionEnd.setValue("");
	this.$.directionStart.place = null;
	this.$.directionEnd.place = null;
	this.$.pullout.clearDirectData([]);
	
	this.toggleSearchDirections();
	
	this.droppedCount = 1;
	
	this.$.layout.rendered();
},

clearMarkers: function (inSender, inEvent) {
	
	// Clear the cluster
	if (this.markerCluster) {
		this.markerCluster.clearMarkers();
	};
	
	for (e=0; e<markers.length; e++){
		markers[e].setMap(null);
	}
	
	markers = [];
	
	if (this.myLocationMarker) { 
		markers.push(this.myLocationMarker);
		this.myLocationMarker.setMap(map);
	};
	
	this.$.pullout.setSearchData(markers);

},

mainPaneTap: function(inSender) {
	this.$.pullout.closePullout();
},

searchChange: function (inSender, inEvent) {

	switch (inEvent.type) {
	case "click":
		this.$.clearButton.hide();
		break;
	case "change":
		this.$.clearButton.show();
		this.$.searchLocation.blur();
		break;
	}

	this.$.layout.rendered();
},
langChange: function (inSedner, inEvent) {
	Prefs.lang = inEvent.value;
	this.savePrefs();
},
handleKeyDown: function(inSender, inEvent) {
	
		this.$.markerPopup.hide();
		this.$.markerPopupMenu.hide();
		if (inEvent.keyIdentifier == "Back") return;
		inEvent.preventDefault();
		this.$.pullout.closePullout();
		this.$.searchLocation.selectOnFocus = false;
		this.$.searchLocation.hasNode().focus();
		this.$.searchLocation.focus();
		this.$.searchLocation.setValue(String.fromCharCode(inEvent.keyCode).toLowerCase());
		this.$.keyDownSignal.onkeydown = "";
		this.$.searchLocation.selectOnFocus = true;
},

GeocodeFromLatLng: function(latlng) {
	
	geocoder = new google.maps.Geocoder();
	
	geocoder.geocode({'latLng': latlng}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		  var place = results[0];
		  //force the result to have original coordinates
		  place.geometry.location = latlng;
		  place.name = "Dropped pin #" + this.droppedCount;
		  place.id = Date.now();
		  place.lunetype = "dropped";
		  place.icon = "assets/lune-marker-blue-64-64.png";
		  this.droppedCount++;
		  this.PlaceMarker([place]);
		  this.statusPanel("Pin dropped ...", 1);

		} else {
		enyo.log("Geocoder failed due to: " + status);
			this.statusPanel("Can't drop a pin here: " + status, 5);
		}
		}.bind(this));

},

onMarkerStreet: function() {
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();
	this.goStreetView(this.lastClickedMarker.place);
},

goStreetView: function(place) {
	
	this.$.streetdiv.show();
	
	var panoramaOptions = {
				  position: place.geometry.location,
				  visible: false,
				  addressControl: true,
				  linksControl: true,
				  panControl: false,
				  zoomControl: false,
				  enableCloseButton: false,
				  pov: {
					heading: 34,
					pitch: 10,
					zoom: 1
				  			}
	};
	
	this.panorama = new  google.maps.StreetViewPanorama(document.getElementById("street_canvas"), panoramaOptions);
	
	this.panorama.setVisible(true);
	
	this.$.bottomRightButtons.show();
	
	this.$.bottomLeftButtons.hide();
	
	this.$.mainPane.hide();
	
},

exitStreetView: function() {
	
	this.$.streetdiv.hide();
	
	this.panorama.setVisible(false);
	
	this.$.bottomRightButtons.hide();
	
	this.$.bottomLeftButtons.show();
	
	this.$.mainPane.show();
},

SdragStart: function(inSender, event) {

	this.Soldx = event.clientX;
	this.Soldy = event.clientY;
	
},

Sdragging: function(inSender, event) {

	this.headingoffset = Math.round((this.Soldx - event.clientX)*0.25);
	this.pitchoffset = Math.round((this.Soldy - event.clientY)*0.25);

	this.panorama.setPov({ heading: this.panorama.getPov().heading + this.headingoffset, pitch: this.panorama.getPov().pitch - this.pitchoffset, zoom: this.panorama.getPov().zoom });

	this.Soldx = event.clientX;
	this.Soldy = event.clientY;

},
initCustomMapTypes: function () {
	
		map.mapTypes.set("ROADMAP_HDPI", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://mts0.google.com/vt?lyrs=m@216000000,seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
                    //return "http://mts0.google.com/vt?hl=cs&src=app&lyrs=m@216000000,traffic|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
                },
                tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 17,
				name: "ROADMAP_HDPI"
        }));
        
        map.mapTypes.set("TERRAIN_HDPI", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://mts0.google.com/vt?lyrs=p@216000000,seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
                    //return "http://mts0.google.com/vt?hl=cs&src=app&lyrs=m@216000000,traffic|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
                },
                tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 17,
				name: "TERRAIN_HDPI"
        }));
        
        map.mapTypes.set("HYBRID_HDPI", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://mts0.google.com/vt?lyrs=y@216000000,seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
                    //return "http://mts0.google.com/vt?hl=cs&src=app&lyrs=m@216000000,traffic|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
                },
                tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 17,
				name: "HYBRID_HDPI"
        }));
        
        map.mapTypes.set("OSM", new google.maps.ImageMapType({
			
                getTileUrl: function(coord, zoom) {
						return "http://a.tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                name: "OpenStreetMap",
                credit: 'OpenStreetMap',
                maxZoom: 18
        }));
        
        OSMMapType.tileSize = new google.maps.Size(256, 256);
        map.mapTypes.set("OSMCached", new OSMMapType(Prefs));

        
        map.mapTypes.set("NOKIA", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/normal.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
                },
                tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 17,
				name: "NOKIA"
        }));
        
        map.mapTypes.set("OCM", new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
            return "http://tile.opencyclemap.org/cycle/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
            },
            tileSize: new google.maps.Size(256, 256),
            name: "OpenCycleMap",
            maxZoom: 18
        }));
        
        map.mapTypes.set("Yandex", new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                return "http://vec0"+((coord.x+coord.y)%5)+".maps.yandex.net/tiles?l=map&v=2.26.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
            },
            tileSize: new google.maps.Size(256, 256),
            name: "Yandex maps",
            maxZoom: 18
        }));
        
        map.mapTypes['Yandex'].projection = new YandexProjection(); 
        
        map.mapTypes.set("Bing", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				
		    // http://ak.dynamic.t2.tiles.virtualearth.net/comp/ch/120212302122?mkt=en-us&it=G,VE,BX,L,LA&shading=hill&og=66&n=z
			var z = 17 - zoom;
			var s = this.getMsveString(coord.x,coord.y,z);
			var v = this.getMsveServer(coord.x,coord.y,z);
			return 'http://r'+v+'.ortho.tiles.virtualearth.net/tiles/r'+s+'.png?g=1'; 
			},
			getMsveDirection: function(x, y) {
				if (x == 1){
				if (y == 1){
				return '3';
				} else if (y == 0){
				return '1';
				}
				} else if (x == 0) {
				if (y == 1){
				return '2';
				} else if (y == 0){
				return '0';
				}
				}
				return '';
			},
			getMsveString: function(x, y, z) {
				var rx, x, ry, y;
				var s = '';
				for(var i = 17; i > z; i--){
				rx = x % 2;
				x = Math.floor(x / 2);
				ry = y % 2;
				y = Math.floor(y / 2);
				s = this.getMsveDirection(rx, ry) + s;
				}
				return s;
			},
			getMsveServer: function(x, y, z) {
				var rx, x, ry, y;
				var s = '';
				for(var i = 17; i > z; i--){
				rx = x % 2;
				x = Math.floor(x / 2);
				ry = y % 2;
				y = Math.floor(y / 2);
				s = this.getMsveDirection(rx, ry);
				}
				return s;
			},
			tileSize: new google.maps.Size(256, 256),
			name: "Bing",
			maxZoom: 18
		}));
		
        map.mapTypes.set('Wikimapia', new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                        return 'http://i'+ ((coord.x%4) + (coord.y%4) * 4) +'.wikimapia.org/?x=' + coord.x + '&y='+ coord.y +'&zoom='+ zoom +'&r=0&type=&lng=0';
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                alt: "Wikimapia",
                name: "Wikimapia",
                maxZoom: 22,
                minZoom:0
        }));
        
        map.mapTypes.set('2GIS', new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                        return "http://tile"+((coord.x+coord.y)%5)+".maps.2gis.ru/tiles?x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                alt: "2ГИС",
                name: "ДубльГИС",
                maxZoom: 13,
                minZoom:0
                //, opacity:0.5
        }));
        
        map.mapTypes.set('Visicom', new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                        var y = Math.pow(2, zoom) - 1 - coord.y;
                        return 'http://tms'+ ((coord.x+coord.y)%4) +'.visicom.ua/1.0.3/world_ru/'+ zoom +'/'+ coord.x +'/'+ y +'.png';
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                alt: "Visicom",
                name: "Visicom",
                maxZoom: 18,
                minZoom:0
                //, opacity:0.5
        }));
        
        map.mapTypes.set('Apple', new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                        return "http://gsp2.apple.com/tile?api=1&style=slideshow&layers=default&lang=en_EN&z=" + zoom + "&x=" + coord.x + "&y=" + coord.y + "&v=9";
                },
                tileSize: new google.maps.Size(256, 256),
                name: "Apple",
                alt: "Эпл",
                minZoom: 3,
                maxZoom: 14
        }));
		
		/* Overlays map types - unofficial, but only way how to show them on other map types */
		this.transitMapType = new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				
			/* This URL gets just transit lines on the transparent background */			 
			return "http://mts0.googleapis.com/vt?lyrs=a,transit|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=1";
			/* style 15 - normalni styl
			 * traffic|seconds.... doprava pro cr
			 * style 2 - velke texty pro vyssi DPI */
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true
		});
		
		this.trafficMapType = new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				
			/* This URL gets just transit lines on the transparent background */			 
			return "http://mts0.googleapis.com/vt?lyrs=h,traffic|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=3";
			/* style 15 - normalni styl
			 * traffic|seconds.... doprava pro cr
			 * style 2 - velke texty pro vyssi DPI */
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true
		});
        
},

markerPopupTap: function(inSender, inEvent) {
		this.isStreet(this.lastClickedMarker.place.geometry.location);
		this.$.markerPopupMenu.setStyle(this.$.markerPopup.getStyle());
		this.$.markerPopupMenu.show();
},

showPopUp: function(inSender, inEvent) {
	inSender.applyStyle("opacity", 1);
},
hidePopUp: function(inSender, inEvent) {
	inSender.applyStyle("opacity", 0);
	this.$.markerStreet.setStyle("color: grey;");
	this.$.markerStreet.ontap = "";
	this.$.streetMenuIcon.setSrc("lib/onyx/images/spinner-dark.gif");
},
markerInfo: function(inSender, inEvent) {
			
			this.$.markerPopup.hide();
			this.$.markerPopupMenu.hide();
			//this.$.pullout.openPullout("bookmarkpanel");
			//this.$.bookmarkRadio.setActive(true);
			//this.$.pullout.togglePlaces({panel: "detailspanel", name: "details"});
			this.toggleDetails();		
},

toggleDetails: function() {
	
	this.$.general.setShowing(this.$.placeDetails.getShowing());
	this.$.placeDetails.setShowing(!this.$.general.getShowing());
	
},

removeMarker: function(inSender, inEvent) {
			
	//this.lastClickedMarker.place	
	//hide them on map
	
		
	//remove from markers array
	for (e=0; e<markers.length; e++){
		if (this.lastClickedMarker.place.id == markers[e].place.id) {
					enyo.log("Removing marker from array: ", e);
					markers[e].setMap(null);
					markers.remove(e);
					this.$.pullout.setSearchData(markers);
					this.markerCluster.clearMarkers()
					this.markerCluster.addMarkers(markers);	
				};
	};
	
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();					
},

isStreet: function (location) {
	
	// Check for a street view at the position
	this.streetViewCheck = new google.maps.StreetViewService();  
	this.streetViewCheck.getPanoramaByLocation(location, 50, function(result, status) {
		if (status == "OK") {
			
			this.$.markerStreet.ontap = "onMarkerStreet";
			this.$.markerStreet.setStyle("color: white;");
			this.$.streetMenuIcon.setSrc("assets/streetview-icon.png");
			
		}else{
			
			this.$.markerStreet.ontap = "";
			this.$.markerStreet.setStyle("color: grey;");
			this.$.streetMenuIcon.setSrc("assets/streetview-icon-inactive.png");
			
	  
		}
	}.bind(this));
},

updateGPS: function (inSender, inEvent) {
	
	var Timer = setTimeout((function(){
		this.$[this.locationMethod].getCurrentPosition();
	 }).bind(this), Prefs.GPSinterval*1000);
},

checkNavit: function (path) {

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = 
		function(){
		  if (xhr.readyState == 4){
			if (xhr.status == 200){
				this.isNavit = true;
 				enyo.log("**** Navit installed ****");
 				this.$.markerNavitDivider.show();
 				this.$.markerNavitIcon.show();
 				this.$.markerNavit.show();
			  return true;
			}
			else {
			  this.isNavit = false;
			  enyo.log("**** Navit is not installed ****");
			}
		}
		}.bind(this);

	  /* This sane and allowed way how to check the app availability - if exist the navit.xml, probably Navit is installed */
	  xhr.open("HEAD", "/media/internal/appdata/org.webosinternals.navit/navit.xml", true);
	  xhr.send();	  
},

routeWithNavit: function() {
	this.openNavit(this.lastClickedMarker.place);
	this.$.markerNavit.setContent($L('Opening Navit...'));
},

openNavit: function(place){
		
	var name = place.name;
	var route = 1;
	var pos = place.geometry.location;

	var lat = JSON.stringify(pos.lat());
	var lng = JSON.stringify(pos.lng());

	lat = lat.substring(0, lat.indexOf(".")+5);
	lng = lng.substring(0, lng.indexOf(".")+5);

	//Route to or show position?
	if (route=="0"){ //show on map
		stFile='/media/internal/appdata/org.webosinternals.navit/command.txt';
		stText='navit.pitch=0;navit.tracking=0;navit.follow_cursor=0;navit.set_center("' + lng + " " + lat + '");';
		writeMode=false;
	} else { //route to target
		stFile='/media/internal/appdata/org.webosinternals.navit/command.txt';
		stText='navit.set_destination(\"' + lng + " " + lat + '\",\"' + name + '\");';
		writeMode=false;
	};
	
	enyo.log("Opening Navit adr:%s lng:%s lat:%s type:%s", name, lng, lat, route);

	
	this.request = new enyo.ServiceRequest({
		service: 'palm://ca.canucksoftware.filemgr', 
		method: 'write'
	});
	this.request.response(this, "navitResponseSuccess");
	this.request.error(this, "navitResponseFailure");
	this.request.go({
		file: stFile,
		str: stText,
		append: writeMode
		});
},

navitResponseSuccess:	function(payload) {
	var request2 = new enyo.ServiceRequest({
		service: 'palm://com.palm.applicationManager', 
		method: 'open'	
	});
	request2.go({
			id: 'org.webosinternals.navit',
			params: {}
		});
	delete this.request;
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();
},

navitResponseFailure:	function(err) {
	delete this.request;
	enyo.log('Set destination failed');
	this.$.markerNavit.setContent($L('Navit failed...'));
},

cacheOSM: function(inSender, inEvent) {
	
	switch (inEvent.property) {
      case "OSMMapCache":
        Prefs.OSMMapCache = inEvent.value;
        break;
      case "MapCacheExternal":
        Prefs.MapCacheExternal = inEvent.value;
        break;
	};
	
	this.savePrefs();
	
	/* Update the mapType instead of relaunching app */
	this.mapTypeSelect(null,{mapType: "OSM"});
	
},

handleBackGesture: function(inSender, inEvent) {
	enyo.log("**** BACK ****");
},

blurSearch: function(inSender, inEvent) {
},

bindAutocompleter: function(inSender, inEvent) {

	// setup google SearchBox for directions	
	this.DirectAutocomplete = new google.maps.places.SearchBox(inSender.node);
	this.DirectAutocomplete.bindTo('bounds', map);
	new google.maps.event.addListener(this.DirectAutocomplete, 'places_changed', this.SelectedDirectAutocomplete.bind(this, inSender));
},

SelectedDirectAutocomplete: function(inSender, inEvent) {

		var places = this.DirectAutocomplete.getPlaces();
		inSender.place = places[0];
		inSender.setValue(places[0].name);
		
		this.directRequest[inSender.what] = inSender.place.geometry.location;
		this.$.getDirectButton.setDisabled(false);
},

directOptions: function(inSender, inEvent) {

	this.directRequest = enyo.mixin(this.directRequest, inEvent.params);
	
	if (inEvent.route.length == 0) return;
			
	this.$.getDirectButton.setDisabled(false);

	this.calcRoute();
},

info: function(content) {

	this.$.infoDialogContent.setContent(content);  
	this.$.infoDialog.show();

},

closeInfoDialog: function() {

	this.$.infoDialog.hide();

},

setupDirectionService: function () {
	
	//setup direction service
	var rendererOptions = {
		map: map,
		suppressMarkers: true,
		polylineOptions: {
			//geodesic: true,
			clickable: false,
			//editable: true,
			strokeColor: '#4941e3',
			strokeOpacity: 0.7,
			strokeWeight: 8
			},
		markerOptions: {
			optimized: true
			},
		suppressInfoWindows: true,
		draggable: false,
		};
		
	this.directRequest = {
          origin: null,
          destination: null,
          //unitSystem: this.getGoogleUnitSystem(this.Preferences.LengthUnits),
          travelMode: google.maps.DirectionsTravelMode.DRIVING,
        };
        
    this.directionsService = new google.maps.DirectionsService();
	this.directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	
},

calcRoute: function() {
	
	if (!(this.directRequest.origin == undefined || this.directRequest.destination == undefined)) {
		
		//reset the route index to the first route
		this.routeIndex = 0;

		/** Set the transit options **/

		var request = this.directRequest;
		request.travelMode = google.maps.TravelMode[this.directRequest.travelMode];

		this.directionsService.route(request, function(response, status) {

			if (status == google.maps.DirectionsStatus.OK) {
				this.directionsDisplay.setDirections(response);
				this.directionsDisplay.setMap(map);
				//this.routeIndex = this.directionsDisplay.getRouteIndex();
				if (window.innerWidth > 480) { this.$.pullout.openPullout("directpanel"); this.$.directRadio.setActive(true); map.panBy(-320,0);};
				this.lastPanel = "directpanel";
				this.$.getDirectButton.setDisabled(true);
				this.$.pullout.setDirectData(response);
				this.routeIndex = 0;
				var description = response.routes[this.routeIndex].legs[0].distance.text + "; " + response.routes[this.routeIndex].legs[0].duration.text;
				this.toggleTopBar("directBoxResult", "<span style='color: gray'>From: </span>" + this.$.directionStart.getValue() + "<br><span style='color: gray'>To: </span>" + this.$.directionEnd.getValue() + "<br>" + description);
			} else { 
				this.info($L("No route"));
				}
		}.bind(this));
	} else {
		this.info($L("Request is not complete, be sure that the Origin and Destination is set properly and try it again."));
	};
},

bookmarkSelect: function (inSender, inEvent) {

	selectMode = inSender.getValue();
	
	if (inSender.getValue()) {
		this.$.pullout.openPullout("bookmarkpanel");
		this.statusPanel("Choose the place and set it as " + inSender.description, 5);
	} else {
		this.$.pullout.closePullout();
	};
	
	if (this.$.bookmarkA.getValue() && this.$.bookmarkB.getValue()) {
		this.$.bookmarkB.setValue(false);
		this.$.bookmarkA.setValue(false);
		inSender.setValue(true);
	};	
},

fillDirectField: function (inSender, place) {
	
	this.$.pullout.closePullout();
	if (this.$.bookmarkB.getValue()) {
		this.$.bookmarkB.setValue(false);
		this.$.directionEnd.setValue(place.name);
		this.$.directionEnd.place = place;
		this.directRequest.destination = place.geometry.location;
	 };
	if (this.$.bookmarkA.getValue()) { 
		this.$.bookmarkA.setValue(false);
		this.$.directionStart.setValue(place.name);
		this.$.directionStart.place = place;
		this.directRequest.origin = place.geometry.location;
	}; 
	
	this.$.getDirectButton.setDisabled(false);
	
	selectMode = false;
},

setDirectStep: function (inSender, item) {
	
if (!this.directStepMarker) {
	
		var size = 28*window.devicePixelRatio;

		var image = {
			url: "assets/poi_direction_step.png",
			size: new google.maps.Size(size, size),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(size/2, size/2),
			scaledSize: new google.maps.Size(size, size)
		  };
		
		this.directStepMarker = new google.maps.Marker({
			position: item.start_point,
			map: map,
			optimized: this.optimizedMarkers,
			icon: image
		});
		
		this.directStepMarker.step = item.step;
		
		google.maps.event.addListener(this.directStepMarker,"click",this.directMarkerClick.bind(this, this.directStepMarker, item));

		
		map.panTo(item.start_point);
		map.setZoom(16);
		

	} else {
		this.directStepMarker.setPosition(item.start_point);
		this.directStepMarker.step = item.step;
		google.maps.event.addListener(this.directStepMarker,"click",this.directMarkerClick.bind(this, this.directStepMarker, item));

		};
},

directStepGo: function (inSender, inEvent) {

	var item = this.$.pullout.goToStep(this.directStepMarker.step + inSender.step);
	this.setDirectStep(null, item);
	map.panTo(item.start_location);
	this.directMarkerClick(this.directStepMarker, item);
},

toggleTopBar: function (name, content) {
	
	this.$.directBoxResult.hide();
	this.$.searchBox.hide();
	this.$.directBox.hide();
	this.$.buttonsBox.show();
	this.$.clearButton.show();

	this.$.directResultsBar.setContent(content);
	this.$[name].show();
	
	this.$.layout.rendered();
},

updateDirections: function (inSender, inEvent) {
	
	inEvent.preventDefault();
	
	this.$.getDirectButton.setDisabled(false);	
	this.$.searchBox.setShowing(true);
	this.toggleSearchDirections();

},

mapTapHold: function (inSender, inEvent) {
	
	this.statusPanel("Dropping a pin ...", 10);

	var point = new google.maps.Point(inEvent.srcEvent.offsetX, inEvent.srcEvent.offsetY);
	this.GeocodeFromLatLng(this.fromPixelToLatLng(point));

},

routeFromTo: function (inSender, inEvent) {
	
	var what;
	var whatbox;
	
	switch (inSender.name) {
      case "markerStart":
        what = "origin";
        whatbox = "directionStart";
        break;
      case "markerEnd":this.trackPosition
        what = "destination";
        whatbox = "directionEnd";
        break;
	};

	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();
	this.$.directPopup.hide();
	
	this.directRequest[what] = this.lastClickedMarker.place.geometry.location;
	this.$[whatbox].setValue(this.lastClickedMarker.place.name);

	this.toggleSearchDirections("routeFromTo");
},

statusPanel: function (text, time) {
	
	/* first of all clear previous timeout */
	clearTimeout(this.panelTimer);

	if (!time) time = 1;
	this.$.statuspanel.addClass("active");
	this.$.statuspanel.setContent(text);
	this.panelTimer = setTimeout((function(){
		this.$.statuspanel.removeClass("active");
	}).bind(this), time*1000);
},

pulloutToggled: function () {
	//enyo.log("toggled");
},

accelHandler: function (inSender, inEvent) {	

	if (!this.haveCompass) return;
	
	this.compassOpacity = (1-2*Math.max(Math.abs(inEvent.accelX), Math.abs(inEvent.accelY)));	
	this.compassOpacity = (this.compassOpacity < 0.5) ? 0 : this.compassOpacity;
	this.compassContainer.style["opacity"] = this.compassOpacity;
	
},

compassHandler: function (inSender, inEvent) {	
	
	//this.statusPanel(inEvent.heading, 0.5);
	
	if (this.compassOpacity = 0) return;
	
	if (!document.getElementById("compass")) {		
		this.haveCompass = true;		
			try {
			map.getDiv().firstChild.firstChild.appendChild(this.compassContainer);
			document.getElementById("compass").appendChild(this.needleContainer);
		} catch (e) {
			enyo.log("Map not loaded yet...");
			};
		
	} else {
			this.needleContainer.style[this.transform + "transform"] = "rotate3d(0,0,1," + inEvent.heading + "deg)";		
	};
},

updateCompassPosition: function (latlng) {
	
	if (!this.haveCompass) return;
	
	var coord = this.fromLatLngToPixel(latlng);
	
		coord.x = Math.round(coord.x-this.compassContainer.offsetWidth/2);
		coord.y = Math.round(coord.y-this.compassContainer.offsetHeight);
		this.compassContainer.style.top = coord.y + "px";
		this.compassContainer.style.left = coord.x + "px";
},

blockScreenTimeout: function (block) {
	
	window.PalmSystem.setWindowProperties({
		blockScreenTimeout: block
    });
},

mapIdle: function (block) {
	
	//this.updateCompassPosition(currentPos);
},

mapTap: function (inSender, inEvent) {
	
	this.trackPosition = false;
	this.$.myLocation.setValue(false);
},


mapBoundsChanged: function (block) {
	
	this.updateCompassPosition(currentPos);
}

});

