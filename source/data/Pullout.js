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
		onShowWeather: "",
		onMapTypeSelect: "",
		onCacheOSM: "",
		onBookmarkSelect: "",
		onLanguageChange: "",
		onDirectOptions: "",
		onFillDirectField: "",
		onSetDirectStep: "",
		onSavePrefs: ""
	},
	components: [
		{name: "shadow", classes: "pullout-shadow"},
		{kind: "FittableRows", classes: "enyo-fit", components: [
			{name: "client", classes: "pullout-toolbar"},
			{fit: true, style: "position: relative;", components: [
				
				{name: "maptypepanel", kind: "Scroller", touch: true, fixedTime: false, showing: true, classes: "enyo-fit", components: [
					
					{name: "mapType", kind: "Group", classes: "onyx-groupbox settings", highlander: true, onchange: "mapTypeChange", components: [
						{kind: "onyx.GroupboxHeader", content: $L("Map Type (Google)")},
						{kind: "LabeledItem", name: "Road", label: $L("Roadmap"), mapType: "ROADMAP", isRetina: true, icon: "assets/map-type-road.png"},
						{kind: "LabeledItem", name: "Satellite", label: $L("Satellite"), mapType: "SATELLITE", isRetina: false, icon: "assets/map-type-satellite.png"},
						{kind: "LabeledItem", name: "Hybrid", label: $L("Hybrid"), mapType: "HYBRID", isRetina: true, icon: "assets/map-type-hybrid.png"},
						{kind: "LabeledItem", name: "Terrain", label: $L("Terrain"), mapType: "TERRAIN", isRetina: true, icon: "assets/map-type-terrain.png"},
						{kind: "onyx.GroupboxHeader", content: $L("Map Type (Others)")},
						{kind: "LabeledItem", name: "OSM", label: $L("OpenStreetMap"), mapType: "OSM", isRetina: false, icon: "assets/map-type-osm.png"},
						{kind: "LabeledItem", name: "OCM", label: $L("OpenCycleMap"), mapType: "OCM", isRetina: false, icon: "assets/map-type-ocm.png"},
						{kind: "LabeledItem", name: "NokiaHere", label: $L("Nokia Maps"), mapType: "NOKIA", isRetina: false, icon: "assets/map-type-nokia.jpg"},
						{kind: "LabeledItem", name: "Yandex", label: $L("Yandex Maps"), mapType: "Yandex", isRetina: false, icon: "assets/map-type-yandex.png"}
						/* NOT LEGAL MAP TYPES
						{kind: "LabeledItem", name: "Bing", label: $L("Bing Maps"), mapType: "Bing", isRetina: false, icon: "assets/map-type-bing-road.png"},
						{kind: "LabeledItem", name: "Wikimapia", label: $L("Wikimapia"), mapType: "Wikimapia", isRetina: false, icon: "assets/map-type-bing-road.png"},
						{kind: "LabeledItem", name: "2GIS", label: $L("2GIS"), mapType: "2GIS", isRetina: false, icon: "assets/map-type-bing-road.png"},
						{kind: "LabeledItem", name: "Visicom", label: $L("Visicom"), mapType: "Visicom", isRetina: false, icon: "assets/map-type-bing-road.png"},
						{kind: "LabeledItem", name: "Apple", label: $L("Apple"), mapType: "Apple", isRetina: false, icon: "assets/map-type-bing-road.png"}
						*/
					]}
					
				]},
				{name: "layerspanel", kind: "Scroller", touch: true, fixedTime: false, showing: false, classes: "enyo-fit", components: [
					
					{kind: "onyx.Groupbox", classes: "settings", components: [
						{kind: "onyx.GroupboxHeader", content: "Layers"},
						{kind: "LabeledItem", label: $L("Traffic"), name: "trafficToggle", icon: "assets/icon-traffic.png", defaultKind: "onyx.ToggleButton", onChange: "showTrafficChange"},
						{kind: "LabeledItem", label: $L("Transit"), name: "transitToggle", icon: "assets/icon-transit.png", defaultKind: "onyx.ToggleButton", onChange: "showTransitChange"},
						{kind: "LabeledItem", label: $L("Bike"), name: "bikeToggle", icon: "assets/icon-bicycle.png", defaultKind: "onyx.ToggleButton", onChange: "showBicyclingChange"},
						{kind: "LabeledItem", label: $L("Weather"), name: "weatherToggle", icon: "assets/icon-weather.png", defaultKind: "onyx.ToggleButton", onChange: "showWeatherChange"}
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
						{content: $L("Saved"), name: "saved", disabled: true, panel: "savedlist", ontap: "togglePlaces"}
						//{content: $L("Details"), name: "details", panel: "detailspanel", ontap: "togglePlaces"},
					]},
					
					{kind: "Scroller", touch: true, fixedTime: false, horizontal: "hidden", classes: "enyo-fit", style: "top: 100px", components: [
							{kind: "List", name: "currentlist", onSetupItem: "setupSearchData", showing: false, reorderable: false, enableSwipe: false, components: [
								{kind: "SearchListItem", name:"listItem", ontap: "", content: ""}
							]},
							{kind: "List", name: "recentslist", onSetupItem: "", showing: false, components: [
								//{kind: "SearchListItem", name:"listItem", content: ""}
							]},
							{kind: "List", name: "savedlist", onSetupItem: "", showing: false, components: [
								//{kind: "SearchListItem", name:"listItem", content: ""}
							]}
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
							
							{param: "travelMode", value: "DRIVING", active: true, ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -40px", active: true}
								]},
							{param: "travelMode", value: "WALKING", ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -120px"}
								]},
							{param: "travelMode", value: "TRANSIT", ontap: "setDirectOptions", components: [
								{kind: "onyx.Icon", src: "assets/travel-mode-sprite.png", style: "background-position-y: -80px"}
								]},
							{param: "travelMode", value: "BICYCLING", ontap: "setDirectOptions", components: [
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
						{kind: "SettingsItem", label: $L("Fullscreen"), showing: false, icon: "assets/help.png", help: $L("Switch between fullscreen and normal mode"), name: "FullscreenToggle", defaultKind: "onyx.ToggleButton", onChange: "Fullscreen", onIconTap: "settingsHelp"},
						//{kind: "LabeledItem", label: "Language", icon: "assets/icon-traffic.png", defaultKind: "onyx.ToggleButton", onChange: "LanguageChange"},
						{ components: [
							{name: "Lang", classes: "onyx-toolbar-inline", components: [
								{kind: "Image", src: "assets/help.png", classes: "labeled-item-icon", ontap: "settingsHelp", help: $L("Overrides Google API and app language, needs application restart")},
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
						{kind: "SettingsItem", label: $L("High DPI tiles"), showing: true, icon: "assets/help.png", help: $L("It uses the tiles for high-dpi devices (e.g. HP Pre3). Only for Google map types."), name: "retina", defaultKind: "onyx.ToggleButton", onChange: "retinaTiles", onIconTap: "settingsHelp"},
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
	pulloutInit: function() {
		
	/* declare variables */	
	this.route = [];

	/* Set inital checkboxes */
	switch (Prefs.mapType) {
	  case "ROADMAP":
      case "ROADMAP_HDPI":
		this.$.Road.checked = true;
		this.$.Road.inputChanged();
        break;
      case "OSM":
        this.$.OSM.checked = true;
		this.$.OSM.inputChanged();
        break;
      case "OCM":
        this.$.OCM.checked = true;
		this.$.OCM.inputChanged();
        break;
      case "NOKIA":
        this.$.NokiaHere.checked = true;
		this.$.NokiaHere.inputChanged();
        break;
      case "SATELLITE":
        this.$.Satellite.checked = true;
		this.$.Satellite.inputChanged();
        break;
      case "HYBRID":
      case "HYBRID_HDPI":
		this.$.Hybrid.checked = true;
		this.$.Hybrid.inputChanged();
        break;
      case "TERRAIN":
      case "TERRAIN_HDPI":
        this.$.Terrain.checked = true;
		this.$.Terrain.inputChanged();
        break;
    };
    
		/* Sets the Language picker */
		try {
			var langIndex = findWithAttr(this.languages, 'code', Prefs.lang);

			this.$.langPickerButton.setContent(this.languages[langIndex].content);
			} catch (e) {
			this.$.langPickerButton.setContent("Default");	
		};
		
		/* Sets the GPS update interval picker */
		var name = "gpsInterval" + Prefs.GPSinterval;
		this.$[name].setActive(true);
		
		/* Init available settings */
		
		if(enyo.platform.webos) this.$.OSMMapCache.show();
		if(enyo.platform.webos && Prefs.OSMMapCache) this.$.MapCacheExternal.show();	
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
		this.$.weatherToggle.checked = Prefs.layers.weather;
		this.$.weatherToggle.inputChanged();
		
		//this.$.moreOptionsCollapsible.toggleOpen();

	},
	togglePlaces: function(inSender) {

		var panel = this.$[inSender.panel];
		var name = this.$[inSender.name];

			this.$.currentlist.hide();
			//this.$.recentslist.hide();
			this.$.savedlist.hide();
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
	showWeatherChange: function(inSender) {
		this.doShowWeather({value: inSender.getValue()});
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
			this.$.listItem.setItemIcon(this.results[i].icon.url);
		} else {
			/* use place icon */
			this.$.listItem.setItemIcon(item.icon);
		};
		this.$.listItem.setItemDistance(getDistanceInCorrectUnits(item.distance));
		this.$.listItem.setItemRating(item.rating);

	    var selected = inSender.isSelected(i);
	    this.$.listItem.setSelected(selected);
	    if(selected && !selectMode){
	      	map.panTo(item.geometry.location);
        	 try {
				map.fitBounds(place.geometry.viewport);
			  } catch (error) {
				map.setZoom(17);
			  };

        	//this.setPlaceDetails(item);
	    } else if (selected && selectMode) {
			this.doFillDirectField(item);
		};
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
		this.doSavePrefs({GPSinterval: inEvent.selected.value});
	},
	cacheOSM: function(inSender, inEvent) {
		this.doCacheOSM({value: inSender.getValue(), property: inSender.name});
		this.$.MapCacheExternal.setShowing(this.$.OSMMapCache.getValue());
		
	},
	retinaTiles: function(inSender, inEvent) {
		this.doSavePrefs({retina: inSender.getValue()});
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
	setDirectData: function(response) {
	    
	    this.route = response.routes[0].legs[0].steps;

	    this.$.directions.setCount(this.route.length);
	    this.$.directions.reset();
	    
	    this.doSetDirectStep(this.route[0]);
	        
	    this.$.directWarnings.hide();
	    this.$.directCopyrights.hide();
	    
	    var warnings = "";
	    for (var i = 0, warning; warning = response.routes[0].warnings[i]; i++) {
			warnings += " " + warning;
		};
	    if (response.routes[0].warnings.length > 0) {
			this.$.directWarnings.setContent(warnings);
			this.$.directWarnings.show();
		};
		
		if (response.routes[0].copyrights) {
			this.$.directCopyrights.setContent(response.routes[0].copyrights);
			this.$.directCopyrights.show();
		};
	},
	clearDirectData: function() {
		this.route = [];
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
	      map.panTo(item.start_location);
	      
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
