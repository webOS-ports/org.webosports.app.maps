enyo.kind({
	name: "Pullout",
	kind: "enyo.Slideable",
	published: {
		lastPanel: null,	
   },
	events: {
		onShowTraffic: "",
		onShowTransit: "",
		onShowBicycling: "",
		onMapTypeSelect: "",
		onCacheOSM: "",
		onBookmarkSelect: "",
		onLanguageChange: "",
		onDirectOptions: "",
		onFillDirectField: "",
		onSetDirectStep: "",
		onSavePrefs: "",
		onEngineChange: "",
		onSavedSelect: "",
		onUnitsChange: "",
		onRouteSelect: "",
		onRemoveStop: "",
		onGuidanceToggle: ""
	},
	components: [
		{name: "shadow", classes: "pullout-shadow"},
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{name: "client", classes: "pullout-toolbar"},
			{fit: true, style: "position: relative;", components: [
				
				{name: "maptypepanel", kind: "Scroller", touch: true, fixedTime: false, showing: true, classes: "enyo-fit", components: [
					
					{name: "mapType", kind: "Group", classes: "onyx-groupbox settings", highlander: true, onchange: "mapTypeChange", components: [
						/* filled from mapEngine.mapTypes() in create */
					]}
					
				]},
				{name: "layerspanel", kind: "Scroller", touch: true, fixedTime: false, showing: false, classes: "enyo-fit", components: [
					
					{kind: "onyx.Groupbox", classes: "settings", components: [
						{kind: "onyx.GroupboxHeader", content: "Layers"},
						{kind: "LabeledItem", label: $L("Traffic"), name: "trafficToggle", icon: "assets/icon-traffic.png", defaultKind: "onyx.ToggleButton", onChange: "showTrafficChange"},
						{kind: "LabeledItem", label: $L("Transit"), name: "transitToggle", icon: "assets/icon-transit.png", defaultKind: "onyx.ToggleButton", onChange: "showTransitChange"},
						{kind: "LabeledItem", label: $L("Bike"), name: "bikeToggle", icon: "assets/icon-bicycle.png", defaultKind: "onyx.ToggleButton", onChange: "showBicyclingChange"}
					]}
				]},
				{name: "bookmarkpanel", showing: false, classes: "bookmark-panel enyo-fit", components: [
					{kind: "onyx.Groupbox", classes: "settings", components: [
						{kind: "onyx.GroupboxHeader", components: [
							{content: $L("Places"), classes: "inheader-left"},
							{name: "markerCount", content: "0", classes: "inheader-right"}
							]}
						]},
					
					{kind: "onyx.RadioGroup", classes: "bookmark-header", components: [
						{content: $L("Current"), name: "current", panel: "currentlist", active: true, ontap: "togglePlaces" },
						//{content: $L("Recent"), name: "recents", disabled: true, panel: "recentslist", ontap: "togglePlaces"},
						{content: $L("Saved"), name: "saved", panel: "savedlist", ontap: "showSaved"}
						//{content: $L("Details"), name: "details", panel: "detailspanel", ontap: "togglePlaces"},
					]},
					
					{kind: "Scroller", touch: true, fixedTime: false, horizontal: "hidden", classes: "enyo-fit", style: "top: 100px", components: [
							{kind: "List", name: "currentlist", onSetupItem: "setupSearchData", showing: false, reorderable: false, enableSwipe: false, components: [
								{kind: "SearchListItem", name:"listItem", ontap: "", content: ""}
							]},
							{kind: "List", name: "recentslist", onSetupItem: "", showing: false, components: [
								//{kind: "SearchListItem", name:"listItem", content: ""}
							]},
							{kind: "List", name: "savedlist", onSetupItem: "setupSavedData", showing: false, reorderable: false, enableSwipe: false, components: [
								{kind: "SearchListItem", name: "savedItem", ontap: "", content: ""}
							]},
							{name: "savedEmpty", showing: false, classes: "item-address", style: "padding: 10px;", content: $L("No saved places yet. Tap a marker, then its popup, and choose Save place.")}
							/*
							{name: "detailspanel", classes: "item", onSetupItem: "", showing: false, components: [
								{components: [
									{classes: "onyx-sample-divider", content: "Summary:"},
									{name: "PlaceDetailsName", allowHtml: true, classes: "item-name", ontap: "test"},
									{name: "PlaceDetailsRating", content: "", classes: "item-rating", showing: false},
									{name: "PlaceDetailsRatingStar", content: "", allowHtml: true, classes: "rating-container", showing: false},
									{tag: "br"},
									{name: "PlaceDetailsAddress", allowHtml: true, classes: "item-address", content: ""},
									{tag: "br"},
									{name: "PlaceDetailsLocation", allowHtml: true, classes: "item-address", content: ""},
									{tag: "br"},
									{name: "PlaceDetailsElevation", allowHtml: true, content: "", classes: "item-address", showing: false},
									{tag: "br"},
								]},
								{showing: false, components: [
									{classes: "onyx-sample-divider", content: "Opening hours:"},
									{name: "PlaceDetailsHours", kind: "enyo.Control", classes: "", content: "", allowHtml: true, ontap: "openingHoursDetails"},
									{name: "openingHoursPopup", classes: "zoom-pre3", kind: "onyx.Popup", allowHtml: true, content: ""}
								]},
							]}
							*/
					]}
					
					
					
				
				]},
				//{name: "directpanel", showing: false, classes: "enyo-fit directions-panel", components: [
				
				{kind: "Scroller", name: "directpanel", showing: false, touch: true, fixedTime: false, classes: "enyo-fit directions-panel", components: [
					
					{kind: "onyx.Groupbox", classes: "settings", components: [
						{kind: "onyx.GroupboxHeader", content: $L("Directions")}
					]},
					{kind: "onyx.RadioGroup", style: "text-align: center", classes: "travel-radio", components: [
							
							{param: "travelMode", name: "travelDRIVING", value: "DRIVING", active: true, ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -40px", active: true}
								]},
							{param: "travelMode", name: "travelWALKING", value: "WALKING", ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -120px"}
								]},
							{param: "travelMode", name: "travelTRANSIT", value: "TRANSIT", ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -80px"}
								]},
							{param: "travelMode", name: "travelBICYCLING", value: "BICYCLING", ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -160px"}
								]}
							/** I hope that one day google introduce the FLY mode in API also **/
							/*
							{param: "travelMode", value: "FLY", ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -200px"}
								]}
							*/
					]},	
					{kind: "gts.DividerDrawer", name: "moreOptionsCollapsible", caption: $L("Options"), open: false, components: [
							{kind: "gts.ToggleBar", label: $L("Route alternatives"), sublabel: "", param: "provideRouteAlternatives", name: "routeAlternativesToggle", onChange: "setDirectOptions"},
							{kind: "gts.ToggleBar", label: $L("Avoid tolls"), sublabel: "", param: "avoidTolls", name: "avoidTollsToggle", onChange: "setDirectOptions"},
							{kind: "gts.ToggleBar", label: $L("Avoid highways"), sublabel: "", param: "avoidHighways", name: "avoidHighwaysToggle", onChange: "setDirectOptions"},
					]},
					{kind: "onyx.Button", name: "guidanceButton", classes: "onyx-affirmative guidance-button", content: $L("Start voice guidance"), showing: false, ontap: "guidanceTap"},
					/* the stops between start and destination, each with a remove button */
					{name: "routeStops", classes: "route-stops", showing: false},
					/* one button per route when the router offers alternatives */
					{name: "routeChoices", classes: "route-choices", showing: false},
					{kind: "onyx.Button", name: "directWarnings", classes: "onyx-negative", style: "width: 320px; height: auto", showing: false, ontap: "activateWarningsDrawer"},
					
					//{kind: "Scroller", name: "directpanelScroller", touch: true, fixedTime: false, classes: "enyo-fit", style: "bottom: 50px; top: 0px; position: relative", components: [
						{kind: "List", name: "directions", onSetupItem: "setupDirectData", showing: true, components: [
								{kind: "DirectListItem", name: "listItemStep", ontap: "", content: ""}
						]},
					//]},
					{kind: "onyx.Button", name: "directCopyrights", classes: "onyx-blue", style: "width: 320px; height: auto", showing: false}
					
				]},
				{name: "settingspanel", kind: "Scroller", touch: true, fixedTime: false, showing: false, classes: "enyo-fit", components: [
					
					{kind: "onyx.Groupbox", classes: "settings", components: [
						{kind: "onyx.GroupboxHeader", content: $L("General settings")},
						{ components: [
							{name: "Engine", classes: "onyx-toolbar-inline", components: [
								{kind: "Image", src: "assets/help.png", classes: "labeled-item-icon", ontap: "settingsHelp", help: $L("Selects the map provider used for maps, search, directions and elevation. The app reloads to apply the change.")},
								{name: "labelEngine", kind: "Control", content: $L("Map engine")},
								{kind: "onyx.PickerDecorator", classes: "lang-picker", components: [
									{name: "enginePickerButton", classes: "lang-picker"},
									{kind: "onyx.Picker", name: "enginePicker", classes: "zoom-pre3 lang-picker", onSelect: "EngineChange"}
								]}
							]}
						]},
						{kind: "SettingsItem", label: $L("Fullscreen"), showing: false, icon: "assets/help.png", help: $L("Switch between fullscreen and normal mode"), name: "FullscreenToggle", defaultKind: "onyx.ToggleButton", onChange: "Fullscreen", onIconTap: "settingsHelp"},
						//{kind: "LabeledItem", label: "Language", icon: "assets/icon-traffic.png", defaultKind: "onyx.ToggleButton", onChange: "LanguageChange"},
						{ components: [
							{name: "Lang", classes: "onyx-toolbar-inline", components: [
								{kind: "Image", src: "assets/help.png", classes: "labeled-item-icon", ontap: "settingsHelp", help: $L("Overrides map API and app language, needs application restart")},
								{name: "labelLang", kind: "Control", content: $L("Language")},
								{kind: "onyx.PickerDecorator", classes: "lang-picker", components: [
									{name:"langPickerButton", classes: "lang-picker"},
									{name: "langPicker", kind: "onyx.FlyweightPicker", classes: "zoom-pre3", count: 55, onSetupItem: "setupLangs", onSelect: "LanguageChange", components: [
										{name: "language"}
									]}
								]},
								{name: "langNotice", showing: false, kind: "Control", classes: "settings-notice", content: $L("Relaunch the app to apply the change!")},
							]}
						]},
						{ showing: false, components: [				
							{name: "GPSupdate", classes: "onyx-toolbar-inline", components: [
								{kind: "Image", src: "assets/help.png", classes: "labeled-item-icon", ontap: "settingsHelp", help: $L("Sets how often will be updated the position")},
								{name: "labelGPS", kind: "Control", content: $L("GPS update interval")},
								{kind: 'onyx.PickerDecorator', classes: "lang-picker", components: [
									{name: "GPSupdatePickerButton", classes: "lang-picker", content: ""},
									{kind: "onyx.Picker", name: "GPSupdatePicker", classes: "zoom-pre3 lang-picker", onSelect: "GPSUpdateInterval", components: [
										{content: '1sec', name: "gpsInterval1", value: 1},
										{content: '5sec', name: "gpsInterval5", value: 5},
										{content: '20sec', name: "gpsInterval20", value: 20},
										{content: '1min', name: "gpsInterval60", value: 60},
										{content: '5min', name: "gpsInterval300", value: 300},
										{content: '30min', name: "gpsInterval1800", value: 1800}
									]}
								]}
							]}
						]},
						{kind: "onyx.GroupboxHeader", content: $L("Map settings")},
						{ components: [
							{name: "Units", classes: "onyx-toolbar-inline", components: [
								{kind: "Image", src: "assets/help.png", classes: "labeled-item-icon", ontap: "settingsHelp", help: $L("Units for distances, directions and the scale bar")},
								{name: "labelUnits", kind: "Control", content: $L("Units")},
								{kind: "onyx.PickerDecorator", classes: "lang-picker", components: [
									{name: "unitsPickerButton", classes: "lang-picker"},
									{kind: "onyx.Picker", name: "unitsPicker", classes: "zoom-pre3 lang-picker", onSelect: "UnitsChange", components: [
										{content: $L("Metric (km)"), name: "unitsmetric", value: "metric"},
										{content: $L("Imperial (mi)"), name: "unitsimperial", value: "imperial"}
									]}
								]}
							]}
						]},
						{kind: "SettingsItem", label: $L("High DPI tiles"), showing: true, icon: "assets/help.png", help: $L("It uses the tiles for high-dpi devices (e.g. HP Pre3). Only for Google map types."), name: "retina", showing: false, defaultKind: "onyx.ToggleButton", onChange: "retinaTiles", onIconTap: "settingsHelp"},
						{kind: "SettingsItem", label: $L("Offline map tiles"), showing: false, icon: "assets/help.png", help: $L("Keeps the map tiles you have looked at, up to about 50 MB, so those areas still show without a network connection. Nothing is downloaded in advance."), name: "offlineTiles", defaultKind: "onyx.ToggleButton", onChange: "offlineTilesChange", onIconTap: "settingsHelp"},
						{kind: "SettingsItem", label: $L("Smart caching"), showing: false, icon: "assets/help.png", help: $L("Enables smart caching, tiles are loaded from local storage and every new tile is saved to local storage for future use. Needs restart."), name: "OSMMapCache", defaultKind: "onyx.ToggleButton", onChange: "cacheOSM", onIconTap: "settingsHelp"},
						{kind: "SettingsItem", label: $L("Use MapTool cache"), showing: false, icon: "assets/help.png", help: $L("If enabled, the map use the MappingTool cache in /media/internal/.MapTool directory"), name: "MapCacheExternal", defaultKind: "onyx.ToggleButton", onChange: "cacheOSM", onIconTap: "settingsHelp"},
					]}
				]},
				{name: "aboutpanel", kind: "Scroller", touch: true, fixedTime: false, showing: false, classes: "enyo-fit", components: [
					
					{kind: "onyx.Groupbox", classes: "settings", components: [
						{kind: "onyx.GroupboxHeader", content: "About"},
						{name: "aboutGroup", components: [
							
							{kind: "Image", name: "aboutIcon", style: "width: 64px; height: 64px; float: right;", src: "icon-256x256.png"},
							{content: "<span style='font-size: 22px'>" + appInfo.title + "</span>", allowHtml: true},
							{tag: "br"},
							{content: "<span style='color: gray; font-size: 16px'>v" + appInfo.version + "</span>", allowHtml: true},
							{tag: "br"},
							{name: "APIver", allowHtml: true},
							{components: [
								,
								{classes: "onyx-sample-divider", content: "Authors:"},
								{content: appInfo.vendor},
								{content: "<br>This application is trying to be a replacement of unsupported Google Maps application for WebOS devices and for LuneOS. The application is based on the Google Maps API V3 and also replaces the older Mojo version. Do you like this application? If do, you can support me in development. Thank you!<form action='https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=5CTRZJLKKUBS4&lc=CZ&item_name=Jan%20Herman&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted' target='_blank' href='https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=5CTRZJLKKUBS4&lc=CZ&item_name=Jan%20Herman&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted' method='post'><input type='image' src='assets/x-click-butcc-donate.gif' style='text-align: center' border='0' name='submit' alt='PayPal - The safer, easier way to pay online!'></form>", allowHtml: true, showing: false, name: "authorCredits"},
								{classes: "onyx-sample-divider", content: "Project page:"},
								{content: appInfo.vendor_url},
								{classes: "onyx-sample-divider", content: "License:"},
								{style: "font-size: 12px; text-align: justify", content: "Licensed under the Apache License, Version 2.0<br>You may obtain a <a href='http://www.apache.org/licenses/LICENSE-2.0'>copy of the License.</a><br>Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.", allowHtml: true}	
							]}
							
						]}
					]},
					
				]},
			]},
			{kind: "onyx.Popup", name: "settingsHelpPopUp", classes: "zoom-pre3-text", centered: true, floating: true, scrim: true},
			{kind: "onyx.Toolbar", style: "width: 320px", components: [
				{kind: "onyx.Grabber", ontap: "closePullout", components: [
					{name: "grabberText", classes: "grabber-text", allowHtml: true}
				]},
				//{fit: true},
				{kind: "onyx.Button", content: "Close", classes: "onyx-dark", style: "float: right", ontap: "closePullout"}
			]}
		]}
	],
	languages: [
		{code:"",content: "Default" },
		{code:"ar",content: "Arabic" },
		{code:"eu",content: "Basque" },
		{code:"bg",content: "Bulgarian" },
		{code:"bn",content: "Bengali" },
		{code:"ca",content: "Catalan" },
		{code:"cs",content: "Czech" },
		{code:"da",content: "Danish" },
		{code:"de",content: "German" },
		{code:"el",content: "Greek" },
		{code:"en",content: "English" },
		{code:"en-AU",content: "English (Australian " },
		{code:"en-GB",content: "English (Greatbritain " },
		{code:"es",content: "Spanish" },
		{code:"fa",content: "Farsi" },
		{code:"fi",content: "Finnish" },
		{code:"fil",content: "Filipino" },
		{code:"fr",content: "French" },
		{code:"gl",content: "Galician" },
		{code:"gu",content: "Gujarati" },
		{code:"hi",content: "Hindi" },
		{code:"hr",content: "Croatian" },
		{code:"hu",content: "Hungarian" },
		{code:"id",content: "Indonesian" },
		{code:"it",content: "Italian" },
		{code:"iw",content: "Hebrew" },
		{code:"ja",content: "Japanese" },
		{code:"kn",content: "Kannada" },
		{code:"ko",content: "Korean" },
		{code:"lt",content: "Lithuanian" },
		{code:"lv",content: "Latvian" },
		{code:"ml",content: "Malayalam" },
		{code:"mr",content: "Marathi" },
		{code:"nl",content: "Dutch" },
		{code:"no",content: "Norwegian" },
		{code:"pl",content: "Polish" },
		{code:"pt",content: "Portuguese" },
		{code:"pt-BR",content: "Portuguese (Brazil " },
		{code:"pt-PT",content: "Portuguese (Portugal " },
		{code:"ro",content: "Romanian" },
		{code:"ru",content: "Russian" },
		{code:"sk",content: "Slovak" },
		{code:"sl",content: "Slovenian" },
		{code:"sr",content: "Serbian" },
		{code:"sv",content: "Swedish" },
		{code:"tl",content: "Tagalog" },
		{code:"ta",content: "Tamil" },
		{code:"te",content: "Telugu" },
		{code:"th",content: "Thai" },
		{code:"tr",content: "Turkish" },
		{code:"uk",content: "Ukrainian" },
		{code:"vi",content: "Vietcontentse" },
		{code:"zh-CN",content: "Chinese (Simplified " },
		{code:"zh-TW",content: "Chinese (Traditional " },
		{code:"zh-HK",content: "Chinese (Hong Kong " }
	],
	max: 320,
	min: 0,
	value: 320,
	unit: "px",
	overMoving: false,
	toggle: function(inPanelName) {
		var t = this.$[inPanelName];
		if (t.showing && this.isAtMin()) {
			this.animateToMax();
		} else {
			this.animateToMin();
			this.$.maptypepanel.hide();
			this.$.layerspanel.hide();
			this.$.bookmarkpanel.hide();
			this.$.directpanel.hide();
			this.$.settingspanel.hide();
			this.$.aboutpanel.hide();
			t.show();
		}
	},
	create: function() {
		this.inherited(arguments);

		/* Map types offered by the engine */
		var types = mapEngine.mapTypes();
		for (var i = 0; i < types.length; i++) {
			if (types[i].header) {
				this.$.mapType.createComponent({kind: "onyx.GroupboxHeader", content: types[i].header}, {owner: this});
			} else {
				this.$.mapType.createComponent({kind: "LabeledItem", name: "mapType" + types[i].id, label: types[i].label, mapType: types[i].id, isRetina: types[i].isRetina, icon: types[i].icon}, {owner: this});
			}
		}

		/* Engines to choose from */
		var engines = MapEngines.list();
		for (var j = 0; j < engines.length; j++) {
			this.$.enginePicker.createComponent({content: engines[j].label, engine: engines[j].id, active: engines[j].id == mapEngine.id}, {owner: this});
		}
		this.$.enginePickerButton.setContent(mapEngine.label);
	},
	pulloutInit: function() {
		
	/* declare variables */	
	this.route = [];

	/* Set inital checkboxes */
	var current = this.$["mapType" + String(Prefs.mapType).replace(/_HDPI$/, "")];
	if (current) {
		current.checked = true;
		current.inputChanged();
	};

	/* Show only what the engine supports */
	this.$.trafficToggle.setShowing(!!mapEngine.layers.traffic);
	this.$.transitToggle.setShowing(!!mapEngine.layers.transit);
	this.$.bikeToggle.setShowing(!!mapEngine.layers.bike);
	var modes = ["DRIVING", "WALKING", "TRANSIT", "BICYCLING"];
	for (var m = 0; m < modes.length; m++) {
		this.$["travel" + modes[m]].setShowing(enyo.indexOf(modes[m], mapEngine.travelModes) >= 0);
	}
	this.$.routeAlternativesToggle.setShowing(!!mapEngine.routeOptions.provideRouteAlternatives);
	this.$.routeAlternativesToggle.setValue(!!mapEngine.routeOptions.provideRouteAlternatives);
	this.$.avoidTollsToggle.setShowing(!!mapEngine.routeOptions.avoidTolls);
	this.$.avoidHighwaysToggle.setShowing(!!mapEngine.routeOptions.avoidHighways);
	this.$.retina.setShowing(mapEngine.id == "google");
    
		/* Sets the Language picker */
		try {
			var langIndex = findWithAttr(this.languages, 'code', Prefs.lang);

			this.$.langPickerButton.setContent(this.languages[langIndex].content);
			} catch (e) {
			this.$.langPickerButton.setContent("Default");	
		};
		
		/* Sets the units picker */
	var units = this.$["units" + Prefs.lengthUnits] || this.$.unitsmetric;
	units.setActive(true);
	this.$.unitsPickerButton.setContent(units.content);

	/* Sets the GPS update interval picker */
		var name = "gpsInterval" + Prefs.GPSinterval;
		this.$[name].setActive(true);
		
		/* Init available settings */
		
		/* the download manager tile cache is the Google engine's, on legacy webOS */
		if(enyo.platform.webos && mapEngine.id == "google") this.$.OSMMapCache.show();
		if(enyo.platform.webos && mapEngine.id == "google" && Prefs.OSMMapCache) this.$.MapCacheExternal.show();
		this.$.offlineTiles.setShowing(mapEngine.id == "osm" && TileCache.supported());
		this.$.offlineTiles.value = Prefs.offlineTiles;
		this.$.offlineTiles.inputChanged();
		if(enyo.platform.webos) this.$.FullscreenToggle.show();
		if(enyo.platform.webos) this.$.authorCredits.show();
		
		this.$.retina.value = Prefs.retina;
		this.$.retina.inputChanged();
		this.$.OSMMapCache.value = Prefs.OSMMapCache;
		this.$.OSMMapCache.inputChanged();
		this.$.MapCacheExternal.value = Prefs.MapCacheExternal;
		this.$.MapCacheExternal.inputChanged();
		
		/* Sets the layer toggles */
		this.$.trafficToggle.checked = Prefs.layers.traffic;
		this.$.trafficToggle.inputChanged();
		this.$.transitToggle.checked = Prefs.layers.transit;
		this.$.transitToggle.inputChanged();
		this.$.bikeToggle.checked = Prefs.layers.bike;
		this.$.bikeToggle.inputChanged();
		
		//this.$.moreOptionsCollapsible.toggleOpen();

	},
	togglePlaces: function(inSender) {

		var panel = this.$[inSender.panel];
		var name = this.$[inSender.name];

			this.$.currentlist.hide();
			//this.$.recentslist.hide();
			this.$.savedlist.hide();
			this.$.savedEmpty.hide();
			//this.$.detailspanel.hide();		
			panel.show();
			if (name) name.setActive(true);
	},
	openPullout: function(inPanelName){
			var t = this.$[inPanelName];
			this.animateToMin();
			this.$.maptypepanel.hide();
			this.$.layerspanel.hide();
			this.$.bookmarkpanel.hide();
			this.$.directpanel.hide();
			this.$.settingspanel.hide();
			this.$.aboutpanel.hide();
			t.show();

	},
	closePullout: function(inPanelName){
			this.animateToMax();	
	},
	setGrabberText: function(version){
			this.$.grabberText.setContent(version);	
	},
	valueChanged: function() {
		this.inherited(arguments);
		this.$.shadow.setShowing(this.value !== this.max);
	},
	showTransitChange: function(inSender) {
		this.doShowTransit({value: inSender.getValue()});
	},
	showTrafficChange: function(inSender) {
		this.doShowTraffic({value: inSender.getValue()});
	},
	showBicyclingChange: function(inSender) {
		this.doShowBicycling({value: inSender.getValue()});
	},	
	mapTypeChange: function(inSender, inEvent) {
		var o = inEvent.originator;
		this.doMapTypeSelect({mapType: o.parent.mapType, isRetina: o.parent.isRetina});
	},
	itemSelect: function(inSender, inEvent) {
		this.doBookmarkSelect({item: inEvent.item});
	},
	setSearchData: function(markers) {
		this.$.markerCount.setContent(markers.length);
	    this.results = markers;
	    this.$.currentlist.setCount(this.results.length);
	    this.$.currentlist.refresh();
	    this.$.currentlist.reset();
	    this.togglePlaces({panel: "currentlist"});
        this.$.current.setActive(true);
	},
	setupSearchData: function(inSender, inEvent) {
	    var i = inEvent.index;
	    var item = this.results[i].place;
	    var imageUrl;

	    this.$.listItem.setItemName(item.name);
	    
	    if (item.lunetype == "mylocation") {
			var date = new ilib.Date();		
			item.formatted_address = $L("Loc: ") + item.geometry.location.toUrlValue(8);
		};
	
	    this.$.listItem.setItemAddress(item.formatted_address);
	    
	    if (item.photos) {
			this.$.listItem.setItemIcon(item.photos[0].getUrl({'maxWidth': 100, 'maxHeight': 100}));
		} else if (item.icon.contains("geocode-71")) {
			/* use marker icon instead of ugly default google pin image */
			this.$.listItem.setItemIcon(this.results[i].iconUrl);
		} else {
			/* use place icon */
			this.$.listItem.setItemIcon(item.icon);
		};
		this.$.listItem.setItemDistance(getDistanceInCorrectUnits(item.distance));
		this.$.listItem.setItemRating(item.rating);

	    var selected = inSender.isSelected(i);
	    this.$.listItem.setSelected(selected);
	    if(selected && !selectMode){
	      	mapEngine.panTo(item.geometry.location);
		mapEngine.setZoom(17);

        	//this.setPlaceDetails(item);
	    } else if (selected && selectMode) {
			this.doFillDirectField(item);
		};
	},

	EngineChange: function(inSender, inEvent) {
		var engine = inEvent.selected.engine;
		if (engine == mapEngine.id) return;
		this.$.enginePickerButton.setContent(inEvent.selected.content);
		this.doEngineChange({value: engine});
	},
	showSaved: function(inSender) {
		this.saved = SavedPlaces.load();
		this.togglePlaces({panel: "savedlist", name: "saved"});
		this.$.savedlist.setCount(this.saved.length);
		this.$.savedlist.reset();
		this.$.savedEmpty.setShowing(this.saved.length === 0);
	},
	setupSavedData: function(inSender, inEvent) {
		var i = inEvent.index;
		var place = SavedPlaces.toPlace(this.saved[i]);

		this.$.savedItem.setItemName(place.name);
		this.$.savedItem.setItemAddress(place.formatted_address);
		this.$.savedItem.setItemIcon(place.icon);
		this.$.savedItem.setItemDistance(getDistanceInCorrectUnits(mapEngine.distance(mapEngine.getCenter(), place.geometry.location)));
		this.$.savedItem.setItemRating("");

		var selected = inSender.isSelected(i);
		this.$.savedItem.setSelected(selected);
		if (selected && !selectMode) {
			this.doSavedSelect({place: place});
		} else if (selected && selectMode) {
			this.doFillDirectField(place);
		};
	},
	UnitsChange: function(inSender, inEvent) {
		this.$.unitsPickerButton.setContent(inEvent.selected.content);
		this.doUnitsChange({value: inEvent.selected.value});
	},
	LanguageChange: function(inSender) {
		var code = this.languages[this.$.langPicker.getSelected()].code;
		this.$.langNotice.show();
		this.doLanguageChange({value: code});	
	},
	setupLangs: function(inSender, inEvent) {
		this.$.language.setContent(this.languages[inEvent.index].content);
		return true;
	},
	setSomething: function(what, param, value) {
		this.$[what].active = value;
	},
	GPSUpdateInterval: function(inSender, inEvent) {
		this.doSavePrefs({prefs: {GPSinterval: inEvent.selected.value}});
	},
	offlineTilesChange: function(inSender, inEvent) {
		this.doSavePrefs({prefs: {offlineTiles: inSender.getValue()}});
		TileCache.update();
	},
	cacheOSM: function(inSender, inEvent) {
		this.doCacheOSM({value: inSender.getValue(), property: inSender.name});
		this.$.MapCacheExternal.setShowing(this.$.OSMMapCache.getValue());
		
	},
	retinaTiles: function(inSender, inEvent) {
		this.doSavePrefs({prefs: {retina: inSender.getValue()}});
		Prefs.retina = inSender.getValue();
		if (this.$.mapType.getActive().owner.isRetina) this.doMapTypeSelect({mapType: this.$.mapType.getActive().owner.mapType, isRetina: inSender.getValue()});	
	},
	settingsHelp: function(inSender, inEvent) {
		this.$.settingsHelpPopUp.setContent(inSender.help);
		this.$.settingsHelpPopUp.show();
		
	},
	Fullscreen: function(inSender, inEvent) {	
		if (enyo.platform.webos) enyo.webos.setFullScreen(inEvent.value);
	},
	getPanelNode: function(inSender, inEvent) {	
		return this.$.directions.node;
	},
	setDirectOptions: function(inSender, inEvent) {
		
		var request = {};
		
		try {
			request[inSender.param] = inSender.getValue();
			} catch (e) {
			request[inSender.param] = inSender.value;
		};
		
		this.doDirectOptions({params: request, route: this.route});
	},
	setDirectData: function(response, inIndex) {
	    
	    var index = inIndex || 0;
	    var chosen = response.routes[index];
	    this.route = MapEngines.routeSteps(chosen);
	    this.setRouteChoices(response, index);
	    this.$.guidanceButton.show();

	    this.$.directions.setCount(this.route.length);
	    this.$.directions.reset();
	    
	    this.doSetDirectStep(this.route[0]);
	        
	    this.$.directWarnings.hide();
	    this.$.directCopyrights.hide();
	    
	    var warnings = "";
	    for (var i = 0, warning; warning = chosen.warnings[i]; i++) {
			warnings += " " + warning;
		};
	    if (chosen.warnings.length > 0) {
			this.$.directWarnings.setContent(warnings);
			this.$.directWarnings.show();
		};
		
		if (chosen.copyrights) {
			this.$.directCopyrights.setContent(chosen.copyrights);
			this.$.directCopyrights.show();
		};
	},
	/* "1 · 47 min · 52 km", the chosen route highlighted */
	setRouteChoices: function(response, index) {
		this.$.routeChoices.destroyClientControls();
		var routes = response ? response.routes : [];
		if (routes.length > 1) {
			for (var r = 0; r < routes.length; r++) {
				var leg = MapEngines.routeSummary(routes[r]);
				this.$.routeChoices.createComponent({
					kind: "onyx.Button",
					name: "routeChoice" + r,
					classes: "route-choice" + (r == index ? " onyx-blue" : ""),
					content: (r + 1) + " \u00b7 " + leg.duration.text + " \u00b7 " + leg.distance.text,
					routeIndex: r,
					ontap: "routeChoiceTap"
				}, {owner: this});
			}
			this.$.routeChoices.render();
		}
		this.$.routeChoices.setShowing(routes.length > 1);
	},
	/* inStops: [{location, name}] */
	setStops: function(inStops) {
		this.$.routeStops.destroyClientControls();
		for (var s = 0; s < inStops.length; s++) {
			this.$.routeStops.createComponent({classes: "route-stop", components: [
				{classes: "route-stop-name", content: $LF("Stop {n}: {name}", {n: s + 1, name: inStops[s].name})},
				{kind: "onyx.Button", name: "removeStop" + s, classes: "route-stop-remove", content: "\u00d7", stopIndex: s, ontap: "removeStopTap"}
			]}, {owner: this});
		}
		this.$.routeStops.setShowing(inStops.length > 0);
		this.$.routeStops.render();
	},
	removeStopTap: function(inSender) {
		this.doRemoveStop({index: inSender.stopIndex});
		return true;
	},
	guidanceTap: function() {
		this.doGuidanceToggle();
		return true;
	},
	setGuidanceActive: function(inActive) {
		this.$.guidanceButton.setContent(inActive ? $L("Stop voice guidance") : $L("Start voice guidance"));
		this.$.guidanceButton.addRemoveClass("onyx-affirmative", !inActive);
		this.$.guidanceButton.addRemoveClass("onyx-negative", inActive);
	},
	routeChoiceTap: function(inSender) {
		this.doRouteSelect({index: inSender.routeIndex});
		return true;
	},
	clearDirectData: function() {
		this.route = [];
		this.setRouteChoices(null, 0);
		this.$.guidanceButton.hide();
		this.$.directions.setCount(0);
	    this.$.directions.reset();	        
	    this.$.directWarnings.hide();
	    this.$.directCopyrights.hide();
		
	}, 
	setupDirectData: function(inSender, inEvent) {		

	    var i = inEvent.index;

	    var item = this.route[i];
	    item.step = i;

	    this.$.listItemStep.setItemInstructions(item.instructions);
	    this.$.listItemStep.setItemDistance(item.distance.text);
	    this.$.listItemStep.setItemStep(i);
	    if (item.maneuver) { 
			this.$.listItemStep.setItemIcon(item.maneuver);
		} else {
			this.$.listItemStep.setItemIcon("straight");
		};

	    var selected = inSender.isSelected(i);
	    this.$.listItemStep.setSelected(selected);
	    if(selected){
		  this.doSetDirectStep(item);
	      mapEngine.panTo(item.start_location);
	      
	    };
	},
	
	goToStep: function(step) {
	   this.$.directions.select(step);
	   var selected = this.$.directions.getIndexPosition(step);
	   this.$.directpanel.setScrollTop(selected.top - 40);
	   return this.route[step];	  
	},

activateWarningsDrawer: function (inSender, inEvent) {
	
	this.toggleClass(inSender, "wrap-text");
	
},

toggleClass: function (inSender, inClass) {
		
	inSender.addRemoveClass(inClass, !inSender.classes.contains(inClass));
	
},

test: function (inSender, inEvent) {
		
  
        enyo.log("inSender", inSender);
        enyo.log("inEvent", inEvent);
        
        inSender.parent.hide();

  
},
});
