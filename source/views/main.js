enyo.kind({
	name: "Maps.MainView",
	published: {	
	},
	components: [
		{kind: "Signals", onload: "load", onunload: "cleanup"},
		{kind: "Signals", name: "keyDownSignal", onkeydown: "handleKeyDown"},
		{kind: "enyo.Signals", onbackbutton: "handleBackGesture", onrelaunch: "handleRelaunch"},
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
						{kind: "onyx.IconButton", name: "swapDirections", src: "assets/menu-icon-swap.png", ontap: "swapDirections"},
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
			{name: "markerStreetDivider", classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/star-favorite.png"},
			{name: "markerSave", classes: "marker-popup-menu-item", content: $L('Save place'), ontap: "toggleSavePlace"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/menu-icon-forward.png"},
			{name: "markerShare", classes: "marker-popup-menu-item", content: $L('Share'), ontap: "shareOpen"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/flagA.png"},
			{name: "markerStart", classes: "marker-popup-menu-item", content: $L('Route from here'), ontap: "routeFromTo"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/flagB.png"},
			{name: "markerEnd", classes: "marker-popup-menu-item", content: $L('Route to here'), ontap: "routeFromTo"},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/icon-directions.png"},
			{name: "markerStop", classes: "marker-popup-menu-item", content: $L('Add as stop'), ontap: "routeAddStop"},
			{name: "markerNavitDivider", classes: "onyx-menu-divider", showing: false},
			{name: "markerNavitIcon", kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/navit_icon.png", showing: false},
			{name: "markerNavit", classes: "marker-popup-menu-item", content: $L('Route with Navit'), ontap: "routeWithNavit", showing: false},
			{classes: "onyx-menu-divider"},
			{kind: "onyx.Icon", classes: "marker-popup-menu-icon", src: "assets/delete.png"},
			{name: "markerRemove", classes: "marker-popup-menu-item", content: $L('Remove'), ontap: "removeMarker"}
		]},
		{name: "sharePopup", kind: "onyx.Popup", classes: "share-popup zoom-pre3-text", scrim: true, centered: true, modal: true, floating: true, components: [
			{name: "shareTitle", classes: "share-title"},
			{kind: "onyx.Button", name: "shareEmail", classes: "share-button", content: $L("Email"), ontap: "shareEmail"},
			{kind: "onyx.Button", name: "shareMessage", classes: "share-button", content: $L("Message"), ontap: "shareMessage"},
			{kind: "onyx.Button", name: "shareCopy", classes: "share-button", content: $L("Copy"), ontap: "shareCopy"},
			{kind: "onyx.Button", classes: "share-button onyx-dark", content: $L("Cancel"), ontap: "shareClose"}
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
		{name: "mapZoomButtons", classes: "map-zoom-buttons onyx-toolbar zoom-pre3", components: [
			{kind: "onyx.IconButton", name: "mapZoomIn", value: 1, src: "assets/zoomin.png", ontap: "setZoom"},
			{kind: "onyx.IconButton", name: "mapZoomOut", value: -1, src: "assets/zoomout.png", ontap: "setZoom"}
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
			onEngineChange: "engineChange",
			onSavedSelect: "showSavedPlace",
			onUnitsChange: "unitsChange",
			onRouteSelect: "routeSelect",
			onRemoveStop: "routeRemoveStop",
			onGuidanceToggle: "guidanceToggle",
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
	this.transform = (enyo.platform.firefoxOS || enyo.platform.platformName === "firefox") ? "" : "-webkit-";
	//this.transform = "-webkit-";
	this.trackPosition = false;
	
	/* for webOS/luneOS devices use the legacy geolocation API, for the others the W3C Geolocation API */
	this.locationMethod = enyo.platform.webos ? "webOSGeolocation" : "W3CGeolocation";

	this.$.pullout.pulloutInit();

	/* Assign on-screen keyboard to main input */
	//this.$.keyboard.write = this.$.searchLocation;
	
	this.$.initText.setContent("Loading " + mapEngine.label + "...");

	/* Hide what the engine does not support */
	this.$.streetMenuIcon.setShowing(mapEngine.streetView);
	this.$.markerStreet.setShowing(mapEngine.streetView);
	this.$.markerStreetDivider.setShowing(mapEngine.streetView);
	this.$.initPopUp.show();

},
load: function() {

	if (API) {
			this.init();
			console.log("*** API LOADED **** ", mapEngine.versionText());
		} else {
			var errorLoadTimer = setTimeout((function(){
				this.load();
		}).bind(this), 1000);
	};

},
cleanup: function () {
	
	Prefs.lastPosLat = mapEngine.getCenter().lat();
	Prefs.lastPosLng = mapEngine.getCenter().lng();
	Prefs.lastZoom = mapEngine.getZoom();
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

	this.$.pullout.$.APIver.setContent("<span style='color: gray; font-size: 12px'>" + mapEngine.versionText() + "</span>");
	this.$.initText.setContent("Initializing map...");
	
	mapEngine.createMap(this.$.mapdiv.hasNode(), {
		zoom: Prefs.lastZoom,
		center: mapEngine.latLng(Prefs.lastPosLat, Prefs.lastPosLng),
		mapType: Prefs.mapType
	}, this.initAfterIdle.bind(this));
	
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
	mapEngine.getOverlayContainer().appendChild(this.compassContainer);
	document.getElementById("compass").appendChild(this.needleContainer);
	*/

	this.initMainSearch();

	/* Show the layers enabled in preferences */
	if (Prefs.layers.traffic && mapEngine.layers.traffic) this.showTraffic(null, {value: true});
	if (Prefs.layers.transit && mapEngine.layers.transit) this.showTransit(null, {value: true});
	if (Prefs.layers.bike && mapEngine.layers.bike) this.showBicycling(null, {value: true});

	/* init others */
	this.setupDirectionService();
	
	enyo.log("************ INIT DONE ************ ");
	
	this.$.initPopUp.hide();
	this.findCurrentLocation();

	/* address or route handed over by another app (maploc:, mapto:, geo:) */
	this.handleLaunchParams(this.getLaunchParams());
	
	
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
	
	
	
	
	mapEngine.on('idle', this.mapIdle.bind(this));
	mapEngine.on('bounds_changed', this.mapBoundsChanged.bind(this));
},
initMainSearch: function(inSender, inEvent) {
	/* run the engine's place search from the main search box */
	mapEngine.attachSearch(this.$.searchLocation.hasNode(), this.SelectedAutocomplete.bind(this), this.searchFailed.bind(this));
},
searchFailed: function(inMessage) {
	this.statusPanel($L("Search failed: ") + inMessage, 5);
},
savePrefs: function (inSender, inEvent) {

	try {
		Prefs = enyo.mixin(Prefs, inEvent.prefs);
	} catch (e) {};

	PrefsStore.save(Prefs);
},
SelectedAutocomplete: function(places) {

	this.$.layout.rendered();
	this.$.keyDownSignal.onkeydown = "handleKeyDown";
	this.$.searchLocation.place = places[0];
	this.PlaceMarker(places);
	
},
setZoom: function (inSender, inEvent) {
	mapEngine.setZoom(mapEngine.getZoom() + inSender.value);
},
setZoomS: function (inSender, inEvent) {
	this.panorama.setPov({ heading: this.panorama.getPov().heading, pitch: this.panorama.getPov().pitch, zoom: this.panorama.getPov().zoom + inSender.value });	
},
PlaceMarker: function (places) {

	var locations = [];
	var marker;
	var imageUrl = "assets/lune-marker-red-64-64.png";
	var size = 64*window.devicePixelRatio;
	
	for (var i = 0, place; place = places[i]; i++) {

		imageUrl = "assets/lune-marker-red-64-64.png";
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
		// Create a marker for each place.
		marker = mapEngine.addMarker({
			iconUrl: imageUrl,
			size: size,
			anchor: "bottom",
			title: place.name,
			optimized: this.optimizedMarkers,
			position: place.geometry.location
		});
		
		place.distance = mapEngine.distance(mapEngine.getCenter(), place.geometry.location);

		marker.place = place;
		markers.push(marker);
		marker.onClick(this.MarkerClick.bind(this, marker));

		locations.push(place.geometry.location);
	};

	this.$.pullout.setSearchData(markers);
	mapEngine.updateMarkers(markers);

	/* Open pullout with results for more than one place result for wide screens */
	if ((places.length > 1)) {
		if (window.innerWidth > 480) { 
			this.$.pullout.openPullout("bookmarkpanel");
			this.$.pullout.togglePlaces({panel: "currentlist"},{name: "current"});
			this.$.bookmarkRadio.setActive(true);
		};
		mapEngine.fitLatLngs(locations);
	} else if (places.length == 1) {
		this.MarkerClick(marker);
		if (places[0].lunetype != "dropped") {
			if (places[0].geometry.viewport) {
				mapEngine.fitViewport(places[0].geometry.viewport);
			} else {
				
				mapEngine.panTo(places[0].geometry.location);
				mapEngine.setZoom(14);
			
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
				this.$.popIcon.setSrc(marker.iconUrl);
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

	Prefs.mapType = inEvent.mapType;
	this.savePrefs();

	mapEngine.setMapType(inEvent.mapType);
},
resizeHandler: function() {
	enyo.log("window size changed");
	//mapEngine.resize();
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

	mapEngine.resize();

},

showTraffic: function(inSender, inEvent) {
	mapEngine.setLayer("traffic", inEvent.value);
	Prefs.layers.traffic = inEvent.value;
	this.savePrefs();
},
showTransit: function(inSender, inEvent) {
	mapEngine.setLayer("transit", inEvent.value);
	Prefs.layers.transit = inEvent.value;
	this.savePrefs();
},
showBicycling: function (inSender, inEvent){
	mapEngine.setLayer("bike", inEvent.value);
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
	mapEngine.fitCircle(this.circle);
	if (mapEngine.getZoom() > 14 ) mapEngine.setZoom(14);
},

firstLocationSuccess: function(inSender, inData) {
	
	currentPos = mapEngine.latLng(inData.coords.latitude, inData.coords.longitude);
	
		var size = 42*window.devicePixelRatio;
		
		this.statusPanel("Current location found...", 3);
		
		if (enyo.platform.webos) mapEngine.getOverlayContainer().appendChild(this.compassContainer);
		
		this.myLocationMarker = mapEngine.addMarker({
			position: currentPos,
			iconUrl: "assets/enyo-map-marker_blue_dot.png",
			size: size,
			anchor: "center",
			optimized: this.optimizedMarkers
		});

		this.myLocationMarker.place = [];
		this.myLocationMarker.place.geometry = [];
		this.myLocationMarker.place.name = $L("My Location");
		this.myLocationMarker.place.icon = this.myLocationMarker.iconUrl;
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

			this.circle = mapEngine.addCircle({
				center: currentPos,
				radius: this.accuracy //radius in meters
			});

		mapEngine.fitCircle(this.circle);
		if (mapEngine.getZoom() > 14 ) mapEngine.setZoom(14);
		
		/* Start tracking after first (not so precise as tracking) location succes */
		this.startTracking();
		
	this.updateCompassPosition(currentPos);
	
	this.$[this.locationMethod].onSuccess = "trackingLocationSuccess";
	
	if (this.pendingRouteTo) {
		var destination = this.pendingRouteTo;
		this.pendingRouteTo = null;
		this.routeToPlace(destination);
	};
	
	this.myLocationMarker.onClick(this.MarkerClick.bind(this, this.myLocationMarker));

},

trackingLocationSuccess: function(inSender, inData) {
	currentPos = mapEngine.latLng(inData.coords.latitude, inData.coords.longitude);
	if (this.trackPosition) mapEngine.setCenter(currentPos);
	this.myLocationMarker.place.geometry.location = currentPos;
	this.myLocationMarker.place.lastfix = new ilib.Date();	
	this.myLocationMarker.place.formatted_address = currentPos;
	this.myLocationMarker.setPosition(currentPos);
	this.circle.setCenter(currentPos);
	this.circle.setRadius(inData.coords.accuracy); // update accuracy circle
	this.updateCompassPosition(currentPos);
	if (Guidance.active) this.guidanceUpdate();
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
			mapEngine.getOverlayContainer().appendChild(this.pulseContainer);
		} catch (e) {
			enyo.log("Map not loaded yet...");
			};
		
	} else {
	
		var coord = mapEngine.latLngToContainerPoint(latlng);
		
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

/*
 * The gesture handlers below pan and zoom engines that do not handle touch
 * themselves (Google, created with draggable: false). Engines with
 * nativeGestures, like Leaflet, get the events untouched.
 */
gestureStart: function(inSender, e){
	
	if (mapEngine.nativeGestures) return;
	
	mapEngine.once('bounds_changed', this.MapCenterChanged.bind(this));
	
	this.gestureinprogress = true;
	this.GestureCenter = mapEngine.getCenter();	
	this.Zooming = true;
	this.previouszoom = mapEngine.getZoom();
	this.z = this.previouszoom;
	this.previousScale = e.scale;
	this.previousS = 0;

	if(typeof e.centerX == "undefined" || typeof e.centerY == "undefined") {
		e.centerX = 0;
		e.centerY = 0;
		for(var t = 0; t < e.touches.length; ++t) {
			e.centerX += e.touches[t].clientX / e.touches.length;
			e.centerY += e.touches[t].clientY / e.touches.length;
		}
	}
	this.oldeventg = e;
	
	this.TilesContainer = mapEngine.getPanContainer();
	this.TilesContainer.style.overflow = "visible !important;";

	this.addpaneventg = [];
	this.addpaneventg.cx = 0;
	this.addpaneventg.cy = 0;
	this.addpaneventg.oldcenter = mapEngine.latLngToContainerPoint(mapEngine.getCenter());

},

gestureChange: function(inSender, e){
	
		if (mapEngine.nativeGestures) return;
		
		/* ToDo: map rotate upon gesture works... needs to be more tested */
		//var rotation = 0;
		
		var rotation = e.rotation;

		//var rotate = "rotate3d(0,0,1," + rotation + "deg) ";
		var rotate = "";

		if(typeof e.centerX == "undefined" || typeof e.centerY == "undefined") {
			e.centerX = 0;
			e.centerY = 0;
			for(var t = 0; t < e.touches.length; ++t) {
				e.centerX += e.touches[t].clientX / e.touches.length;
				e.centerY += e.touches[t].clientY / e.touches.length;
			}
		}
		var transform = rotate + "scale3d(" + e.scale + "," + e.scale + ",1)" + " translate3d(" + (-this.oldeventg.centerX + e.centerX)/e.scale + "px," + (-this.oldeventg.centerY + e.centerY)/e.scale + "px, 0px)";
		this.TilesContainer.style[this.transform + "transform"] = transform;

		// New center position in pixels = starting pixel center of map (with the assumption it hasn't been resized) + (original touch center - current touch center)
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
	if (mapEngine.nativeGestures) return;
	this.gestureinprogress = false;
	
	mapEngine.setZoom(this.z);
	
	var latlng = mapEngine.containerPointToLatLng({x: this.addpaneventg.cx, y: this.addpaneventg.cy});
	mapEngine.setCenter(latlng);
	
},

dragStart: function(inSender, inEvent) {
	
	if (mapEngine.nativeGestures) {
		this.$.markerPopup.hide();
		return;
	}

	if(!this.gestureinprogress) {
		this.$.markerPopup.hide();
	
		mapEngine.once('bounds_changed', this.MapCenterChanged.bind(this));
	
		inEvent.preventDefault();
	
		this.TilesContainer = mapEngine.getPanContainer();
		this.TilesContainer.style.overflow = "visible";
	
		this.oldcenter = mapEngine.latLngToContainerPoint(mapEngine.getCenter());
		this.wasflicked = false;	
	}
	
},

dragging: function(inSender, inEvent) {

	if(!mapEngine.nativeGestures && !this.gestureinprogress) {
		this.moveMapBy(inEvent.dx, inEvent.dy);
		this.draggingEvent = inEvent;
	}
},

moveMapBy: function(x,y,deg) {

	this.TilesContainer.style[this.transform + "transform"] = "translate3d(" + x + "px," + y + "px, 0px)";

},

dragEnd: function(inSender, inEvent){
	
	if (!mapEngine.nativeGestures && !this.wasflicked && !this.gestureinprogress) {
		this.mapEndMove(inEvent);
	};

},

flick: function(inSender, inEvent) {

	if(!mapEngine.nativeGestures && !this.gestureinprogress) {
		this.wasflicked = true;
		
		var transTime = Math.sqrt(inEvent.xVelocity*inEvent.xVelocity + inEvent.yVelocity*inEvent.yVelocity)*400;
	
		inEvent.dx = this.draggingEvent.dx + Math.abs(this.draggingEvent.dx)*inEvent.xVelocity;
		inEvent.dy = this.draggingEvent.dy + Math.abs(this.draggingEvent.dy)*inEvent.yVelocity;
		
		this.TilesContainer.style[this.transform + "transition"] = this.transform + "transform " + transTime/1000 + "s ease-out";
	
		this.moveMapBy(inEvent.dx, inEvent.dy);
		
		var timer = setTimeout(function(){
	
				this.mapEndMove(inEvent);
	
		}.bind(this), transTime);
	}


},

mapEndMove: function(inEvent) {
	
	var point = {x: this.oldcenter.x-inEvent.dx, y: this.oldcenter.y-inEvent.dy};
	this.residuePos = inEvent;

	mapEngine.setCenter( mapEngine.containerPointToLatLng(point) );

},

MapCenterChanged: function () {

	this.TilesContainer.style[this.transform + "transition"] = "";
	this.TilesContainer.style[this.transform + "transform"] = "";
	
	//this.updateCompassPosition(currentPos);

	this.wasflicked = false;

},

clearMap: function (inSender, inEvent) {
	
	this.clearMarkers();
	this.$.clearButton.hide();
	this.$.searchLocation.setValue("");
	this.$.searchLocation.place = null;
	
	/* Clear directions */
	this.guidanceStop();
	mapEngine.clearRoute();
	this.directResponse = null;
	this.directRequest.waypoints = [];
	this.$.pullout.setStops([]);
	this.$.getDirectButton.setDisabled(false);	
	this.$.searchBox.setShowing(false);
	if (this.directStepMarker) this.directStepMarker.remove();
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
	
	for (var e=0; e<markers.length; e++){
		markers[e].remove();
	}
	
	markers = [];
	
	if (this.myLocationMarker) { 
		markers.push(this.myLocationMarker);
		this.myLocationMarker.restore();
	};
	
	// Re-cluster what is left
	mapEngine.updateMarkers(markers);
	
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
engineChange: function (inSender, inEvent) {
	/* each engine loads its own API, so restart with the new one */
	Prefs.engine = inEvent.value;
	this.cleanup();
	window.location.reload();
},
handleKeyDown: function(inSender, inEvent) {
	
		this.$.markerPopup.hide();
		this.$.markerPopupMenu.hide();
		if (inEvent.keyIdentifier == "Back") return;
		/* already typing into a field, don't steal the key */
		var active = document.activeElement;
		if (active && (active.tagName == "INPUT" || active.tagName == "TEXTAREA")) return;
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
	
	mapEngine.reverseGeocode(latlng, function(status, result) {
		if (!status) {
		  var place = result;
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
	
	this.panorama = mapEngine.createPanorama(document.getElementById("street_canvas"), place.geometry.location);
	
	this.panorama.setVisible(true);
	
	this.$.bottomRightButtons.show();
	
	this.$.bottomLeftButtons.hide();
	
	this.$.mapZoomButtons.hide();
	
	this.$.mainPane.hide();
	
},

exitStreetView: function() {
	
	this.$.streetdiv.hide();
	
	this.panorama.setVisible(false);
	
	this.$.bottomRightButtons.hide();
	
	this.$.bottomLeftButtons.show();
	
	this.$.mapZoomButtons.show();
	
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
markerPopupTap: function(inSender, inEvent) {
		this.$.markerSave.setContent(SavedPlaces.contains(this.lastClickedMarker.place) ? $L('Remove from saved') : $L('Save place'));
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
	for (var e=0; e<markers.length; e++){
		if (this.lastClickedMarker.place.id == markers[e].place.id) {
					enyo.log("Removing marker from array: ", e);
					markers[e].remove();
					markers.remove(e);
					this.$.pullout.setSearchData(markers);
					mapEngine.updateMarkers(markers);
					break;
				};
	};
	
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();					
},

isStreet: function (location) {
	
	// Check for a street view at the position
	mapEngine.hasStreetView(location, function(inAvailable) {
		if (inAvailable) {
			
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

getLaunchParams: function() {
	var params = {};
	if (enyo.platform.webos) {
		try {
			params = webos.launchParams();
		} catch (e) {
			enyo.log("No launch params: ", e);
		}
	} else {
		/* in a browser: index.html?target=maploc:... */
		var match = /[?&]target=([^&]*)/.exec(window.location.search);
		if (match) params.target = decodeURIComponent(match[1].replace(/\+/g, " "));
	}
	return params || {};
},

handleRelaunch: function(inSender, inEvent) {
	this.handleLaunchParams(inEvent);
	return true;
},

/*
 * LuneOS hands maploc: and mapto: URIs to the app (command-resource-handlers.json):
 *   {"target": "maploc:<address or lat,lng>"}  show the place
 *   {"target": "mapto:<address or lat,lng>"}   route from the current position
 * geo: URIs (RFC 5870, geo:lat,lng or geo:0,0?q=address) are understood as well.
 */
handleLaunchParams: function(inParams) {
	if (!inParams || !inParams.target || !API) return;
	var target = String(inParams.target);
	var route = /^mapto:/i.test(target);
	var query = target.replace(/^(maploc|mapto):(\/\/)?/i, "");
	var geo = /^geo:([-+]?[\d.]+),([-+]?[\d.]+)[^?]*(\?q=(.*))?$/i.exec(target);
	if (geo) {
		query = geo[4] ? geo[4] : geo[1] + "," + geo[2];
	}
	try {
		query = decodeURIComponent(query.replace(/\+/g, " "));
	} catch (e) {}
	query = query.replace(/^\s+|\s+$/g, "");
	if (!query) return;

	enyo.log("Launch target: ", target);
	this.$.searchLocation.setValue(query);

	var coordinates = /^([-+]?\d{1,2}(\.\d+)?)\s*,\s*([-+]?\d{1,3}(\.\d+)?)$/.exec(query);
	if (coordinates && !(geo && geo[4])) {
		var place = {
			id: Date.now(),
			name: query,
			formatted_address: query,
			icon: "assets/lune-marker-red-64-64.png",
			geometry: {location: mapEngine.latLng(coordinates[1], coordinates[3])}
		};
		this.launchPlace(place, route);
		return;
	}

	this.statusPanel($L("Searching") + " " + query + " ...", 5);
	mapEngine.geocode(query, function(inError, inPlaces) {
		if (inError || !inPlaces || !inPlaces.length) {
			this.statusPanel($L("Not found: ") + query, 5);
			return;
		}
		this.launchPlace(inPlaces[0], route);
	}.bind(this));
},

launchPlace: function(inPlace, inRoute) {
	this.$.searchLocation.place = inPlace;
	this.PlaceMarker([inPlace]);
	if (inRoute) this.routeToPlace(inPlace);
},

/* directions from the current position, waits for the first fix if needed */
routeToPlace: function(inPlace) {
	if (!this.myLocationMarker) {
		this.pendingRouteTo = inPlace;
		this.statusPanel($L("Waiting for your position to plan the route ..."), 10);
		return;
	}
	this.$.markerPopup.hide();
	this.directRequest.origin = currentPos;
	this.$.directionStart.setValue($L("My Location"));
	this.directRequest.destination = inPlace.geometry.location;
	this.$.directionEnd.setValue(inPlace.name);
	this.$.directionEnd.place = inPlace;
	this.$.getDirectButton.setDisabled(false);
	this.calcRoute();
},

swapDirections: function(inSender, inEvent) {
	var request = this.directRequest;
	var origin = request.origin;
	request.origin = request.destination;
	request.destination = origin;
	request.waypoints.reverse();
	this.$.pullout.setStops(request.waypoints);

	var startValue = this.$.directionStart.getValue();
	var startPlace = this.$.directionStart.place;
	this.$.directionStart.setValue(this.$.directionEnd.getValue());
	this.$.directionStart.place = this.$.directionEnd.place;
	this.$.directionEnd.setValue(startValue);
	this.$.directionEnd.place = startPlace;

	this.$.getDirectButton.setDisabled(false);
	return true;
},

toggleSavePlace: function(inSender, inEvent) {
	var place = this.lastClickedMarker.place;
	if (SavedPlaces.contains(place)) {
		SavedPlaces.remove(place);
		this.statusPanel($L("Removed from saved places"), 2);
	} else {
		SavedPlaces.add(place);
		this.statusPanel($L("Saved") + ": " + place.name, 2);
	}
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();
},

showSavedPlace: function(inSender, inEvent) {
	/* reuse the marker when the place is already on the map */
	for (var i = 0; i < markers.length; i++) {
		if (markers[i].place.id == inEvent.place.id) {
			mapEngine.panTo(inEvent.place.geometry.location);
			this.MarkerClick(markers[i]);
			return;
		}
	}
	this.PlaceMarker([inEvent.place]);
	mapEngine.panTo(inEvent.place.geometry.location);
	mapEngine.setZoom(16);
},

unitsChange: function(inSender, inEvent) {
	Prefs.lengthUnits = inEvent.value;
	this.savePrefs();
	mapEngine.updateScale();
},

handleBackGesture: function(inSender, inEvent) {
	enyo.log("**** BACK ****");
},

blurSearch: function(inSender, inEvent) {
},

bindAutocompleter: function(inSender, inEvent) {

	// setup the engine's place search for a directions field, once per field
	if (inSender.searchAttached) return;
	inSender.searchAttached = true;
	mapEngine.attachSearch(inSender.hasNode(), this.SelectedDirectAutocomplete.bind(this, inSender), this.searchFailed.bind(this));
},

SelectedDirectAutocomplete: function(inSender, places) {

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
	
	//setup direction request, the engine keeps its own direction service
	this.directRequest = {
          origin: null,
          destination: null,
          travelMode: "DRIVING",
          /* stops between origin and destination, in order: [{location, name}] */
          waypoints: [],
          /* offer the alternatives the router has, the user picks one in the directions panel */
          provideRouteAlternatives: !!mapEngine.routeOptions.provideRouteAlternatives
        };
	
},

calcRoute: function() {
	
	if (!(this.directRequest.origin == undefined || this.directRequest.destination == undefined)) {
		
		//reset the route index to the first route
		this.routeIndex = 0;

		/** Set the transit options **/

		mapEngine.route(this.directRequest, function(status, response) {

			if (!status) {
				this.directResponse = response;
				var guiding = Guidance.active;
				/* on wide screens the directions panel opens on the right: fit the route beside it */
				this.routePanelWidth = (window.innerWidth > 480) ? 320 : 0;
				if (this.routePanelWidth) { this.$.pullout.openPullout("directpanel"); this.$.directRadio.setActive(true); };
				this.showRouteChoice(0, true);
				this.lastPanel = "directpanel";
				this.$.getDirectButton.setDisabled(true);
				/* a new route while guiding (rerouting): continue the guidance on it */
				if (guiding) this.guidanceStart();
			} else { 
				enyo.log("Route failed: ", status);
				this.info($L("No route") + ": " + $L(String(status)));
				}
		}.bind(this));
	} else {
		this.info($L("Request is not complete, be sure that the Origin and Destination is set properly and try it again."));
	};
},

/* show one of the routes the router offered: map, steps and summary follow */
showRouteChoice: function(inIndex, inFirst) {
	var response = this.directResponse;
	this.routeIndex = inIndex;
	/* steps first: placing the step marker zooms to the start; drawing the route afterwards fits the
	   view to the whole route, so a new route opens as an overview where the alternatives show */
	this.$.pullout.setDirectData(response, inIndex);
	mapEngine.showRoute(response, inIndex, {fit: inFirst, padRight: this.routePanelWidth || 0, onSelect: this.showRouteChoice.bind(this)});
	var leg = MapEngines.routeSummary(response.routes[inIndex]);
	this.toggleTopBar("directBoxResult", "<span style='color: gray'>From: </span>" + this.$.directionStart.getValue() + "<br><span style='color: gray'>To: </span>" + this.$.directionEnd.getValue() + "<br>" + leg.distance.text + "; " + leg.duration.text);
},

/* "Add as stop" in the marker menu: the place becomes the last stop before the destination */
routeAddStop: function(inSender, inEvent) {
	var place = this.lastClickedMarker.place;
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();
	this.$.directPopup.hide();
	this.directRequest.waypoints.push({location: place.geometry.location, name: String(place.name)});
	this.$.pullout.setStops(this.directRequest.waypoints);
	this.routeStopsChanged();
},

routeRemoveStop: function(inSender, inEvent) {
	this.directRequest.waypoints.splice(inEvent.index, 1);
	this.$.pullout.setStops(this.directRequest.waypoints);
	this.routeStopsChanged();
},

/* a route that is shown follows its stops; otherwise the directions form opens */
routeStopsChanged: function() {
	if (this.directResponse) {
		this.$.getDirectButton.setDisabled(false);
		this.calcRoute();
	} else {
		this.statusPanel($L("Stops") + ": " + this.directRequest.waypoints.length, 2);
		if (!this.$.directBox.showing) this.toggleSearchDirections("routeFromTo");
	}
},

shareOpen: function(inSender, inEvent) {
	this.sharePlace = this.lastClickedMarker.place;
	this.$.markerPopup.hide();
	this.$.markerPopupMenu.hide();
	this.$.shareTitle.setContent($L("Share") + " " + this.sharePlace.name);
	/* Messaging takes the text on webOS; a browser has no such app */
	this.$.shareMessage.setShowing(!!enyo.platform.webos);
	this.$.sharePopup.show();
},

shareClose: function() {
	this.$.sharePopup.hide();
},

shareDone: function(inError) {
	this.$.sharePopup.hide();
	if (inError) {
		this.statusPanel($L("Could not share") + ": " + inError, 5);
	}
},

shareEmail: function() {
	Share.byEmail(this.sharePlace, this.shareDone.bind(this));
},

shareMessage: function() {
	Share.byMessage(this.sharePlace, this.shareDone.bind(this));
},

shareCopy: function() {
	var copied = Share.copy(this.sharePlace);
	this.$.sharePopup.hide();
	this.statusPanel(copied ? $L("Copied to the clipboard") : $L("Could not copy"), 2);
},

routeSelect: function(inSender, inEvent) {
	this.showRouteChoice(inEvent.index, false);
	if (Guidance.active) this.guidanceStart();
},

/* voice guidance along the shown route, see Guidance.js */
guidanceToggle: function() {
	if (Guidance.active) {
		this.guidanceStop();
	} else {
		this.guidanceStart();
	}
},

guidanceStart: function() {
	var route = this.directResponse.routes[this.routeIndex || 0];
	var path = route.path || (route.overview_path || []).map(function (inPoint) {
		return [inPoint.lat(), inPoint.lng()];
	});
	var say = Guidance.start(Guidance.stepsOf(route), path, this.directRequest.travelMode, {onReroute: this.guidanceReroute.bind(this)});
	Guidance.speak(say);
	this.trackPosition = true;
	this.$.myLocation.setValue(true);
	if (window.PalmSystem && window.PalmSystem.setWindowProperties) this.blockScreenTimeout(true);
	this.$.pullout.setGuidanceActive(true);
	if (window.innerWidth <= 480) this.$.pullout.closePullout();
	this.guidanceShow();
},

guidanceStop: function() {
	if (!Guidance.active) return;
	Guidance.stop();
	if (window.PalmSystem && window.PalmSystem.setWindowProperties) this.blockScreenTimeout(false);
	this.$.pullout.setGuidanceActive(false);
},

guidanceUpdate: function() {
	var say = Guidance.update(currentPos);
	Guidance.speak(say);
	if (Guidance.arrived) {
		this.guidanceStop();
		return;
	}
	this.guidanceShow();
},

/* the next maneuver and the distance to it in the step popup */
guidanceShow: function() {
	var step = Guidance.nextStep();
	if (!step) return;
	var distance = Guidance.distanceToNext(currentPos);
	this.directMarkerClick(null, {maneuver: step.maneuver, instructions: step.instructions, distance: {text: MapEngines.formatDistance(distance)}});
},

/* off the route: a new one from here, without the stops already passed */
guidanceReroute: function() {
	this.directRequest.origin = currentPos;
	this.directRequest.waypoints = this.directRequest.waypoints.slice(Guidance.stopsPassed());
	this.$.pullout.setStops(this.directRequest.waypoints);
	this.$.directionStart.setValue($L("My Location"));
	this.$.getDirectButton.setDisabled(false);
	this.calcRoute();
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

		this.directStepMarker = mapEngine.addMarker({
			position: item.start_point,
			iconUrl: "assets/poi_direction_step.png",
			size: size,
			anchor: "center",
			optimized: this.optimizedMarkers
		});
		
		this.directStepMarker.step = item.step;
		
		this.directStepMarker.onClick(this.directMarkerClick.bind(this, this.directStepMarker, item));

		
		mapEngine.panTo(item.start_point);
		mapEngine.setZoom(16);
		

	} else {
		this.directStepMarker.restore();
		this.directStepMarker.setPosition(item.start_point);
		this.directStepMarker.step = item.step;
		this.directStepMarker.onClick(this.directMarkerClick.bind(this, this.directStepMarker, item));

		};
},

directStepGo: function (inSender, inEvent) {

	var item = this.$.pullout.goToStep(this.directStepMarker.step + inSender.step);
	this.setDirectStep(null, item);
	mapEngine.panTo(item.start_location);
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

	/* position of the hold relative to the map container */
	var rect = this.$.mapdiv.hasNode().getBoundingClientRect();
	var point = {x: inEvent.clientX - rect.left, y: inEvent.clientY - rect.top};
	this.GeocodeFromLatLng(mapEngine.containerPointToLatLng(point));

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
			mapEngine.getOverlayContainer().appendChild(this.compassContainer);
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
	
	var coord = mapEngine.latLngToContainerPoint(latlng);
	
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

